import { Component, OnInit } from '@angular/core';
import { OdooJsonRpcService } from '../services/inventario.service';
import { DatosService } from '../services/datos.service';
import { tick } from '@angular/core/testing';

@Component({
  selector: 'app-solicitudmaterial',
  standalone: true,
  imports: [],
  templateUrl: './solicitudmaterial.component.html',
  styleUrl: './solicitudmaterial.component.css'
})
export class SolicitudmaterialComponent implements OnInit{
  material:any [] = [];
  empleados:any [] = [];
  limit = 5;
    
  constructor(private odooConect:OdooJsonRpcService, private dataMat:DatosService){}
  
  exitenciaCBX(event:Event) {
    let input = event.target as HTMLInputElement;
    let rowTable = input.parentElement?.parentElement;
    let orden = (rowTable?.children[0] as HTMLAnchorElement).textContent;
    let codigo = (rowTable?.children[1] as HTMLAnchorElement).textContent;
    
    if(input.checked){
      this.odooConect.authenticate().subscribe((uid:number)=>{
        this.odooConect.read(uid,[['ot_number','=',orden]],'dtm.odt',['id'],1).subscribe(result=>{
          console.log(result[0].id,Number(codigo));
          this.odooConect.read(uid,[['model_id','=',Number(result[0].id)],['materials_list','=',Number(codigo)]],'dtm.materials.line',['id'],0).subscribe(id =>{
            console.log(id[0].id);
            this.odooConect.update(uid,Number(id[0].id),'dtm.materials.line',{'almacen':true}).subscribe(listo=>
              console.log(listo)
            )
          })
        })
      })
    }else{
      this.odooConect.authenticate().subscribe((uid:number)=>{
        this.odooConect.read(uid,[['ot_number','=',orden]],'dtm.odt',['id'],1).subscribe(result=>{
          console.log(result[0].id,Number(codigo));
          this.odooConect.read(uid,[['model_id','=',Number(result[0].id)],['materials_list','=',Number(codigo)]],'dtm.materials.line',['id'],0).subscribe(id =>{
            console.log(id[0].id);
            this.odooConect.update(uid,Number(id[0].id),'dtm.materials.line',{'almacen':false}).subscribe(listo=>
              console.log(listo)
            )
          })
        })
      })
    }

  }
  // Botón para entregar el material a producción
  entregado(event: Event ):void {
    let element = event.target as HTMLInputElement;    
    if(element.nodeName === 'I'){
        // console.log(element.parentElement.parentElement?.nodeName);
        element = element.parentNode as HTMLInputElement;
    }
    let rowTable = element.parentNode?.parentNode?.parentElement as HTMLInputElement;
    console.log(rowTable);
    let orden = rowTable.children[0].textContent;
    let codigo = rowTable.children[1].textContent??'0';
    let cantidad = rowTable.children[6].textContent??'0';
    let entregado = rowTable.children[7].children[0].children[0] as HTMLInputElement;
    let recibe =  rowTable.children[7].children[0].children[1] as HTMLSelectElement;
    console.log(recibe.options[recibe.selectedIndex].text);    
    this.odooConect.authenticate().subscribe((uid: number) => {
      if(uid == 2){
        this.odooConect.read(uid,[['ot_number','=',orden]],'dtm.odt',['id'],this.limit).subscribe(ordenData =>{ 
          // console.log(ordenData[0].id);
          this.odooConect.read(uid,[['model_id','=',ordenData[0].id],['materials_list','=',parseInt(codigo)]],'dtm.materials.line',['id','materials_availabe'],this.limit).subscribe(ordenId =>{
            // console.log(ordenId[0].id,ordenId[0].materials_availabe);          
            this.odooConect.update(uid,ordenId[0].id,'dtm.materials.line',{'entregado':true,'recibe':recibe.options[recibe.selectedIndex].text}).subscribe();
            this.odooConect.read(uid,[['id','=',parseInt(codigo)]],'dtm.diseno.almacen',['apartado'],this.limit).subscribe(apartado =>{
              // console.log(apartado[0].apartado, ordenId[0].materials_availabe)
              let apartadoMaterial = apartado[0].apartado - ordenId[0].materials_availabe;
              if(apartadoMaterial < 0){apartadoMaterial = 0}
              let cantidadMaterial = parseInt(cantidad)-parseInt(entregado.value);
              if(cantidadMaterial < 0){cantidadMaterial = 0}
              // console.log(cantidadMaterial,apartadoMaterial)
              this.odooConect.update(uid,parseInt(codigo),'dtm.diseno.almacen',{'cantidad':cantidadMaterial,'apartado':apartadoMaterial }).subscribe();              
            })
          })    
        });
        alert("Listo!!")       
      }
    });  
  }
  // Restringe el valor a los limites de la cantidad solicitada  

  onOrdenInput(event: Event) {
    const input = event?.target as HTMLInputElement;    
    console.log(input.value);
    let domain = [['ot_number','=',input.value]];
    if(input.value===""){
      domain = [['id','!=','0']];
    }
    this.fetchodooConect(domain);
  }
  
  onCodigoInput(event: Event) {
    let material:any = [];
    let num = 0;
    const input = event?.target as HTMLInputElement;  
    console.log(input.value);
    this.odooConect.authenticate().subscribe(uid => {
      this.odooConect.read(uid,[['materials_list','=',parseInt(input.value)],['model_id','!=',false]],'dtm.materials.line',
      ['model_id','nombre','medida','materials_inventory','materials_cuantity','entregado','recibe'],this.limit).subscribe(data =>{
        for(const item of data){
            console.log(item.model_id[1]);          
            material.push({'numero':num++,'orden':item.model_id[1],'codigo':input.value,'nombre':item.nombre,
                                'medida':item.medida,'stock':item.materials_inventory,'cantidad':item.materials_cuantity,'entregado':item.entregado,
                              'recibe':item.recibe})
                              
        } 
        this.dataMat.setMaterial(material);
        this.material = this.dataMat.getMaterial();       
      })
    });
  }

  fetchodooConect(dominio:any[]){
    let num = 0;
    let material:any = [];
    this.odooConect.authenticate().subscribe(uid => 
      this.odooConect.read(uid,dominio,'dtm.proceso',['ot_number','materials_ids'],this.limit).subscribe(data =>{
        for(const items of data){
          for(const item of items.materials_ids){
            this.odooConect.read(uid,[['id','=',item]],'dtm.materials.line',
            ['materials_list','nombre','medida', 'materials_cuantity',
            'materials_inventory', 'materials_required','entregado','recibe','notas'],this.limit).subscribe(info => {
              // console.log(info[0].recibe);
              material.push({'numero':num++,'orden':items.ot_number,'codigo':info[0].materials_list[0],'nombre':info[0].nombre,
                                  'medida':info[0].medida,'stock':info[0].materials_inventory,'cantidad':info[0].materials_cuantity,'entregado':info[0].entregado,
                                'recibe':info[0].recibe===false?'':info[0].recibe})
            })
          }           
        } 
        this.dataMat.setMaterial(material);
        this.material = this.dataMat.getMaterial();       
      })
    );  
     
  }

 

  ngOnInit(): void {
    this.fetchodooConect( [['id','!=','0']]);
    this.odooConect.authenticate().subscribe(uid =>{
      this.odooConect.read(uid,[['id','!=','0']],'dtm.hr.empleados',['nombre'],50).subscribe(empleados=>{
        this.empleados = empleados;
      })
    })
    
  }
}
