import { Component, OnInit } from '@angular/core';
import { OdooJsonRpcService } from '../services/inventario.service';
import { DatosService } from '../services/datos.service';

@Component({
  selector: 'app-herramientas',
  standalone: true,
  imports: [],
  templateUrl: './herramientas.component.html',
  styleUrl: './herramientas.component.css'
})
export class HerramientasComponent implements OnInit {
  onLimpiarInput($event: Event) {
  throw new Error('Method not implemented.');
  }
  onEntregadoInput($event: Event) {
  throw new Error('Method not implemented.');
  }
  onCantidadInput($event: Event) {
  throw new Error('Method not implemented.');
  }
  onNombreInput($event: Event) {
  throw new Error('Method not implemented.');
  }
  onCodigoInput($event: Event) {
  throw new Error('Method not implemented.');
  }
  tabla:any[] = [];
  empleados:any[] = [];
  private limit = 20;
  constructor(
    private odooConect:OdooJsonRpcService,
    private datosService: DatosService
  ){}  

  fetchAll(){
    this.odooConect.authenticate().subscribe(uid=>{
      this.odooConect.read(uid,[['caracteristicas','=','herramienta']],'dtm.diseno.almacen',['id','nombre'],this.limit).subscribe(result=>{
        this.datosService.setHerramientas(result);
        this.tabla = this.datosService.getHerramientas();    
      })
    })  
  }
  
  ngOnInit(): void {
    this.fetchAll();
    this.empleados = this.datosService.getEmpleados();
    this.odooConect.authenticate().subscribe(uid=>{
      this.odooConect.read(uid,[['id','!=','0']],'dtm.hr.empleados',['nombre'],50).subscribe(result=>{
        this.datosService.setEmpleados(result);
        this.empleados = this.datosService.getEmpleados();
      })
    })
  }

}
