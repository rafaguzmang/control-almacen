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

  private isInventVisible = new BehaviorSubject<boolean>(false);
  isInventVisible$ = this.isInventVisible.asObservable();

  private isInordVisible = new BehaviorSubject<boolean>(false);
  isInordVisible$ = this.isInordVisible.asObservable();

  setIsInordVisible(estado:boolean){
    this.isInordVisible.next(estado);
  }

  getIsInordVisible():boolean{
    return this.isInordVisible.getValue();
  }
  
  setInventario(datos:[]){
    this.invetarioSubjet.next(datos);
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

  setIsInventVisible(estado:boolean){
     this.isInventVisible.next(estado);
  }
  getIsInventVisible():boolean{
    return this.isInventVisible.getValue();
  }

}
