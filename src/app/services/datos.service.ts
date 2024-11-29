import { Injectable } from '@angular/core';
import { InventarioComponent } from '../inventario/inventario.component';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DatosService {
  private invetarioSubjet = new BehaviorSubject<any[]>([]);
  inventario$ = this.invetarioSubjet.asObservable();
  
  
  setInventario(datos:[]){
    this.invetarioSubjet.next(datos);
    // console.log(this.inventario);
  }
  getInventario(): any[] {
    return this.invetarioSubjet.getValue();
  }
}
