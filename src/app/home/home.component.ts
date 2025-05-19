import { Component, NgZone, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { OdooJsonRpcService } from '../services/inventario.service';
import { DatosService } from '../services/datos.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
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
  
  firmaBTN(event:Event) {
    let id = (event.target as HTMLInputElement).closest("tr")?.children[0].textContent
    this.odooservice.authenticate().subscribe((uid:number)=>{
      this.odooservice.read(uid,[['ot_number','=',Number(id)]],'dtm.odt',['id'],1).subscribe((result:any)=>{
        this.odooservice.update(uid,Number(result[0].id),'dtm.odt',
        {'firma_almacen':'almacen@dtmindustry.com','almacen_rev':false}).subscribe(done=>{
          console.log(done)
          this.fetchAll();
        })
      })
    })
  }

  // Obtiene la orden para buscarla en el modulo de Ordenes
  rowSelected(event:Event) {    
    let link = (event.target as HTMLInputElement).closest('tr')?.children[0].textContent;
    this.router.navigate(['/ordenes'],{queryParams:{orden:link}})
  }

  fetchAll(){
    this.odooservice.authenticate().subscribe((uid:number)=>{
      this.odooservice.read(uid,[['almacen_rev','=','true']],'dtm.odt',['id','ot_number','disenador','date_disign_finish'],0).subscribe((result:any)=>{
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
