import { Component, NgZone, OnInit } from '@angular/core';
import { OdooJsonRpcService } from '../services/inventario.service';
import { DatosService } from '../services/datos.service';
import { map, switchMap } from 'rxjs';
import { takeCoverage } from 'v8';
import e from 'express';
import { version } from 'os';

@Component({
  selector: 'app-entransito',
  standalone: true,
  imports: [],
  templateUrl: './entransito.component.html',
  styleUrl: './entransito.component.css'
})
export class EntransitoComponent implements OnInit{
  datos:any [] = [];

  constructor(private odooConsulta: OdooJsonRpcService,private datosService:DatosService,private ngzone:NgZone){}

  materialDone(event:Event) {
    let datos:any = [];
    let rowTable = (event.target as HTMLInputElement).closest('tr')

    //Obtiene la fecha
    const now = new Date();
    const day = now.getDate(); 
    const month = now.getMonth() + 1; 
    const year = now.getFullYear(); 
    const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

    //datos a imprimir
    const orden = Number(rowTable?.children[0].textContent);
    const version = Number(rowTable?.children[1].textContent);
    const proveedor = rowTable?.children[2].textContent;
    const codigo = Number(rowTable?.children[3].textContent);
    const descripcion = String(rowTable?.children[4].textContent);
    const fecha = formattedDate;
    const cantidad_solicitada = Number(rowTable?.children[6].textContent);
    const cantidad = Number((rowTable?.children[7].children[0] as HTMLInputElement).value);
    const factura = (rowTable?.children[8].children[0] as HTMLInputElement).value;
    const notas = (rowTable?.children[9].children[0] as HTMLInputElement).value;
   
    let uid:number;
    let ot_id:number
    let control_entradas_id:number;   
    let encontrado:boolean; 
   
    // console.log(
    //   String(orden)
    //   ,version
    //   ,proveedor
    //   ,codigo
    //   ,descripcion
    //   ,fecha
    //   ,cantidad
    //   ,cantidad_solicitada
    //   ,factura
    //   ,notas
    // );
    // //Actualiza información y pasa los items correspondientes en el modulo dtm_control_recibido
    this.odooConsulta.authenticate().pipe(
      // se obtiene el id de la orden de servicios y versión de la misma
      switchMap(getuid=> this.odooConsulta.read(getuid,[['ot_number','=',orden],['revision_ot','=',version]],'dtm.odt',['id'],0).pipe(
          map(result => {
            console.log('odt',result);
            uid = getuid;
            ot_id = result.length>0?result[0].id:null
          })
        ),
      ),     
      // se lee COMPRAS REALIZADO para cambiar su status a comprado
      switchMap(() => 
        this.odooConsulta.read(uid,
          [
            ['orden_trabajo','=',String(orden)],
            ['revision_ot','=',version],
            ['proveedor','=',proveedor],
            ['codigo','=',codigo],
            ['nombre','=',descripcion],            
            ['cantidad','=',cantidad_solicitada],
          ],
          'dtm.compras.realizado',
          ['id'],
          1).pipe(
            map(result => {
              console.log('compras realizado',result)               
              if(result.length>0){  
                console.log(result[0].id);
                encontrado = true;
                this.odooConsulta.update(uid,
                result[0].id,
                'dtm.compras.realizado',
                {
                  'cantidad_almacen':cantidad,
                  'comprado':'Recibido'
                }).subscribe()            
              }else{
                alert("Item no encontrado en Compras Realizadas");
                encontrado = false;
               
              }
            })
          )
      ),
      // lee la tabla de MATERIALES para actualizar cantidad y apartado
      switchMap(() => this.odooConsulta.read(uid,[['id','=',codigo]],'dtm.materiales',['id','cantidad','apartado'],1).pipe(
          map((result:any)=>{
            if(result.length > 0 && encontrado == true){
              console.log('materiales',result);
              this.odooConsulta.update(uid,
                codigo,
                'dtm.materiales',
                {'cantidad':result[0].cantidad + cantidad ,
                  'disponible':result[0].cantidad + cantidad - result[0].apartado>0?result[0].cantidad + cantidad - result[0].apartado:0,
                }).subscribe(()=> alert(`Código: ${codigo}\nTabla: Materiales\nAgregado: ${cantidad}\nTotal: ${result[0].cantidad + cantidad}`))                  
            }
          })
          
        )
      ),
      // mete el material a la orden correspondiente
      switchMap(()=> this.odooConsulta.read(uid,[['materials_list','=',codigo],['model_id','=',ot_id]],'dtm.materials.line',['id','materials_cuantity'],1).pipe(
          map(result=>{
            if(result.length>0 && encontrado == true){
              console.log('materials_list',result);
              this.odooConsulta.update(uid,result[0].id,
                'dtm.materials.line',
                {'materials_required':cantidad_solicitada - cantidad,'materials_availabe':result[0].materials_availabe + cantidad}
              ).subscribe(()=> alert(`Materiales\nOrden: ${orden}\nCódigo: ${codigo}\nCantidad: ${cantidad}`))  
            }
          })
        )
      ),
      // busca si el material está en CONSUMIBLES y se ingresa al stock
      switchMap(()=> this.odooConsulta.read(uid,[['id','=',codigo]],'dtm.consumibles',['cantidad'],1).pipe(
          map(result_consumibles=>{
            if(result_consumibles.length>0 && encontrado == true){
              console.log('Consumibles',result_consumibles);
              this.odooConsulta.update(uid,codigo,
                'dtm.consumibles',
                {
                  'cantidad':result_consumibles[0].cantidad + cantidad ,                      
                }
              ).subscribe(()=> alert(`Código: ${codigo}\nTabla: Consumibles\nAgregado: ${cantidad}\nTotal: ${result_consumibles[0].cantidad + cantidad}`))
            }
          })
        )
      ),
      // busca si el material está en HERRAMIENTAS y se ingresa al stock
      switchMap(()=> this.odooConsulta.read(uid,[['nombre','ilike',descripcion.replace(/[.\s]+$/, '')]],'dtm.herramientas',['id','cantidad'],1).pipe(
          map(result=>{
            if(result.length > 0 && encontrado == true){
              console.log('Herramientas',result);
              this.odooConsulta.update(uid,result[0].id,
                'dtm.herramientas',
                {
                  'cantidad':result[0].cantidad + cantidad ,                      
                }
              ).subscribe(()=> alert(`Código: ${codigo}\nTabla: Herramientas\nAgregado: ${cantidad}\nTotal: ${result[0].cantidad + cantidad}`))
            }
          })
        )
      ),
      // pasa la información al historial dtm_control_recibido
      switchMap(()=> this.odooConsulta.create(uid,
        'dtm.control.recibido',
        {
          'cantidad':cantidad,
          'cantidad_real':cantidad_solicitada,
          'proveedor':proveedor,
          'codigo':codigo,
          'descripcion':descripcion,
          'fecha_recepcion':fecha,
          'fecha_real':formattedDate,
          'orden_trabajo':orden,
          'factura':factura,
          'motivo':notas
        }).pipe(
          map(result=>{
            console.log(result);
           
          })
        )
      ),
       // se obtiene el id del modelo de CONTROL DE ENTRADAS para poder borrarlo despues del ingreso del material
      switchMap(()=>  this.odooConsulta.read(uid,[['orden_trabajo','=',orden],['revision_ot','=',version],
        ['proveedor','=',proveedor],['codigo','=',codigo],['descripcion','=',descripcion],
        ['cantidad','=',cantidad_solicitada]],
        'dtm.control.entradas',
        ['id'],
        0).pipe(
          map(result=> {
            console.log('control',result);
            if(result.length > 0 && encontrado == true){
              this.odooConsulta.delete(uid,'dtm.control.entradas',[result[0].id]).subscribe(result=>console.log(result))
            }else{
              alert("Item no encontrado en Control de Entradas")
            }
          })
        )
      ),
    ).subscribe(() => {
        this.fetchData();
      })
  }
  //Configuración inicial
  ngOnInit(): void {
    this.fetchData()
    this.ngzone.runOutsideAngular(()=>{
      setInterval(() => {
        this.ngzone.run(()=>{
          this.fetchData();    
        })
      }, 5000);
    }) 
    
  }

