import { Component, OnInit } from '@angular/core';
import { OdooJsonRpcService } from '../services/inventario.service';

@Component({
  selector: 'app-herramientas',
  standalone: true,
  imports: [],
  templateUrl: './herramientas.component.html',
  styleUrl: './herramientas.component.css'
})
export class HerramientasComponent implements OnInit {
  tabla:any[] = [];
  private limit = 20;
  constructor(private odooConect:OdooJsonRpcService){}  

  fetchAll(){
    this.odooConect.authenticate().subscribe(uid=>{
      this.odooConect.read(uid,[['caracteristicas ','=','herramienta']],'dtm.diseno.almacen',['id',],this.limit).subscribe(result=>{
        console.log(result)
      })
    })
  }
  
  ngOnInit(): void {
    this.fetchAll();
  }

}
