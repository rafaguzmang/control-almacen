import { Component, OnInit } from '@angular/core';
import { OdooJsonRpcService } from '../services/inventario.service';
import { DatosService } from '../services/datos.service';
import { ActivatedRoute } from '@angular/router';
import { catchError, map, Observable, of, Subscriber, switchMap, tap } from 'rxjs';
import { get } from 'node:http';

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
  limit:number = 10;
  ordensch:number = 0;
  codigosch:string = '';
  cliente: string = '';
  proyecto: string = '';
  
  constructor(private odooConect:OdooJsonRpcService, private dataMat:DatosService,private route:ActivatedRoute){}


  // updateData(uid:number,id:number,modelo:string,val:any){
  //   this.odooConect.update(uid,id,'dtm.diseno.almacen',val).subscribe()
  // }
  
  almacenEntregado(event:Event){
    let cantidad = Number((event.target as HTMLInputElement).value);
    let codigo = Number((event.target as HTMLInputElement).closest('tr')?.children[2].textContent);
    let orden = Number((event.target as HTMLInputElement).closest('tr')?.children[0].textContent);
    let version = Number((event.target as HTMLInputElement).closest('tr')?.children[1].textContent);
    let id = this.dataMat.getMaterial().find(row => row.codigo == codigo && row.orden == orden && row.version == version).id
    console.log(id);
    this.odooConect.authenticate().pipe(
      switchMap(uid=> this.odooConect.update(uid,id,'dtm.materials.line',{'cant_entregada':cantidad}))
    ).subscribe(()=>{
       
    })
  }
  almacenFNC(event:Event) {
    let stock = Number((event.target as HTMLInputElement).value);
    let codigo = Number((event.target as HTMLInputElement).closest('tr')?.children[2].textContent);
    let orden = Number((event.target as HTMLInputElement).closest('tr')?.children[0].textContent);
    let version = Number((event.target as HTMLInputElement).closest('tr')?.children[1].textContent);
    let cantidad = Number((event.target as HTMLInputElement).closest('tr')?.children[8].textContent);
    console.log(stock,codigo,orden,version,cantidad);
    this.odooConect.authenticate().pipe(
      // Se obtiene el id del material según almacén cantidad,apartado y disponible  
      switchMap(uid => this.odooConect.read(uid,[['id','=',codigo]],'dtm.materiales',
        ['id','cantidad','apartado','disponible'],0).pipe(
          map((almacen:any[]) =>{
            return {uid,almacen}
          })
        )
      ),
      map(result => {
        let tablaMateriales:any = this.dataMat.getMaterial();
        // let almacenItem = result.almacen[0];
        let selfItem:any={};
        tablaMateriales = tablaMateriales.filter((row:any) => row.codigo == codigo)
        // console.log("tablaMateriales",tablaMateriales);
        // console.log("almacenItem",almacenItem);

        selfItem = tablaMateriales.find((row:any)=> Number(row.orden)==orden && row.version==version)

        let apartado = selfItem.apartado;
        let requerido = selfItem.requerido;
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
        // Se hace el cálculo en el material seleccionado
        let newTabla:any = this.dataMat.getMaterial().forEach(item => {
            if (item.id == selfItem.id){
              item.apartado = apartado;
              item.requerido = requerido;
            }
          })

        // Se actualiza la tabla materiales con el item seleccionado
        this.dataMat.setClientes(newTabla);
        // Se obtiene la tabla materiales con los cambios para hacer calculos en las otras ordenes que requieren el mismo item        
        tablaMateriales = this.dataMat.getMaterial();
        tablaMateriales = tablaMateriales.filter((row:any) => row.revision != true && row.entregado != true && row.codigo == codigo)
        let apartados = tablaMateriales.reduce((total:number,cantidad:any) => total + cantidad.apartado,0);//Se suman todos los apartados de las ordenes que solicitan este material
        let disponibles = (stock - apartados)>0?stock-apartados:0; //Saca los disponibles restando los apartados del stock
        // console.log(apartados,disponibles);
        for(let material of tablaMateriales){ // Pone cero en apartado en todas las ordenes y la cantidad solicitada en requerido
            if(disponibles == 0 && material.id != selfItem.id ){
              material.requerido = material.cantidad;
              material.apartado = 0;                  
              // console.log('Cero');
              // console.log("disponibles",disponibles);
            } 
        }  
        for(let material of tablaMateriales){  
          if(material.id != selfItem.id && material.requerido > 0 && disponibles > 0){  //Si el material disponible es cero no se efectua el loop
            // console.log('disponibles',disponibles);
            if (material.requerido == disponibles && material.requerido > 0 ) { //Si el material es requerido es igual al disponible se deja de ejecutar el loop
              material.requerido = 0;
              material.apartado = material.apartado + disponibles;
              disponibles = 0; 
              // console.log('Igual',disponibles);
              // console.log("disponibles",disponibles);
              break;            
            }  else if(material.cantidad > disponibles){ //Si el disponible es menor que el que lo solicitado este se resta y se deja de ejecutar el loop
              material.requerido = (material.cantidad - disponibles)>0?material.cantidad - disponibles:0;
              material.apartado = disponibles;
              disponibles = 0;
              // console.log('Hay poquito',disponibles);
              // console.log("disponibles",disponibles);
              break;
            } else if(material.cantidad < disponibles){//Si el material disponible es mayor al solicitado este se inyecta y se continua el loop
              material.requerido = 0;
              material.apartado = material.cantidad;
              disponibles = disponibles - material.cantidad;
              // console.log('Si hay',disponibles,material.cantidad,material.orden);
              // console.log("disponibles",disponibles);
            }  
          }
          // itemList.push(material);
          // console.log("disponibles",disponibles);
        }    
        // console.log(tablaMateriales);
        apartados = tablaMateriales.reduce((total:number,cantidad:any) => total + cantidad.apartado,0);
        newTabla = this.dataMat.getMaterial();
        newTabla.forEach((item:any)=>{
          const encontrado = tablaMateriales.find((iterator:any)=> item.id == iterator.id);
          if(encontrado){
            encontrado.requerido = item.requerido;
            encontrado.apartado = item.apartado;
            encontrado.stock = stock;
            encontrado.proyectado = apartados;
          }
        });
        

        // Se actualiza la información en la tabla del front
        this.dataMat.setMaterial(newTabla);
        this.material = this.dataMat.getMaterial();
       
        if(this.ordensch ){
          this.searchOT();
        }else{
          this.searchCodigo();          
        }

        return {result,tablaMateriales,apartados}
      }),     
      
    ).subscribe(({result,tablaMateriales,apartados}) => {  
        // console.log(apartados);      
        this.odooConect.update(result.uid,codigo,'dtm.materiales',{'cantidad':stock,'apartado':apartados,'disponible':stock-apartados}).pipe(
          switchMap(()=>{
            tablaMateriales.forEach((item:any) =>{
              this.odooConect.update(result.uid,item.id,'dtm.materials.line',{'materials_required':item.requerido,'materials_availabe':item.apartado}).subscribe();
            });
            return '';
          })
        ).subscribe(()=>console.log('Listo!!'))
    });

           
    
   
   
    
    
     
  }
  
  exitenciaCBX(event:Event) {
    let input = event.target as HTMLInputElement;
    let rowTable = input.parentElement?.parentElement;  
    let orden = Number((rowTable?.children[0] as HTMLAnchorElement).textContent);
    let version = Number((rowTable?.children[1] as HTMLAnchorElement).textContent);
    let codigo = Number((rowTable?.children[2] as HTMLAnchorElement).textContent);
    let cantidad = Number((rowTable?.children[8] as HTMLAnchorElement).textContent);
    // Informa a ingeniería que ya reviso este item
    
        this.odooConect.authenticate().pipe(
        
        map(uid => {
          let rowId = this.dataMat.getMaterial().find(row=> row.codigo == codigo && row.orden == orden && row.version == version && row.cantidad == cantidad).id
          return {uid,rowId}
        }),
        switchMap(({uid,rowId})=> this.odooConect.update(uid,rowId,'dtm.materials.line',{'almacen':input.checked}).pipe(
            map(()=>{return ''})
          )
        ),      
        catchError(error => {
          alert(`Fallo de comunicación: ${error}`);
          return of([]); 
        })      
      ).subscribe(result=>console.log(input.checked));

    
  }
  // Botón para entregar el material a producción
  entregado(event: Event ):void {
    let rowTable = (event.target as HTMLInputElement).closest('tr');  
    let version = Number(rowTable?.children[1].textContent??'0');
    let orden = Number(rowTable?.children[0].textContent);
    let codigo = Number(rowTable?.children[2].textContent??'0');
    let stock = Number(rowTable?.children[6].textContent??'0');
    let proyectado = Number(rowTable?.children[7].textContent??'0');
    let entregado = Number(rowTable?.children[11].children[0].children[0] as HTMLInputElement);
    let recibe =  rowTable?.children[11].children[0].children[1] as HTMLSelectElement;
    let id = this.dataMat.getMaterial().find(row => row.codigo == codigo && row.orden == orden && row.version == version).id
    this.odooConect.authenticate().pipe(      
      switchMap(uid=> this.odooConect.update(uid,id,'dtm.materials.line',{'entregado':true,'recibe':recibe.options[recibe.selectedIndex].text}).pipe(
            map(()=>{return uid})
          )
      ), 
      switchMap((uid)=> this.odooConect.update(uid,codigo,'dtm.materiales',{'cantidad':Math.max(stock - entregado,0),'apartado':Math.max(proyectado - entregado,0),'disponible':Math.max((stock - entregado)-(proyectado - entregado),0) }).pipe(
            map(()=>{return uid})
          )
      ), 
      switchMap((uid)=> this.odooConect.update(uid,id,'dtm.materials.line',{'cant_entregada':entregado}).pipe(
            map(()=>{return uid})
          )
      ), 
      catchError(error => {
          alert(`Fallo de comunicación: ${error}`);
          return of([]); 
        })   
      
    ).subscribe(()=>{
       this.dataMat.getMaterial().find(row => {
         if(row.id == id){
            console.log(row);
            row.entregado = true;
          }
        })
        if(this.ordensch ){
          this.searchOT();
        }else{
          this.searchCodigo();          
        }
    })
      
     
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
    let search = searchTable.filter((filter:any) => String(filter.codigo) == this.codigosch)
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
  
 
  // Función para leer la lista de empleados
  empleadosList(){
    this.odooConect.authenticate().pipe(
      switchMap(uid => this.odooConect.read(uid,[['id','!=','0']],'dtm.hr.empleados',['nombre'],0))
    ).subscribe(result =>{
      this.dataMat.setEmpleados(result);
      this.empleados = this.dataMat.getEmpleados();
    });
  }

  fetchodooConect(){
    let material:any[] = [];
    let num = 0;
    this.odooConect.authenticate().pipe(
      // Lee la lista de materiales de todas las ordenes
      switchMap(uid=> 
        this.odooConect.read(
          uid,
          [
            ['model_id','!=',false]
          ],
          'dtm.materials.line',
          [ 
            'id',
            'materials_list',
            'nombre',
            'medida',
            'materials_cuantity',
            'materials_inventory',
            'materials_availabe',
            'materials_required',
            'entregado',
            'recibe',
            'notas',
            'almacen',
            'model_id',
            'revision',            
            'cant_entregada',            
          ],
          0
        ).pipe(map((ordenes:any[])=>{
          return{uid,ordenes};
        }))
      ),
      switchMap(({uid,ordenes})=> 
        this.odooConect.read(
          uid,
          [['ot_number', '!=',0 ]],
          'dtm.odt',
          ['id','revision_ot','ot_number'],
          0
        ).pipe(
          map((ordenId:any[])=>{
            return {uid,ordenes,ordenId}
          })
        )
      ),
      // Se crea una tabla para agregar todos los datos necesarios
      switchMap(({ uid, ordenes, ordenId }) => {
        ordenes.forEach((row:any) =>{
          material.push({
            'id':row.id,
            'numero':num++,
            'orden':row.model_id[1],
            'version':ordenId.find((version: any) => version.id == row.model_id[0])?.revision_ot ?? 1,
            'codigo':row.materials_list[0],
            'nombre':row.nombre,            
            'medida':row.medida,
            'stock':0,
            'cantidad':row.materials_cuantity,
            'entregado':row.entregado,            
            'recibe':row.recibe===false?'':row.recibe,
            'almacen':row.almacen,
            'apartado':row.materials_availabe,
            'requerido':row.materials_required,
            'proyectado':0,
            'revision':row.revision,
            'yaentregada': row.cant_entregada
          })
        }) 
      //   // Lee todo el inventario para poder agregar el stock cargado en sistema
        return this.odooConect.read(uid,[['id','!=','0']],'dtm.materiales',['id','cantidad','apartado'],0)
        // return ordenId
      }),
      map((inventario:any[])=>{
        // Crea un json con el id y agrega la cantidad id:cantidad del material, material apartado
         const cantidad:any = {};
         inventario.forEach(row => {
          cantidad[row.id]= [row.cantidad,row.apartado];
          
         })
         // Agrega el stock y proyectado a cada elemento asociado a sus ordenes de trabajo
         material.forEach(item=>{
          item.stock = cantidad[item.codigo][0];
          item.proyectado = cantidad[item.codigo][1];
         })
         return material; 
      }),
      catchError(error => {
        console.error('Error en la conexión con Odoo:', error);
        return of([]); 
      })
      
    ).subscribe((result:any) => {
      // console.log(material);
      // Pasa la información a la tabla correspondiente en un service  
      this.dataMat.setMaterial(result);
      // Carga la tabla local con la información desde el service
      this.material = this.dataMat.getMaterial();
      // Obtiene el id mandado desde home para filtrar
      this.route.queryParams.subscribe(params => {
        if (this.codigosch === '') {
          this.ordensch = params['orden'] !== undefined ? params['orden'] : this.ordensch;
          this.searchOT();
        } else {
          this.searchCodigo();
        }
      });
    })
  }

  ngOnInit(): void {
    // Obtiene la lista de materiales de todas las ordenes y las guarda en local
    this.fetchodooConect( );
    // Obtiene la lista de empleados
    this.empleadosList();
   
  }
}
