import { Component, OnInit } from '@angular/core';
import { OdooJsonRpcService } from '../services/inventario.service';
import { DatosService } from '../services/datos.service';

@Component({
  selector: 'app-entransito',
  standalone: true,
  imports: [],
  templateUrl: './entransito.component.html',
  styleUrl: './entransito.component.css'
})
export class EntransitoComponent implements OnInit{
  datos:any [] = [];
  isVisible:boolean = false;

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
    let codigo = rowTable.children[2].textContent;
    let descripcion = rowTable.children[3].textContent;
    let fecha = formattedDate;
    let cantidad = rowTable.children[6].children[0] as HTMLInputElement;
    let factura = rowTable.children[7].children[0] as HTMLInputElement;
    let notas = rowTable.children[8].textContent;
    datos={'orden_trabajo':orden,'proveedor':proveedor,'codigo':codigo,'descripcion':descripcion,'fecha_real':fecha,'cantidad':parseInt(cantidad.value),'factura':factura.value,'motivo':notas}
    // console.log(datos);
    //Actualiza información y pasa los items correspondientes en el modulo dtm_control_recibido
    this.odooConsulta.authenticate().subscribe(uid => {
      this.odooConsulta.create(uid,'dtm.control.recibido',datos).subscribe(creado=>{
      })
      this.odooConsulta.read(uid,[['orden_trabajo','=',datos.orden_trabajo===''?false:datos.orden_trabajo],
        ['proveedor','=',datos.proveedor],['codigo','=',datos.codigo],['descripcion','=',datos.descripcion],
        ['cantidad','=',parseInt(cantidad.value)]],
        'dtm.control.entradas',['id']).subscribe(unlink=>{
        // console.log(unlink[0].id);
        this.odooConsulta.delete(uid,'dtm.control.entradas',[unlink[0].id]).subscribe(del=>{
          // console.log(del);
        })
        console.log(datos.proveedor);
        this.odooConsulta.read(uid,[['codigo','=',datos.codigo],['nombre','=',datos.descripcion],['cantidad','=',datos.cantidad],['proveedor','=',datos.proveedor]]
          ,'dtm.compras.realizado',['id']).subscribe(idUp=>{
            console.log(idUp[0].id)
            this.odooConsulta.update(uid,idUp[0].id,'dtm.compras.realizado',{'cantidad_almacen':parseInt(datos.cantidad),'comprado':'Recibido'}).subscribe(result=>{
              // console.log(result)
            })
            this.odooConsulta.read(uid,[['id','!=','0']],'dtm.control.entradas',['id','orden_trabajo', 'proveedor','codigo','descripcion',
              'cantidad','fecha_recepcion','fecha_real','factura']).subscribe(datos=>{
                this.datosService.setControlEntradas(datos);
            })
        })
      })
    })
    this.datosService.controlEntradas$.subscribe(datos=>{
      this.datos = datos;
    })
  }

  ngOnInit(): void {
    // Consulta de todos los items
    this.odooConsulta.authenticate().subscribe(uid =>{
      this.odooConsulta.read(uid,[['id','!=','0']],'dtm.control.entradas',['id','orden_trabajo', 'proveedor','codigo','descripcion',
        'cantidad','fecha_recepcion','fecha_real','factura']).subscribe(datos =>{
          this.datosService.setControlEntradas(datos);
        })
    });
    // Obserbable tabla de items
    this.datosService.controlEntradas$.subscribe(datos=>{
      this.datos = datos;
    })
    // Obserbable para ocultar esta tabla de items
    this.datosService.isContentVisible$.subscribe(estado=>{
      this.isVisible = estado;      
    })
  }


}
