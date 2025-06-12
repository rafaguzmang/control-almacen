import { Component, NgZone, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OdooJsonRpcService } from '../services/inventario.service';
import { DatosService } from '../services/datos.service';
import { catchError, map, of, switchMap } from 'rxjs';
import { runPostSignalSetFn } from '@angular/core/primitives/signals';
import { OtstatusComponent } from "./otstatus/otstatus.component";
import { RevisionmaterialesComponent } from "./revisionmateriales/revisionmateriales.component";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [OtstatusComponent, RevisionmaterialesComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent implements OnInit {
  tabla:any[] = [];
  clientes: any[] = [];

  constructor(private router:Router,private odooservice:OdooJsonRpcService,private datosservice:DatosService,private ngzone:NgZone){}


  ordenSearch(event: Event) {   
    let input = (event.target as HTMLInputElement).value;      
    let search = this.datosservice.getClientes().filter((element: any) => String(element.ot_number).includes(input)); 
    search = search.sort((a:any,b:any)=> a.ot_number - b.ot_number);
    this.clientes = search.length > 0?search:this.datosservice.getClientes();
  }
  solicitanteSearch(event: Event) {  
    let input = (event.target as HTMLInputElement).value;  
    let search = this.datosservice.getClientes().filter((element: any) => String(element.disenador).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(input));
    search = search.sort((a:any,b:any)=> a.ot_number - b.ot_number);
    this.clientes = search.length > 0?search:this.datosservice.getClientes();
  }
  clienteSearch(event: Event) { 
    let input = (event.target as HTMLInputElement).value;  
    let search = this.datosservice.getClientes().filter((element: any) => String(element.name_client).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(input));
    search = search.sort((a:any,b:any)=> a.ot_number - b.ot_number);
    this.clientes = search.length > 0?search:this.datosservice.getClientes();
  }
  productoSearch(event: Event) { 
    let input = (event.target as HTMLInputElement).value;  
    let search = this.datosservice.getClientes().filter((element: any) => String(element.product_name).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(input));
    search = search.sort((a:any,b:any)=> a.ot_number - b.ot_number);
    this.clientes = search.length > 0?search:this.datosservice.getClientes();
  }
  
  // manda los items que no hay en almacén a comprar
  firmaBTN(event:Event) {
    let id = Number((event.target as HTMLInputElement).closest("tr")?.children[0].textContent);
    let version = Number((event.target as HTMLInputElement).closest("tr")?.children[1].textContent);
    let uid = 0;
    let ordenId = 0;
    let disenador = '';
    let tipo_orden = '';    
    let servicio = false;
    let ordenes_id:any[]=[];
    // console.log(id,version);
    this.odooservice.authenticate().pipe(
      switchMap(uidR => this.odooservice.read(uidR,
        [
          ['ot_number','=',id],
          ['revision_ot','=',version]
        ],
          'dtm.odt',
        [
          'id',
          'disenador',
          'tipe_order',
          'firma_ingenieria'
        ],
        1).pipe(
          map(result => {
            uid = uidR;
            disenador = result[0].disenador;
            tipo_orden = result[0].tipe_order;
            ordenId = result[0].id;
            ordenes_id = result;
            // console.log('ordenes_id',ordenes_id);
          })
        )
      ), 
      switchMap(() => // se leen los servicios para buscar en la lista de materiales de servicios
        this.odooservice.read(uid,[['extern_id','!=',false]],'dtm.odt.servicios',['id','extern_id'],0).pipe(
          map((servicios:any[])=>{
            servicios = servicios.filter(serv => Number(serv.extern_id[0])== ordenId)
            servicios = servicios.map(serv => serv.id)
            console.log(servicios);
            return servicios;
          })
        )

      ),
      switchMap(servicios => 
        this.odooservice.read(uid,
          [
            '|',
            ['model_id','=',ordenes_id[0].id], 
            ['servicio_id','in', servicios]
          ],
            'dtm.materials.line',
          [
            'id','materials_list','materials_required','almacen','revision','entregado'
          ],
          0
        ).pipe(
          map((result:any) => {
            console.log('result',result);
            //Hace un filtro de los materiales que no esten entregados, que no esten en compras o revisados por almacén y que requerido sea mayor a 0
            result = result.filter((iterator:any) => iterator.almacen == true &&  iterator.entregado != true && iterator.materials_required > 0 && iterator.revision == false);  
            // Quita elementos con medidas no completas  iterator.materials_list[1].match("Lámina") && iterator.materials_list[1].match("Perfil") && iterator.materials_list[1].match("120.0 x 48.0") || iterator.materials_list[1].match("96.0 x 48.0") || iterator.materials_list[1].match("96.0 x 36.0") || iterator.materials_list[1].match(",236.0")
            result = result.filter((iterator:any)=>
              {
                const str = iterator.materials_list[1];

                const lamina = str.includes("Lámina");
                const perfileria = ["Perfil", "Tubo", "P.T.R.","Ángulos","Canales","I.P.R","Varilla","Viga"].some(perfil => str.includes(perfil));
                const medidas = ["120.0 x 48.0", "96.0 x 48.0", "96.0 x 36.0", ",236.0"].some(completa => str.includes(completa));
                const completo = str.includes(",236.0")

                if(lamina && medidas) return true
                if(perfileria && completo) return true
                if(!lamina && !perfileria) return true
                return false;
              }
              
            );
            console.log(result);
            result.forEach((item:any) =>  
              this.odooservice.create(
                uid,
                'dtm.compras.requerido',
                {
                  'orden_trabajo':id,
                  'revision_ot':version,
                  'disenador':disenador=='garcia'?'Luis':'Andrés',
                  'servicio':servicio,
                  'codigo':item.materials_list[0],
                  'nombre':item.materials_list[1].slice(item.materials_list[0].toString().length, item.materials_list[1].length).trimStart(),
                  'cantidad':item.materials_required,
                  'tipo_orden':tipo_orden,
                  'nesteo':ordenes_id[0].firma_ingenieria?true:false
                }
              ).pipe(
                switchMap(()=>  this.odooservice.update(uid,item.id ,'dtm.materials.line',{'revision':true})
              )
              ).subscribe(result=>console.log('dtm.compras.requerido',result))
                          
            );
           
            return result
          })
        )
      ),
      switchMap(()=> 
        this.odooservice.update(uid,ordenId,'dtm.odt',
        {'firma_almacen':'almacen@dtmindustry.com','almacen_rev':false}).pipe(
         map(result=>console.log('almacen@dtmindustry.com',result)) 
        )
      ),
      catchError(error=>{
        console.log(error);
        return of([])
      })
    ).subscribe(result=> 
      {
        console.log(result);
        
        this.fetchAll();
       
      })

  
  }

  // Obtiene la orden para buscarla en el modulo de Ordenes
  rowSelected(event:Event) {    
    let link = (event.target as HTMLInputElement).closest('tr')?.children[0].textContent;
    this.router.navigate(['/ordenes'],{queryParams:{orden:link}})
  }

  fetchAll(){
    this.odooservice.authenticate().subscribe((uid:number)=>{
      this.odooservice.read(uid,[['almacen_rev','=','true']],'dtm.odt',['id','ot_number','revision_ot','disenador','date_disign_finish'],0).subscribe((result:any)=>{
        this.datosservice.setOrdenes(result);
        this.tabla = this.datosservice.getOrdenes();
      })
    })
  }

  fetchClientes(){
    this.odooservice.authenticate().subscribe((uid:number)=>{
      this.odooservice.read(uid,[['firma_ventas','!=',false],['ot_number','!=','0']],'dtm.odt',['id','ot_number','disenador','name_client','product_name'],0).subscribe((result:any)=>{
        this.datosservice.setClientes(result);
        this.clientes = this.datosservice.getClientes();        
      })
    })
  }
  
  ngOnInit(): void {
    this.fetchAll(); 
    this.ngzone.runOutsideAngular(()=>{
      setInterval(() => {
        this.ngzone.run(()=>{
          this.fetchAll();    
        })
      }, 5000);
    }) 
    this.fetchClientes();   
  }
}


