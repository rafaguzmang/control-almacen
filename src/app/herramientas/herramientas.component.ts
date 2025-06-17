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
  
  tabla:any[] = [];
  empleados:any[] = [];
  private limit = 0;
  constructor(
    private odooConect:OdooJsonRpcService,
    private datosService: DatosService
  ){}  

  devolverTodo() {
    let persona = document.querySelector('.empleado-search') as HTMLSelectElement;
    console.log(persona.options[persona.selectedIndex].text);
    let newtabla:any = [];
    if(persona.options[persona.selectedIndex].text === '') {
      alert("Debe seleccionar a un empleado");
    }else{
      console.log(this.tabla);
      this.tabla.forEach((item:any) => {
        const datos = {'id':item.id,'cantidad':0,'responsable':'','fecha_adquisicion':'','notas':''}
        this.fetchUpdate(datos);
      });
    }
    // this.datosService.getHerramientas().forEach((item: any) => {
    //   if(String(item.responsable).match(persona.options[persona.selectedIndex].text)){
    //     newtabla.push(item);
    //   }
    // })
    // this.tabla = [];
    // this.tabla = newtabla;
  }  
  
  restaurarBtn() {
    this.tabla = [];
    this.fetchAll();        
  }

  fechaSearch(event:Event) {
    let input = event.target as HTMLDataElement;
    let newtabla:any = []; 
    this.datosService.getHerramientas().forEach((item: any) => {
      if(String(item.fecha_adquisicion).match(String(input.value))){
        newtabla.push(item);
      }
    })
    this.tabla = [];
    this.tabla = newtabla;
  }

  personaSearch(event: Event) {
    let input = event.target as HTMLSelectElement;
    let newtabla:any = []; 
    this.datosService.getHerramientas().forEach((item: any) => {
      if(String(item.responsable).match(input.options[input.selectedIndex].text)){
        newtabla.push(item);
      }
    })
    this.tabla = [];
    this.tabla = newtabla;
  }

  nombreSearch(event: Event) {
    let input = event.target as HTMLInputElement;
    let newtabla:any = []; 
    console.log(input.value);
    this.datosService.getHerramientas().forEach((item: any) => {
      if(String(item.nombre).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").match(String(input.value).normalize("NFD").replace(/[\u0300-\u036f]/g, ""))){
        newtabla.push(item);
      }
    })
    this.tabla = [];
    this.tabla = newtabla;
  }
  
  codigoSearch(event: Event) {
    let input = event.target as HTMLInputElement;
    let newtabla:any = [];
    this.datosService.getHerramientas().forEach((item: { id: any; }) => {
      if(String(item.id).match(String(input.value))){
        newtabla.push(item);
      }
    })
    this.tabla = [];
    this.tabla = newtabla;
  }

  devueltoBtn(event:Event) {
    let element = event.target as HTMLElement;
    if((event.target as HTMLElement).tagName === 'I'){
      element = element.parentElement as HTMLElement;
    }

    let row = element.parentElement?.parentElement;
    let id = Number((row?.children[0] as HTMLElement).textContent);
    (row?.children[2].children[0] as HTMLInputElement).value = '';
    (row?.children[3].children[0] as HTMLSelectElement).value = '';
    (row?.children[4] as HTMLElement).textContent = '';
    (row?.children[6].children[0] as HTMLInputElement).value = '';    
    const datos = {'id':id,'cantidad':0,'responsable':'','fecha_adquisicion':'','notas':''}
    this.fetchUpdate(datos);
  }

  entrega(event:Event) {
    let element = event.target as HTMLSelectElement;
    let row = element.parentElement?.parentElement as HTMLElement;
    let responsable = element.options[element.selectedIndex].text
    if (responsable){
      let id = (row.children[0] as HTMLInputElement).textContent;
      let cantidad = (row.children[2].children[0] as HTMLInputElement).value
      let notas = (row.children[6].children[0] as HTMLInputElement).value
      const datos = {'id':Number(id),'cantidad':Number(cantidad),'responsable':responsable,'fecha_adquisicion':new Date(),'notas':notas}
      this.fetchUpdate(datos);
    }
  }

  fetchUpdate(datos:any){
    this.odooConect.authenticate().subscribe(uid =>{
      this.odooConect.update(uid,datos.id,'dtm.herramientas',
      {'cantidad':datos.cantidad,'responsable':datos.responsable,'fecha_adquisicion':datos.fecha_adquisicion,'notas':datos.notas}).subscribe(result=>{
        this.odooConect.read(uid,[['id','!=','0']],'dtm.herramientas',['id','nombre','responsable','fecha_adquisicion'],this.limit).subscribe(result=>{
          this.datosService.setHerramientas(result);          
          this.tabla = result;
        })
        console.log("Done",result);
      })
    });
  }

  fetchAll(){
    this.odooConect.authenticate().subscribe(uid=>{
      this.odooConect.read(uid,[['id','!=','0']],'dtm.herramientas',['id','nombre','responsable','fecha_adquisicion'],this.limit).subscribe(result=>{
        this.datosService.setHerramientas(result);       
        this.tabla = this.datosService.getHerramientas();            
      })
    })  
  }

  empleadosList(){
    this.odooConect.authenticate().subscribe(uid=>{
      this.odooConect.read(uid,[['id','!=','0']],'dtm.hr.empleados',['nombre'],0).subscribe(result=>{
        this.datosService.setEmpleados(result);
        this.empleados = this.datosService.getEmpleados();
      })
    })

  }
  
  ngOnInit(): void {
    this.fetchAll();
    this.empleadosList();
    
  }

}
