import { Component } from '@angular/core';
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
export class NavInventarioComponent {

constructor(private buscar:OdooJsonRpcService,private resultado:DatosService){

}

  navBuscar() {
    const textfield = document.querySelector('#fname-buscar') as HTMLInputElement;
    this.buscar.authenticate().subscribe((uid: number) => {
      if(uid == 2){
        this.buscar.read(uid,['nombre','like',textfield.value]).subscribe(data=>{
          this.resultado.setInventario(data);
        });
      }
    });

  }

}
