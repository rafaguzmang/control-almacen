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

  private controlEntradasSubjet = new BehaviorSubject<any[]>([]);
  controlEntradas$ = this.controlEntradasSubjet.asObservable();

  private isInventVisible = new BehaviorSubject<boolean>(false);
  isInventVisible$ = this.isInventVisible.asObservable();

  private isInordVisible = new BehaviorSubject<boolean>(false);
  isInordVisible$ = this.isInordVisible.asObservable();

  private isContentVisible = new BehaviorSubject<boolean>(false);
  isContentVisible$ = this.isContentVisible.asObservable();

  
  setControlEntradas(datos:[]){
    this.controlEntradasSubjet.next(datos);
  }
  
  getControlEntradas():any[]{
    return this.controlEntradasSubjet.getValue();
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
  
  setIsInordVisible(estado:boolean){
    this.isInordVisible.next(estado);
  }
  
  getIsInordVisible():boolean{
    return this.isInordVisible.getValue();
  }
  
  setIsContentVisible(estado:boolean){
    this.isContentVisible.next(estado);
  }

  getIsContentVisible():boolean{
    return this.isContentVisible.getValue();
  }


}
