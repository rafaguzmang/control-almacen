import { Component, OnInit } from '@angular/core';
import { OdooJsonRpcService } from '../../services/inventario.service';
import { map, switchMap } from 'rxjs';

@Component({
  selector: 'app-revisionmateriales',
  standalone: true,
  imports: [],
  templateUrl: './revisionmateriales.component.html',
  styleUrl: './revisionmateriales.component.css'
})
export class RevisionmaterialesComponent implements OnInit {
  tabla:any[] =[];
  constructor (private odooconect:OdooJsonRpcService){}

  calculadoraAlmacen(event:Event){
    let stock = Number((event.target as HTMLInputElement).value);
    // let codigo = Number((event.target as HTMLInputElement).closest('tr')?.children[2].textContent);
    // let orden = Number((event.target as HTMLInputElement).closest('tr')?.children[0].textContent);
    // let version = Number((event.target as HTMLInputElement).closest('tr')?.children[1].textContent);
    // let cantidad = Number((event.target as HTMLInputElement).closest('tr')?.children[8].textContent);
    console.log(stock);
  }

  ngOnInit(): void {
    let ordenes_lista:any[] = [];
    let uid:number = 0;
    let procesos_list:any[] = [];
    let materialesList:any[] = [];
    this.odooconect.authenticate().pipe(     
      switchMap(getuid => 
         this.odooconect.read(
          getuid,
          [['id','!=',0]],
          'dtm.proceso',
          ['id','ot_number','revision_ot','status','materials_ids'],
          0).pipe(
            map(result=>{
              uid = getuid;
              procesos_list = [].concat(...result.map((row:any) => row.materials_ids));               
            })
          )          
      ),  
      switchMap(()=>this.odooconect.read(uid,[['id','!=',0]],'dtm.materiales',['id','cantidad','apartado','disponible'],0).pipe(
          map(materiales => {
            materialesList = materiales;
          })
       
        )
      ),
      switchMap(() => this.odooconect.read(uid,[
        ['id','in',procesos_list],['entregado','!=',true],['almacen','!=',true],['revision','!=',true],['materials_cuantity','!=',0]
        ],'dtm.materials.line',['id','materials_list','materials_required','model_id','materials_cuantity'],0).pipe(
        map(result=>{
          let lista_materiales:any[] = [];
          result.forEach((item:any)=>{
            lista_materiales.push({
              'id':item.id,
              'codigo':item.materials_list[0],
              'material':String(item.materials_list[1]).slice(String(item.materials_list[0]).length + 1,String(item.materials_list[1]).length),
              'cantidad':item.materials_cuantity,
              'requerido':item.materials_required
            })
          })
          let repetidos_list:any = {};
          lista_materiales.forEach((item:any) =>{
            if(repetidos_list[item.codigo]){
              repetidos_list[item.codigo] += item.cantidad;
            }else{
              repetidos_list[item.codigo] = item.cantidad;
            }
          })
          let setList = [ ...new Map(lista_materiales.map(item=>[item.codigo,item])).values()]
          setList.forEach((item:any)=>{            
            if(repetidos_list[String(item.codigo)]){
              item.cantidad = repetidos_list[item.codigo];
            }
          })
          this.tabla = setList.sort((item1,item2) => item1.codigo - item2.codigo);
        })
        )
      ),     

    ).subscribe(()=>console.log('listo'))  
  }

}
