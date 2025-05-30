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
        this.odooConect.read(uid,[['id','=',codigo]],'dtm.materiales',['id','apartado','disponible'],0).subscribe(almacen=>{
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
  apartadosFunc(uid:number,codigo:number,stock:number,firstId:number){
    // Lee de la lista de materiales de las ordenes aquellas que en requerido sea diferente de cero

    this.odooConect.read(uid,[      
        ['materials_list', '=', codigo],      
        ['revision', '!=', true],
        ['entregado', '!=', true]      
      ],
      'dtm.materials.line',
      [
        'id','materials_required',
        'materials_availabe',
        'materials_cuantity'
      ],0).subscribe(result=>{      
      let apartados = result.reduce((total:number,cantidad:any) => total + cantidad.materials_availabe,0);
      let disponibles = (stock - apartados)>0?stock-apartados:0;
      console.log('Primer',disponibles);
      // let newList = result.filter((filter:any) => filter.materials_required !== 0)
      // let itemList:any = [];
      // if(disponibles > 0){
        for(let material of result){
            if(disponibles == 0 && material.id != firstId ){
              material.materials_required = material.materials_cuantity;
              material.materials_availabe = 0;                  
              console.log('Cero');
              console.log("disponibles",disponibles);
            } 
        }
        for(let material of result){  
          if(material.id != firstId && material.materials_required > 0){  //Si el material disponible es cero no se efectua el loop
            console.log(material.id);          
           
            if (material.materials_required == disponibles && disponibles > 0) { //Si el material es requerido es igual al disponible se deja de ejecutar el loop
              material.materials_required = 0;
              material.materials_availabe = material.materials_availabe + disponibles;
              disponibles = 0; 
              console.log('Igual');
              console.log("disponibles",disponibles);
              break;            
            }  else if(material.materials_cuantity > disponibles){ //Si el disponible es menor que el que lo solicitado este se resta y se deja de ejecutar el loop
              material.materials_required = (material.materials_cuantity - disponibles)>0?material.materials_cuantity - disponibles:0;
              material.materials_availabe = disponibles;
              disponibles = 0;
              console.log('Hay poquito');
              console.log("disponibles",disponibles);
              break;
            } else if(material.materials_cuantity < disponibles){//Si el material disponible es mayor al solicitado este se inyecta y se continua el loop
              material.materials_required = 0;
              material.materials_availabe = material.materials_cuantity;
              disponibles = disponibles - material.materials_cuantity;
              console.log('Si hay');
              console.log("disponibles",disponibles);
            }  
          }
          // itemList.push(material);
          // console.log("disponibles",disponibles);
        }
      // }
      if (result.length>0){
        this.odooConect.update(uid,codigo,'dtm.diseno.almacen',{'cantidad':stock,'apartado':stock-disponibles<0?0:stock-disponibles,'disponible':disponibles}).subscribe(()=>{
          // console.log('object');
          result.forEach((element:any) => { 
            // console.log('foreach');
            this.odooConect.update(uid,element.id,'dtm.materials.line',{'materials_required':element.materials_required,
              'materials_availabe':element.materials_availabe,'materials_inventory':stock}).subscribe(()=>{              
                this.fetchodooConect();
                // this.searchCodigo(); 
            });                    
          });        
        })    
      }else{
        this.fetchodooConect();
      }
      
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
        // Hace el cálculo correspondiente del material disponible vs el solicitado
        let apartado = itemData.apartado;
        let requerido = itemData.requerido;
        if (stock == 0){
          // console.log("stock == 0");
          requerido = cantidad
          apartado = 0
        }else if(cantidad == stock){
          // console.log("cantidad == stock");
          requerido = 0;          
          apartado = cantidad;
        } else if(cantidad > stock){
          // console.log("cantidad > stock");
          requerido = requerido - stock
          apartado = stock
        }else if(cantidad < stock){
          // console.log("cantidad < stock");
          requerido = 0
          apartado = cantidad
        }
        this.odooConect.update(uid,itemData.id,'dtm.materials.line',{'materials_availabe':apartado,'materials_required':requerido>0?requerido:0,'materials_inventory':stock}).subscribe(()=>{
          this.apartadosFunc(uid,itemData.codigo,itemData.stock,itemData.id);
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
    let rowTable = (event.target as HTMLInputElement).closest('tr');  
    let orden = rowTable?.children[0].textContent;
    let codigo = rowTable?.children[1].textContent??'0';
    let cantidad = rowTable?.children[6].textContent??'0';
    let entregado = rowTable?.children[9].children[0].children[0] as HTMLInputElement;
    let recibe =  rowTable?.children[9].children[0].children[1] as HTMLSelectElement;
    // console.log(orden,codigo,cantidad,entregado,recibe);
    this.odooConect.authenticate().subscribe((uid: number) => {
      if(uid == 2){
        this.odooConect.read(uid,[['ot_number','=',orden]],'dtm.odt',['id'],this.limit).subscribe(ordenData =>{ //Obtiene el número de orden
          // console.log(ordenData[0].id);
          this.odooConect.read(uid,[['model_id','=',ordenData[0].id],['materials_list','=',parseInt(codigo)]],'dtm.materials.line',['id','materials_availabe'],this.limit).subscribe(ordenId =>{ //Obtiene el id del material en cuestión
            // console.log(ordenId[0].id,ordenId[0].materials_availabe);          
            this.odooConect.update(uid,ordenId[0].id,'dtm.materials.line',{'entregado':true,'recibe':recibe.options[recibe.selectedIndex].text}).subscribe(()=> //Actualiza el material
              {
                // let newTable:any = this.dataMat.getMaterial();
                // newTable.forEach((iterator:any) =>{
                //   if(iterator.codigo === Number(codigo)){
                //     iterator.entregado = true;
                //     iterator.recibe = recibe.options[recibe.selectedIndex].text;
                //   }
                // })
                // this.dataMat.setMaterial(newTable);

                this.odooConect.read(uid,[['id','=',parseInt(codigo)]],'dtm.diseno.almacen',['apartado','cantidad'],this.limit).subscribe(apartado =>{
                  // console.log(apartado[0].apartado, ordenId[0].materials_availabe)
                  let apartadoMaterial = apartado[0].apartado - ordenId[0].materials_availabe;
                  let cantidadMaterial = apartado[0].cantidad-parseInt(entregado.value);                 
                  // console.log(cantidadMaterial,apartadoMaterial)
                  this.odooConect.update(uid,parseInt(codigo),'dtm.diseno.almacen',{'cantidad':Math.max(cantidadMaterial,0),'apartado':Math.max(apartadoMaterial,0),'disponible':Math.max(cantidadMaterial-apartadoMaterial,0) }).subscribe(()=>{
                    this.fetchodooConect();
                  });              
                 
                })
              }
            );
           
          })    
        });
        alert("Listo!!");
      
      }
    });  
  }
  // Buscador por orden de trabajo
  searchOT(){
    // console.log(this.ordensch);
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
        'materials_inventory','materials_availabe', 'materials_required','entregado','recibe','notas','almacen','model_id'],0).subscribe(ordenes =>{  
          // Se crea una tabla para agregar todos los datos necesarios
          ordenes.forEach((row:any) =>{
          material.push({'numero':num++,'orden':Number(row.model_id[1]),'codigo':row.materials_list[0],'nombre':row.nombre,
                            'medida':row.medida,'stock':row.materials_inventory,'cantidad':row.materials_cuantity,'entregado':row.entregado,
                            'recibe':row.recibe===false?'':row.recibe,'almacen':row.almacen,'apartado':row.materials_availabe,'requerido':row.materials_required})
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
            // console.log("param",this.codigosch); 
            if(this.codigosch === ''){
              this.ordensch=params['orden']!==undefined?params['orden']:this.ordensch;              
              this.searchOT();
            }else{
              this.searchCodigo(); 
            }           
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