  fetchData(){
     // Consulta de todos los items   
    // Obserbable para ocultar esta tabla de items
    this.odooConsulta.authenticate().subscribe(uid =>{
      this.odooConsulta.read(uid,[['id','!=','0']],'dtm.control.entradas',['id','orden_trabajo', 'proveedor','codigo','descripcion',
        'cantidad','fecha_recepcion','fecha_real','factura','revision_ot'],0).subscribe(datos =>{
          this.datosService.setControlEntradas(datos);
      })
    });      
     
      // Obserbable tabla de items
    this.datosService.controlEntradas$.subscribe(datos=>{
      this.datos = datos;
    })
  }

  ordenUpdate(uid:number,orden_trabajo:number,codigo:number,cantidad:number):void{

    this.odooConsulta.read(uid,[['ot_number','=',orden_trabajo]],"dtm.odt",['id'],20).subscribe(result => {
        if(result[0]){//Inserta el material solicitado a la orden correspondiente y actualiza el inventario
          this.odooConsulta.read(uid,[['model_id','=',parseInt(result[0].id)],['materials_list.id','=',codigo]],'dtm.materials.line',
          ['id','materials_required','materials_availabe'],20).subscribe(modelId =>{
            //Resta el material requerido del material solicitado
            //Material de la orden (puede ser solicitado en varias ordenes)
            // console.log('modelId',modelId)
            let requerido = modelId[0].materials_required;                      
            this.odooConsulta.update(uid,modelId[0].id,'dtm.materials.line',              
              {'materials_required':cantidad>=modelId[0].materials_required?0:modelId[0].materials_required,'materials_availabe':modelId[0].materials_availabe + modelId[0].materials_required }).subscribe(update=>{
                //Material del inventario (único)
                this.odooConsulta.read(uid,[['id','=',codigo]],'dtm.diseno.almacen',['cantidad','apartado','disponible'],20).subscribe(stock=>{
                  const stockNew = stock[0].cantidad + cantidad;
                  const apartadoNew = stock[0].apartado + requerido;
                  const dispNew = stockNew - apartadoNew;
                  this.odooConsulta.update(uid,codigo,'dtm.diseno.almacen',{'cantidad':stockNew,
                    'apartado':apartadoNew,'disponible':dispNew<0?0:dispNew}).subscribe(inventario=>{
                  })
                })
            })

          })          
        }
        else{ // De no ser una orden de trabajo agrega la cantidad al stock del almacén
         this.odooConsulta.read(uid,[['id','=',codigo]],'dtm.diseno.almacen',['cantidad'],20).subscribe(stock=>{
          this.odooConsulta.update(uid,codigo,'dtm.diseno.almacen',{'cantidad':stock[0].cantidad + cantidad}).subscribe(update=>{
          })
         })
        }
      })

  }


}
function tag(): import("rxjs").OperatorFunction<void, unknown> {
  throw new Error('Function not implemented.');
}

