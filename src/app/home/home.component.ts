import { Component, OnInit } from '@angular/core';
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
  constructor(private router:Router,private odooservice:OdooJsonRpcService,private datosservice:DatosService){}
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
  
  ngOnInit(): void {
    this.fetchAll();
  }
}
