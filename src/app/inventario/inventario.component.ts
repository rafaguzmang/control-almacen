import { Component, OnInit } from '@angular/core';
import { OdooJsonRpcService } from '../services/inventario.service';
import { CommonModule } from '@angular/common';
import { DatosService } from '../services/datos.service';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inventario.component.html',
  styleUrl: './inventario.component.css'
})
export class InventarioComponent implements OnInit{
  inventario: any [] = [];
  isInventVisible:boolean = true;
  // Variables para hacer los filtros
  private nombre:string = "";
  private medida:string = "";
  private localizacion:string = "";

  constructor(private inventarioService:OdooJsonRpcService,
    private inventarioDatos:DatosService
  ){}

  

  emptyFields(){
    this.seach([['id','!=',0]])
  }
  onCodigoInput(event: Event): void {
    let input = event.target as HTMLInputElement;
    this.seach([['id','=',input.value]])
    if (input.value==="0" && this.nombre == "" && this.medida=="" && this.localizacion == "" ){
      this.emptyFields();
    }
  }

  onNombreInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // console.log(`Valor ingresado: ${input.value}`);
    this.nombre = input.value;
    this.seach([['nombre','like',this.nombre],['medida','like',this.medida],['localizacion','like',this.localizacion]]);
    if (this.nombre == "" && this.medida=="" && this.localizacion == "" ){
      this.emptyFields();
    }
  }

  onMedidaInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // console.log(`Valor ingresado: ${input.value}`);
    this.medida = input.value;
    this.seach([['nombre','like',this.nombre],['medida','like',this.medida],['localizacion','like',this.localizacion]]);
    if (this.nombre == "" && this.medida=="" && this.localizacion == "" ){
      this.emptyFields();
    }
  }

  // Botón para actualizar información 
  onLocalizacionInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // console.log(`Valor ingresado: ${input.value}`);
    this.localizacion = input.value;
    this.seach([['nombre','like',this.nombre],['medida','like',this.medida],['localizacion','like',this.localizacion]]);
    if (this.nombre == "" && this.medida=="" && this.localizacion == "" ){
      this.emptyFields();
    }
  }
  fetchInventario(){
    this.inventarioService.authenticate().subscribe((uid: number) => {
      if(uid == 2){
        this.inventarioService.read(uid,[['id','!=',0]],'dtm.diseno.almacen',['id','nombre','medida','localizacion','cantidad','apartado','disponible',],10).subscribe(data=>{
          this.inventarioDatos.setInventario(data);
          this.inventario = this.inventarioDatos.getInventario();
        });
      }
    });   
  }
  ngOnInit(): void {
    this.inventarioDatos.isInventVisible$.subscribe(visible=>{
      this.isInventVisible = visible;   
      this.fetchInventario();
    })
    
    this.inventarioDatos.inventario$.subscribe((data) => {
      this.inventario = data; // Actualiza la variable local cuando cambian los datos
      // console.log('Inventario actualizado:', this.inventario);
    });

  }
  
  actualizar(event:Event) {    
    let element = event.target as HTMLButtonElement
    if(element.nodeName === "I"){
      element = element.parentNode as HTMLButtonElement;      
    }

    let rowTable = element.parentNode?.parentElement as HTMLInputElement;
    console.log(rowTable);    
    let id = rowTable.children[0].textContent??'0';
    let localizacion = rowTable.children[3].children[0] as HTMLInputElement;
    let cantidad = rowTable.children[4].children[0] as HTMLInputElement;
    let apartado = rowTable.children[5].children[0] as HTMLInputElement;
    let disponible = rowTable.children[6].children[0] as HTMLInputElement;
    console.log(id,localizacion.value,cantidad.value,apartado.value,disponible.value);

    this.inventarioService.authenticate().subscribe((uid: number) => {
      if(uid == 2){
        this.inventarioService.update(uid,parseInt(id),'dtm.diseno.almacen',
          {'localizacion':localizacion.value,'cantidad':cantidad.value,'apartado':apartado.value,'disponible':disponible.value}).subscribe(data=>{
          console.log(data)
          // this.fetchInventario();  
          alert("Actualizado!!")      
        });
      }
    });  
    
  }

  seach(dominio:any[]){
    this.inventarioService.authenticate().subscribe((uid: number) => {
      this.inventarioService.read(uid,dominio,'dtm.diseno.almacen',['id','nombre','medida','localizacion','cantidad','apartado','disponible',],10).subscribe(data=>{
        this.inventarioDatos.setInventario(data);
        this.inventario = this.inventarioDatos.getInventario();
      });

    });  
    this.inventarioDatos.inventario$.subscribe((data) => {
      this.inventario = data; // Actualiza la variable local cuando cambian los datos
      // console.log('Inventario actualizado:', this.inventario);
    });
  }
}


