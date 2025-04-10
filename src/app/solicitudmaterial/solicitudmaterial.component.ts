import { Component, OnInit } from '@angular/core';
import { OdooJsonRpcService } from '../services/inventario.service';
import { DatosService } from '../services/datos.service';
import { ActivatedRoute } from '@angular/router';
import { Observable, of, Subscriber } from 'rxjs';

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
  limit = 10;
  ordensch:number = 0;
  codigosch:string = '';
  cliente: string = '';
  proyecto: string = '';
  
  constructor(private odooConect:OdooJsonRpcService, private dataMat:DatosService,private route:ActivatedRoute){}
  // Metodo para leer items especificos
  readItem(uid:number,codigo:number,orden:number):Observable <any[]>{
    return new Observable(observer => {
        this.odooConect.read(uid,[['id','=',codigo]],'dtm.diseno.almacen',['id','apartado','disponible'],0).subscribe(almacen=>{
          this.getModelId(uid,orden).subscribe(model_id=>{
            this.odooConect.read(uid,[['model_id','=',model_id[0].id],['materials_list','=',codigo]],'dtm.materials.line',['id','materials_availabe','materials_required'],1).subscribe(complete=>{
              const result = [
                almacen[0]?.id??null,
                almacen[0]?.apartado??null,
                almacen[0]?.disponible??null,
                model_id[0].id,
                complete[0].id,
                complete[0].materials_availabe,
                complete[0].materials_required
                
              ]
              observer.next(result);
              observer.complete();
            })
          })
      })
    })    
  }
  
  getModelId(uid:number,orden:number){   
    return this.odooConect.read(uid,[['ot_number','=',orden]],'dtm.odt',['id'],1);
  }

  updateData(uid:number,id:number,modelo:string,val:any){
    this.odooConect.update(uid,id,'dtm.diseno.almacen',val).subscribe()
  }
  // Si hay material sobrante se inserta en las demas ordenes que lo soliciten
  apartadosFunc(uid:number,codigo:number,stock:number){
    // Lee de la lista de materiales de las ordenes aquellas que en requerido sea diferente de cero
    this.odooConect.read(uid,[['materials_list','=',codigo]],'dtm.materials.line',['id','materials_required','materials_availabe','materials_cuantity'],0).subscribe(result=>{      

      let apartados = result.reduce((total:number,cantidad:any) => total + cantidad.materials_availabe,0);
      let disponibles = (stock - apartados)>0?stock-apartados:0;
      let newList = result.filter((filter:any) => filter.materials_required !== 0)
      if(disponibles > 0){
        for(let material of newList){
          if (material.materials_required <= disponibles) {
            material.materials_required = 0;
            material.materials_availabe = material.materials_cuantity;
            disponibles = disponibles - material.materials_cuantity;
          } else {
            material.materials_required = material.materials_required - disponibles;
            disponibles = 0;            
          }
          if(disponibles == 0){
            break;
          }        
        }
      }
      this.odooConect.update(uid,codigo,'dtm.diseno.almacen',{'cantidad':stock,'apartado':stock-disponibles<0?0:stock-disponibles,'disponible':disponibles}).subscribe(()=>{
        newList.forEach((element:any) => { 
          this.odooConect.update(uid,element.id,'dtm.materials.line',{'materials_required':element.materials_required,
            'materials_availabe':element.materials_availabe,'materials_inventory':stock,'almacen':true}).subscribe(()=>{
              this.searchCodigo();
          });                    
        });
        
      })    
    })
  }

  almacenFNC(event:Event) {
    let stock = Number((event.target as HTMLInputElement).value);
    let codigo = Number((event.target as HTMLInputElement).closest('tr')?.children[1].textContent);
    let orden = Number((event.target as HTMLInputElement).closest('tr')?.children[0].textContent);
    let cantidad = Number((event.target as HTMLInputElement).closest('tr')?.children[6].textContent);
    this.odooConect.authenticate().subscribe(uid=>{
      // Obtiene el id, apartado,stock y disponible del item en cuestión
      this.readItem(uid,codigo,orden).subscribe(result=>{
        const itemData = {codigo:result[0],apartados:result[1],disponible:result[2],stock:stock,model_id:result[3],id:result[4],apartado:result[5],requerido:result[6]}
        // console.log(itemData);
        // Hace el cálculo correspondiente del material disponible vs el solicitado
        let apartado = itemData.apartado;
        let requerido = itemData.requerido;
        if(requerido <= stock){
          requerido = 0;
          apartado = cantidad;
        }else{
          requerido = requerido - stock
          apartado = stock
        }
        // console.log(requerido,apartado);
        this.odooConect.update(uid,itemData.id,'dtm.materials.line',{'materials_availabe':apartado,'materials_required':requerido,'materials_inventory':stock}).subscribe(()=>{

          this.apartadosFunc(uid,itemData.codigo,itemData.stock);
          // this.odooConect.update(uid,itemData.codigo,'dtm.diseno.almacen',{'cantidad':stock,'apartado':})
        });
      });
    })
  }
  
  exitenciaCBX(event:Event) {
    let input = event.target as HTMLInputElement;
    let rowTable = input.parentElement?.parentElement;
    let orden = (rowTable?.children[0] as HTMLAnchorElement).textContent;
    let codigo = (rowTable?.children[1] as HTMLAnchorElement).textContent;
    // Informa a ingeniería que ya reviso este item
    if(input.checked){
      this.odooConect.authenticate().subscribe((uid:number)=>{
        this.odooConect.read(uid,[['ot_number','=',orden]],'dtm.odt',['id'],1).subscribe(result=>{
          // console.log(result[0].id,Number(codigo));
          this.odooConect.read(uid,[['model_id','=',Number(result[0].id)],['materials_list','=',Number(codigo)]],'dtm.materials.line',['id'],0).subscribe(id =>{
            // console.log(id[0].id);
            this.odooConect.update(uid,Number(id[0].id),'dtm.materials.line',{'almacen':true}).subscribe()
          })
        })
      })
    }else{
      this.odooConect.authenticate().subscribe((uid:number)=>{
        this.odooConect.read(uid,[['ot_number','=',orden]],'dtm.odt',['id'],1).subscribe(result=>{
          // console.log(result[0].id,Number(codigo));
          this.odooConect.read(uid,[['model_id','=',Number(result[0].id)],['materials_list','=',Number(codigo)]],'dtm.materials.line',['id'],0).subscribe(id =>{
            // console.log(id[0].id);
            this.odooConect.update(uid,Number(id[0].id),'dtm.materials.line',{'almacen':false}).subscribe()
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
    // console.log(rowTable);
    let orden = rowTable.children[0].textContent;
    let codigo = rowTable.children[1].textContent??'0';
    let cantidad = rowTable.children[6].textContent??'0';
    let entregado = rowTable.children[7].children[0].children[0] as HTMLInputElement;
    let recibe =  rowTable.children[7].children[0].children[1] as HTMLSelectElement;
    // console.log(recibe.options[recibe.selectedIndex].text);    
    this.odooConect.authenticate().subscribe((uid: number) => {
      if(uid == 2){
        this.odooConect.read(uid,[['ot_number','=',orden]],'dtm.odt',['id'],this.limit).subscribe(ordenData =>{ 
          // console.log(ordenData[0].id);
          this.odooConect.read(uid,[['model_id','=',ordenData[0].id],['materials_list','=',parseInt(codigo)]],'dtm.materials.line',['id','materials_availabe'],this.limit).subscribe(ordenId =>{
            // console.log(ordenId[0].id,ordenId[0].materials_availabe);          
            this.odooConect.update(uid,ordenId[0].id,'dtm.materials.line',{'entregado':true,'recibe':recibe.options[recibe.selectedIndex].text}).subscribe(()=>
              {
                let newTable:any = this.dataMat.getMaterial();
                newTable.forEach((iterator:any) =>{
                  if(iterator.codigo === Number(codigo)){
                    iterator.entregado = true;
                    iterator.recibe = recibe.options[recibe.selectedIndex].text;
                  }
                })
                this.dataMat.setMaterial(newTable);
              }
            );
            this.odooConect.read(uid,[['id','=',parseInt(codigo)]],'dtm.diseno.almacen',['apartado'],this.limit).subscribe(apartado =>{
              // console.log(apartado[0].apartado, ordenId[0].materials_availabe)
              let apartadoMaterial = apartado[0].apartado - ordenId[0].materials_availabe;
              if(apartadoMaterial < 0){apartadoMaterial = 0}
              let cantidadMaterial = parseInt(cantidad)-parseInt(entregado.value);
              if(cantidadMaterial < 0){cantidadMaterial = 0}
              // console.log(cantidadMaterial,apartadoMaterial)
              this.odooConect.update(uid,parseInt(codigo),'dtm.diseno.almacen',{'cantidad':cantidadMaterial,'apartado':apartadoMaterial }).subscribe(()=>{
                this.searchOT();
              });              
             
            })
          })    
        });
        alert("Listo!!");
      
      }
    });  
  }
  // Buscador por orden de trabajo
  searchOT(){
    let searchTable:any = [];
    this.material = this.dataMat.getMaterial(); 
    searchTable = this.dataMat.getMaterial();
    let search = searchTable.filter((filter:any) =>filter.orden==this.ordensch)
    search = search.sort((a:any,b:any)=>a.ot_number - b.ot_number);
    this.material = search.length > 0 ? search : null;
    this.material = !this.ordensch ? this.dataMat.getMaterial() : this.material;
  }
  
  searchCodigo(){
    let searchTable:any = [];
    this.material = this.dataMat.getMaterial(); 
    searchTable = this.dataMat.getMaterial();
    console.log("Busca");

    let search = searchTable.filter((filter:any) => String(filter.codigo).match(this.codigosch))
    search = search.sort((a:any,b:any)=>a.codigo - b.codigo)
    this.material = search.length > 0 ? search : null;
    this.material = !this.codigosch ? this.dataMat.getMaterial() : this.material;
  }

  // Buscador por número de orden
  onOrdenInput(event: Event) {
    const input = event?.target as HTMLInputElement;   
    this.ordensch = Number(input.value);    
    this.searchOT();
  }  
  // Buscador por código
  onCodigoInput(event: Event) {
    const input = event?.target as HTMLInputElement;  
    this.codigosch = input.value;
    this.searchCodigo();   
  }
  // Obtiene la lista de todas las ordenes incluyendo sus materiales
  fetchodooConect(){
    let num = 0;
    let material:any = [];
    this.odooConect.authenticate().subscribe(uid => 
      // Lee la lista de materiales de todas las ordenes
      this.odooConect.read(uid,[['model_id','!=',false]],'dtm.materials.line', ['materials_list','nombre','medida', 'materials_cuantity',
        'materials_inventory', 'materials_required','entregado','recibe','notas','almacen','model_id'],0).subscribe(ordenes =>{  
          // console.log(ordenes);      
          // Se crea una tabla para agregar todos los datos necesarios
          ordenes.forEach((row:any) =>{
          material.push({'numero':num++,'orden':Number(row.model_id[1]),'codigo':row.materials_list[0],'nombre':row.nombre,
                            'medida':row.medida,'stock':row.materials_inventory,'cantidad':row.materials_cuantity,'entregado':row.entregado,
                            'recibe':row.recibe===false?'':row.recibe,'almacen':row.almacen})
          })          
      
        // Lee todo el inventario para poder agregar el stock cargado en sistema
        this.odooConect.read(uid,[['id','!=','0']],'dtm.diseno.almacen',['id','cantidad'],0).subscribe(result=>{
          let cantidadId:any = {};
          let resulttbl:any[] = result;
          // Crea un json con el id y agrega la cantidad id:cantidad del material
          resulttbl.forEach(idqty=>{
            cantidadId[idqty.id] = idqty.cantidad;
          })
          // Agrega el stock a cada elemento asociado a sus ordenes de trabajo
          material.forEach((item:any) => {
            item.stock = cantidadId[item.codigo]
          })     
          // Pasa la información a la tabla correspondiente en un service     
          this.dataMat.setMaterial(material); 
          // Carga la tabla local con la información desde el service
          this.material = this.dataMat.getMaterial();   
          this.route.queryParams.subscribe(params=> {
            this.ordensch=params['orden'];
            this.ordensch?this.searchOT():null;
          })    
        })
      })
    );       
  }
  // Función para leer la lista de empleados
  empleadosList(){
    this.odooConect.authenticate().subscribe(uid=>{
      this.odooConect.read(uid,[['id','!=','0']],'dtm.hr.empleados',['nombre'],0).subscribe(result=>{
        this.dataMat.setEmpleados(result);
        this.empleados = this.dataMat.getEmpleados();
      })
    })
  }

  ngOnInit(): void {
    // Obtiene la lista de materiales de todas las ordenes y las guarda en local
    this.fetchodooConect( );
    // Obtiene la lista de empleados
    this.empleadosList();
   
  }
}
