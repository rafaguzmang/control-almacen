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
  
  private consumibles:any = [];
  
  private herramientas:any = [];
  
  private ordenes:any = [];
  
  private clientes:any = [];
  
  private onlyMaterials:any = [];
  
  //Indicador si hay items en consumibles con valores de minimos o cero
  private cantMinItem = new BehaviorSubject<boolean>(false);
  cantMinItem$ = this.cantMinItem.asObservable();
  private cantCero = new BehaviorSubject<boolean>(false);
  cantCero$ = this.cantCero.asObservable();
  
  private empleados = new BehaviorSubject<any[]>([]);
  empleados$ = this.empleados.asObservable();

  getOnlyMateriales(): any[] {
    return this.onlyMaterials;
  }

  setOnlyMaterials(materiales: any) {
    this.onlyMaterials = materiales;
  }

  setClientes(datos:[]){
    this.clientes = datos;
  }

  getClientes():any{
    return this.clientes;
  }

  setOrdenes(datos:[]){
    this.ordenes = datos;
  }

  getOrdenes():any{
    return this.ordenes;
  }
  
  setEmpleados(datos:[]){
    this.empleados.next(datos);
  }

  getEmpleados(){
    return this.empleados.getValue();
  }

  setHerramientas(datos:[]){
    this.herramientas = datos;
  }

  getHerramientas(){
    return this.herramientas;
  }
  
  setItemCero(dato: boolean) {
    this.cantCero.next(dato)
  }

  getItemCero():boolean{
    return this.cantCero.getValue();
  }
  
  setItemMin(dato: boolean) {
    this.cantMinItem.next(dato)
  }

  getItemMin():boolean{
    return this.cantMinItem.getValue();
  }
  
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

  setConsumibles(datos:[]){
    this.consumibles = datos;
  }
  
  getConsumibles():any{
    return this.consumibles;
  }
}
