import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OdooJsonRpcService } from '../services/inventario.service';
import { DatosService } from '../services/datos.service';

@Component({
  selector: 'app-nav-inventario',
  standalone: true,  // Esto lo convierte en un componente standalone
  imports: [CommonModule],  // Importa módulos necesarios
  templateUrl: './nav-inventario.component.html',
  styleUrls: ['./nav-inventario.component.css']
})
export class NavInventarioComponent implements OnInit {

homeBoton() {
throw new Error('Method not implemented.');
}
  
  cantMinItem:boolean = false;
  cantCero:boolean = false;
  constructor(private buscar:OdooJsonRpcService,private resultado:DatosService){}  
  

  consumiblesBoton() {
    this.resultado.setIsConsumibleVisible(true)
    this.resultado.setIsContentVisible(false);
    this.resultado.setIsInordVisible(false);
    this.resultado.setIsInventVisible(false); 
  }
  controlBoton() {
    this.resultado.setIsContentVisible(true);
    this.resultado.setIsInordVisible(false);
    this.resultado.setIsInventVisible(false); 
     this.resultado.setIsConsumibleVisible(false)
  }
  
  ordenBoton() {
    this.resultado.setIsInordVisible(true)
    this.resultado.setIsInventVisible(false);
    this.resultado.setIsContentVisible(false);
     this.resultado.setIsConsumibleVisible(false)
  }
  inventBoton() {
   this.resultado.setIsInventVisible(true);
   this.resultado.setIsInordVisible(false);
   this.resultado.setIsContentVisible(false);
    this.resultado.setIsConsumibleVisible(false)
  }

  ngOnInit(): void {
    this.resultado.cantMinItem$.subscribe(minimo=>{
      this.cantMinItem = minimo;
    })
    this.resultado.cantCero$.subscribe(cero=>{
      this.cantCero = cero;
    })
  }

  // navBuscar() {
  //   const textfield = document.querySelector('#fname-buscar') as HTMLInputElement;
  //   this.buscar.authenticate().subscribe((uid: number) => {
  //     if(uid == 2){
  //       this.buscar.read(uid,['nombre','like',textfield.value],'dtm.diseno.almacen',['id','nombre','medida','localizacion','cantidad','apartado','disponible',]).subscribe(data=>{
  //         this.resultado.setInventario(data);
  //       });
  //     }
  //   });
  // }

}
