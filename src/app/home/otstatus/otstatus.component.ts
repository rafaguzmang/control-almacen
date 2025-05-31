import { Component, OnInit,NgZone } from '@angular/core';
import { OdooJsonRpcService } from '../../services/inventario.service';
import { DatosService } from '../../services/datos.service';
import { map, switchMap } from 'rxjs';
import e from 'express';

@Component({
  selector: 'app-otstatus',
  standalone: true,
  imports: [],
  templateUrl: './otstatus.component.html',
  styleUrl: './otstatus.component.css'
})
export class OtstatusComponent implements OnInit{
  tabla:any [] = [];

  constructor(private  odooConect:OdooJsonRpcService, dataConect:DatosService,private ngzone:NgZone){}
  
  ngOnInit(): void {
    this.fetchData();
     this.ngzone.runOutsideAngular(()=>{
      setInterval(() => {
        this.ngzone.run(()=>{
          this.fetchData();    
        })
      }, 5000);
    }) 
  }

  fetchData(){
    let ordenes:any[] = [];
    let proceso:any[] = [];    
    let uid:number;
    this.odooConect.authenticate().pipe(
      map(uidG => {
        uid = uidG
        return uidG
      }),// se obtienen las ordenes de procesos
      switchMap(() => 
         this.odooConect.read(
          uid,
          [['status','!=','aprobacion']],
          'dtm.proceso',
          ['id','ot_number','revision_ot','status'],
          0)
          
      ),
      map(result=>{
        proceso=result;        
      }),// se obtinen las ordenes de diseño
      switchMap(() => 
         this.odooConect.read(
          uid,
          [['manufactura','=',true]],
          'dtm.odt',
          ['id','ot_number','revision_ot'],
          0)
          
      ),
      map(result=>{ //se hace una lista con número de orden id y estatus
        // console.log(result);    
        result.forEach((orden:any)=>{
          let encontrado = proceso.find(row => Number(row.ot_number) == orden.ot_number && row.revision_ot == orden.revision_ot);
          if(encontrado){
            ordenes.push({'id':orden.id,'orden':orden.ot_number,'status':encontrado.status})            
          }
        })
      }),
      switchMap(()=>this.odooConect.read( // se obtienen todos los materiales de las listas de materiales de las ordenes
        uid,
        [['id','!=',0]],
        'dtm.materials.line',
        ['id','model_id','materials_required','entregado'],
        0
      )), // se identifican los items con la orden para conocer el status y saber si tiene material pendiente de compra y entrega
      map(result => { 
        let listmateriales:any[] = [];
        ordenes.forEach(orden=>{
          let ordenitems = result.filter((item:any) => item.model_id[0] == orden.id).map((requerido:any)=>requerido.materials_required);
          let entregado = result.filter((item:any) => item.model_id[0] == orden.id).map((requerido:any)=>requerido.entregado);          
          let entregadostatus = entregado.find((item:any) => item == false)?'Falta':''; 
          if(ordenitems.find((item:any) => item > 0) || entregadostatus=='Falta'){
            listmateriales.push({'id':orden.id,'orden':orden.orden,'status':orden.status,'entregado':entregadostatus})
          }
        })
        return listmateriales;
      })    
      
    ).subscribe(result=>{
      // console.log(result);
      this.tabla = result;
    });
  }
  
}

