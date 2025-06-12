import { Component, OnInit } from '@angular/core';
import { OdooJsonRpcService } from '../services/inventario.service';
import { DatosService } from '../services/datos.service';
import { map, switchMap } from 'rxjs';
import { takeCoverage } from 'v8';

@Component({
  selector: 'app-entransito',
  standalone: true,
  imports: [],
  templateUrl: './entransito.component.html',
  styleUrl: './entransito.component.css'
})
export class EntransitoComponent implements OnInit{
  datos:any [] = [];

  constructor(private odooConsulta: OdooJsonRpcService,private datosService:DatosService){}

  materialDone(event:Event) {
    let datos:any = [];
    let element = event.target as HTMLButtonElement;
    if(element.nodeName === "I"){
      element = element.parentNode as HTMLButtonElement;
    }

    //Obtiene la fecha
    const now = new Date();
    const day = now.getDate(); 
    const month = now.getMonth() + 1; 
    const year = now.getFullYear(); 
    const formattedDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;

    let rowTable = element.parentNode?.parentElement as HTMLInputElement ;
    //datos a imprimir
    let orden = rowTable.children[0].textContent;
    let proveedor = rowTable.children[1].textContent;
    let codigo = Number(rowTable.children[2].textContent);
    let descripcion = String(rowTable.children[3].textContent);
    let fecha = formattedDate;
    let cantidad = Number((rowTable.children[6].children[0] as HTMLInputElement).value);
    let factura = rowTable.children[7].children[0] as HTMLInputElement;
    let notas = rowTable.children[8].textContent;
    let materiales_list:any[] = [];
    let consumibles_list:any[] = [];
    let herramientas_list:any[] = [];
    // console.log(descripcion)
    datos={'orden_trabajo':orden,'proveedor':proveedor,'codigo':codigo,'descripcion':descripcion,'fecha_real':fecha,'cantidad':cantidad,'factura':factura.value,'motivo':notas}
    //Actualiza información y pasa los items correspondientes en el modulo dtm_control_recibido
    this.odooConsulta.authenticate().subscribe(uid => {
      this.odooConsulta.create(uid,'dtm.control.recibido',datos).subscribe(creado=>{
      })
      // Busca el id para poderlo borrar de dtm.control.entradas
      this.odooConsulta.read(uid,[['orden_trabajo','=',datos.orden_trabajo===''?false:datos.orden_trabajo],
        ['proveedor','=',datos.proveedor],['codigo','=',datos.codigo],['descripcion','=',datos.descripcion],
        ['cantidad','=',cantidad]],
        'dtm.control.entradas',['id'],0).subscribe(unlink=>{
        // console.log(unlink[0].id);
        this.odooConsulta.delete(uid,'dtm.control.entradas',[unlink[0].id]).subscribe(del=>{
          // console.log(del);
        })
        this.odooConsulta.read(uid,[['codigo','=',datos.codigo],['nombre','=',datos.descripcion],['cantidad','=',datos.cantidad],['proveedor','=',datos.proveedor]]
          ,'dtm.compras.realizado',['id'],20).subscribe(idUp=>{
            console.log(idUp[0].id)
            // this.odooConsulta.update(uid,idUp[0].id,'dtm.compras.realizado',{'cantidad_almacen':parseInt(datos.cantidad),'comprado':'Recibido'}).subscribe(result=>{
            this.odooConsulta.update(uid,idUp[0].id,'dtm.compras.realizado',{'cantidad_almacen':cantidad}).subscribe(result=>{
              this.odooConsulta.read(uid,[['id','=',codigo]],'dtm.materiales',['cantidad','apartado'],1).pipe(
                map(result => {
                  // console.log(result);
                  materiales_list = result;                  
                }),
                switchMap(()=>  this.odooConsulta.read(uid,[['id','=',codigo]],'dtm.consumibles',['cantidad'],1).pipe(
                  map(result => {
                    consumibles_list = result
                  })
                  ),
                ),
                 switchMap(()=>  this.odooConsulta.read(uid,[['nombre','=',descripcion.replace(/[. ]/g, '')]],'dtm.herramientas',['id','cantidad'],1).pipe(
                  map(result => {
                    herramientas_list = result
                  })
                  ),
                ),
                map(()=>{
                  console.log(materiales_list,consumibles_list);
                  if(materiales_list.length > 0){
                    this.odooConsulta.update(uid,codigo,
                    'dtm.materiales',
                    {'cantidad':materiales_list[0].cantidad + cantidad ,
                      'disponible':materiales_list[0].cantidad + cantidad - materiales_list[0].apartado>0?materiales_list[0].cantidad + cantidad - materiales_list[0].apartado:0,
                    }).subscribe(()=> alert(`Código: ${codigo}\nTabla: Materiales\nAgregado: ${cantidad}\nTotal: ${materiales_list[0].cantidad + cantidad}`))
                  }else if(consumibles_list.length > 0){
                    this.odooConsulta.update(uid,codigo,
                      'dtm.consumibles',
                      {
                        'cantidad':consumibles_list[0].cantidad + cantidad ,                      
                      }
                    ).subscribe(()=> alert(alert(`Código: ${codigo}\nTabla: Consumibles\nAgregado: ${cantidad}\nTotal: ${consumibles_list[0].cantidad + cantidad}`)))
                  }
                  else if (herramientas_list.length > 0){
                    this.odooConsulta.update(uid,herramientas_list[0].id,
                      'dtm.herramientas',
                      {
                        'cantidad':herramientas_list[0].cantidad + cantidad ,                      
                      }
                    ).subscribe(()=> alert(alert(`Código: ${codigo}\nTabla: Herramientas\nAgregado: ${cantidad}\nTotal: ${herramientas_list[0].cantidad + cantidad}`)))
                  }
                }),
              
              ).subscribe(()=> '')
              
            })
            this.odooConsulta.read(uid,[['id','!=','0']],'dtm.control.entradas',['id','orden_trabajo', 'proveedor','codigo','descripcion',
              'cantidad','fecha_recepcion','fecha_real','factura'],20).subscribe(datos=>{
                this.datosService.setControlEntradas(datos);
            })
        })
      })

      //Actualiza el almacèn
      // console.log(datos.orden_trabajo);
      // console.log(datos.orden_trabajo.split(' '));
      //Si es solo una orden ejecuta esta acción
      if(datos.orden_trabajo.search(/ /)===-1){
        this.ordenUpdate(uid,datos.orden_trabajo,datos.codigo,datos.cantidad);
      }else{//Si son mas de una orden ejecuta esta acción
        let ordenes = datos.orden_trabajo.split(' ');
        for(let orden_trabajo of ordenes){
          // console.log(orden)
          this.ordenUpdate(uid,orden_trabajo,datos.codigo,datos.cantidad);
        }
      }
      
    })
    this.datosService.controlEntradas$.subscribe(datos=>{
      this.datos = datos;
    })
  }
  //Configuración inicial
  ngOnInit(): void {
    // Consulta de todos los items   
    // Obserbable para ocultar esta tabla de items
    this.odooConsulta.authenticate().subscribe(uid =>{
      this.odooConsulta.read(uid,[['id','!=','0']],'dtm.control.entradas',['id','orden_trabajo', 'proveedor','codigo','descripcion',
        'cantidad','fecha_recepcion','fecha_real','factura'],0).subscribe(datos =>{
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

