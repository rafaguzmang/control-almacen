import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DatosService {
  private invetarioSubjet = new BehaviorSubject<any[]>([]);
  inventario$ = this.invetarioSubjet.asObservable();

  private materialSubjet = new BehaviorSubject<any[]>([]);
  material$ = this.materialSubjet.asObservable();
  
  
  setInventario(datos:[]){
    this.invetarioSubjet.next(datos);
    // console.log(this.inventario);
  }
  getInventario(): any[] {
    return this.invetarioSubjet.getValue();
  }

  setMaterial(datos:[]){
    this.materialSubjet.next(datos);
  }
  getMaterial(): any[] {
    return this.materialSubjet.getValue();
  }
}
