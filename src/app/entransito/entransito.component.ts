import { Component, NgZone, OnInit } from '@angular/core';
import { OdooJsonRpcService } from '../services/inventario.service';
import { DatosService } from '../services/datos.service';
import { catchError,map, of, switchMap, tap } from 'rxjs';
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
  private timer: any;


  constructor(private odooConsulta: OdooJsonRpcService,private datosService:DatosService,private ngzone:NgZone){}

  facturaFunc(event:Event){
    const factura = (event.target as HTMLInputElement).value;
    let rowTable = (event.target as HTMLInputElement).closest('tr')

    const orden = Number(rowTable?.children[0].textContent);
    const version = Number(rowTable?.children[1].textContent);
    const proveedor = rowTable?.children[2].textContent ?? '';
    const codigo = Number(rowTable?.children[3].textContent);
    const descripcion = String(rowTable?.children[4].textContent ?? '');
    const cantidad_solicitada = Number(rowTable?.children[6].textContent);



    // console.log(factura,orden,version,proveedor,codigo,descripcion,cantidad_solicitada  );
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.odooConsulta.authenticate().pipe(
        switchMap(uid=> this.odooConsulta.read(
          uid,
          [
            ['orden_trabajo','=',orden],
            ['revision_ot','=',version],
            ['proveedor','=',proveedor],
            ['codigo','=',codigo],
            ['descripcion','=',descripcion],
            ['cantidad','=',cantidad_solicitada],
          ],
          'dtm.control.entradas',
          ['id'],
          1
          ).pipe(
            map(result=>{
              return result;
            })
          )
        )
      ).subscribe((result:any) =>{
        // console.log(' result',result[0].id);
        this.odooConsulta.authenticate().subscribe(uid=>{
          this.odooConsulta.update(uid,result[0].id,'dtm.control.entradas',{'factura':factura}).subscribe(()=>{console.log('Factura actualizada')})
        })
      })
    }, 1000); // Ajusta el tiempo según sea necesario
      


  }



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
    const proveedor = rowTable?.children[2].textContent ?? '';
    const codigo = Number(rowTable?.children[3].textContent);
    const descripcion = String(rowTable?.children[4].textContent ?? '');
    const fecha = formattedDate;
    const cantidad_solicitada = Number(rowTable?.children[6].textContent);
    const cantidad_real = Number(rowTable?.children[7].textContent);
    const cantidad = Number((rowTable?.children[8].children[0] as HTMLInputElement).value);
    const factura = (rowTable?.children[9].children[0] as HTMLInputElement).value;
    const notas = (rowTable?.children[10].children[0] as HTMLInputElement).value;   
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
    clearTimeout(this.timer);
    if(factura != '')
    { this.timer = setTimeout(() => {
      if(event.target){
        this.odooConsulta.authenticate().pipe(
          switchMap(uid=> this.odooConsulta.read(uid,[['codigo','=',codigo],['descripcion','=',descripcion],['proveedor','=',proveedor],['orden_trabajo','=',orden]],'dtm.control.entradas',['id','cantidad_real'],0).pipe(
              map(result => {
                if (result && result.length > 0 && cantidad != 0) {
                    this.odooConsulta.update(uid,result[0].id,'dtm.control.entradas',{'cantidad_real':(cantidad_real + cantidad)>0?cantidad_real + cantidad:0}).subscribe(()=>{console.log("Listo");this.fetchData() });
                    this.finalizarOT(orden,version,proveedor,codigo,descripcion,fecha,formattedDate,cantidad_solicitada,cantidad,factura,notas,cantidad_real);
                    (rowTable?.children[8].children[0] as HTMLInputElement).value = '0';
                  return result[0];              
                }else{
                  return null;
                }
              })
            )
          ),     
          catchError(error=>{
              // console.log(error);
              return of([])
          }),
        ).subscribe(result => {
            // console.log(result);
        })
      }
      
    }, 1000); // Ajusta el tiempo según sea necesario
    }else{
      (rowTable?.children[8].children[0] as HTMLInputElement).value = '0';
      alert("Es necesario ingresar el número de factura");
    }
    
  
  }

  finalizarOT(orden:number,version:number,proveedor:string,codigo:number,descripcion:string,fecha:string,formattedDate:string,cantidad_solicitada:number,cantidad:number,factura:string,notas:string,cantidad_real:number = 0):void{
    let uid:number;
    let ot_id:number
    let control_entradas_id:number;   
    let encontrado:boolean;
    let enUsoCantidad = 0;
    let apartadoItem = 0;
    this.odooConsulta.authenticate().pipe(
      // se obtiene el id de la orden de servicios y versión de la misma
      switchMap(getuid=> this.odooConsulta.read(getuid,[['ot_number','=',orden],['revision_ot','=',version]],'dtm.odt',['id'],0).pipe(
          map(result => {
            // console.log('odt',result);
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
              console.log('cantidad_real',cantidad_real,'cantidad_solicitada',cantidad_solicitada)               
              if(result.length>0){  
                console.log('result[0].id',result[0].id);
                encontrado = true;
                this.odooConsulta.update(uid,
                result[0].id,
                'dtm.compras.realizado',
                {
                  'cantidad_almacen':cantidad_real + cantidad>0?cantidad_real + cantidad:0,
                  'comprado':(cantidad_real + cantidad>cantidad_solicitada?cantidad_solicitada:cantidad_real + cantidad) == cantidad_solicitada?'Recibido':'Parcial',
                }).subscribe()            
              }else{
                alert("Item no encontrado en Compras Realizadas");
                encontrado = false;
               
              }
            })
          )
      ),     
      // mete el material a la orden correspondiente dtm.materials.line
      switchMap(() =>this.odooConsulta.read(uid,[['materials_list', '=', codigo], ['model_id', '=', ot_id]],'dtm.materials.line',['id', 'materials_cuantity', 'materials_availabe'],1).pipe(
          switchMap((result) => {
            // if (result.length > 0 && encontrado === true) {
            if (result.length > 0 ) {
              const id = result[0].id;
              console.log('result[0].materials_availabe',result[0].materials_availabe);
              let nuevoDisponible = result[0].materials_availabe + cantidad<=result[0].materials_cuantity? result[0].materials_availabe + cantidad:result[0].materials_cuantity;
              let nuevoRequerido = cantidad_solicitada - cantidad<0? cantidad_solicitada - cantidad:0;

              return this.odooConsulta.update(uid, id, 'dtm.materials.line', {
                'materials_required': nuevoDisponible<=0?cantidad_solicitada:nuevoRequerido,
                'materials_availabe': nuevoDisponible>0?nuevoDisponible:0,
                'revision':true,
              }).pipe(
                switchMap(()=> this.odooConsulta.read(uid,[['materials_list','=',codigo],['entregado','!=',true]],'dtm.materials.line',['id','materials_list','materials_availabe','entregado','model_id'],0).pipe(
                    map(result_materials_line=>{
                      const sumaMat = result_materials_line.reduce((total:any, material:any) => total + material.materials_availabe, 0);
                      return sumaMat
                    })
                  ),
                ),
                switchMap((sumaMat:number)=> this.odooConsulta.read(uid,[['id','=',codigo]],'dtm.materiales',['id','cantidad','apartado','disponible'],1).pipe(
                  map(resultMateriales=>{
                    console.log(' sumaMat',sumaMat);
                    console.log(' resultMateriales',resultMateriales[0].cantidad);
                    const cantidadTotal = resultMateriales[0].cantidad+cantidad>0?resultMateriales[0].cantidad+cantidad:0;
                    const disponibleTotal = cantidadTotal - sumaMat>0?cantidadTotal - sumaMat:0;
                    this.odooConsulta.update(uid,codigo,'dtm.materiales',{'cantidad':cantidadTotal,'apartado':sumaMat,'disponible':disponibleTotal}).subscribe()
                  })
                )),
                
              tap(() => alert(`Materiales\nOrden: ${orden}\nCódigo: ${codigo}\nCantidad: ${cantidad}`))
            );
            }

            // Si no hay resultado o no se cumple la condición, retorna un observable vacío
            return of(null);
          })
        )
      ),
      // busca si el material está en CONSUMIBLES y se ingresa al stock
      switchMap(()=> this.odooConsulta.read(uid,[['id','=',codigo]],'dtm.consumibles',['cantidad','id','nombre'],1).pipe(
          map(result_consumibles=>{
            if(result_consumibles.length>0 && encontrado == true && descripcion.includes(result_consumibles[0].nombre)){
              // console.log('Consumibles',result_consumibles);
              this.odooConsulta.update(uid,result_consumibles[0].id,
                'dtm.consumibles',
                {
                  'cantidad':(result_consumibles[0].cantidad + cantidad)>0?result_consumibles[0].cantidad + cantidad:0 ,                      
                }
              ).subscribe(()=> alert(`Código: ${codigo}\nTabla: Consumibles\nAgregado: ${cantidad}\nTotal: ${result_consumibles[0].cantidad + cantidad>0?result_consumibles[0].cantidad + cantidad:0}`))
            }
          })
        )
      ),
      // busca si el material está en HERRAMIENTAS y se ingresa al stock
      switchMap(()=> this.odooConsulta.read(uid,[['nombre','ilike',descripcion.replace(/[.\s]+$/, '')]],'dtm.herramientas',['id','cantidad'],1).pipe(
          map(result=>{
            if(result.length > 0 && encontrado == true){
              // console.log('Herramientas',result);
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
            // console.log(result);
           
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
            console.log('Factura',factura);
            if(result.length > 0 && encontrado == true){      
              if(cantidad_real + cantidad >= cantidad_solicitada){
                this.odooConsulta.delete(uid,'dtm.control.entradas',[result[0].id]).subscribe(result=>console.log(result))                
              }        
            }else{
              alert("Item no encontrado en Control de Entradas")
            }
            this.odooConsulta.update(uid, result[0].id, 'dtm.control.entradas', {'factura':factura}).subscribe(()=>{console.log('Listo actualizar en tránsito')})
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
      // console.log('uid',uid);
      this.odooConsulta.read(uid,[['id','!=','0']],'dtm.control.entradas',['id','orden_trabajo', 'proveedor','codigo','descripcion',
        'cantidad','fecha_recepcion','fecha_real','factura','revision_ot','cantidad_real'],0).subscribe(datos =>{
        // console.log('datos',datos);
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

