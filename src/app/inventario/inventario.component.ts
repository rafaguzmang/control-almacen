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

  onLocalizacionInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // console.log(`Valor ingresado: ${input.value}`);
    this.localizacion = input.value;
    if (this.nombre == "" && this.medida=="" && this.localizacion == "" ){
      this.emptyFields();
    }
  }
  
  ngOnInit(): void {
    this.inventarioService.authenticate().subscribe((uid: number) => {
      if(uid == 2){
        this.inventarioService.read(uid,[['id','!=',0]],'dtm.diseno.almacen',['id','nombre','medida','localizacion','cantidad','apartado','disponible',]).subscribe(data=>{
          this.inventarioDatos.setInventario(data);
          this.inventario = this.inventarioDatos.getInventario();
        });
      }
    });  
    
    this.inventarioDatos.inventario$.subscribe((data) => {
      this.inventario = data; // Actualiza la variable local cuando cambian los datos
      // console.log('Inventario actualizado:', this.inventario);
    });

    this.inventarioDatos.isInventVisible$.subscribe(visible=>{
      this.isInventVisible = visible;      
    })
  }
  
  actualizar(event:MouseEvent) {
    const button = event.target as HTMLElement;
    let idHtml = button.parentElement?.parentElement?.children[3] as HTMLElement;
    let localizacionHtml = button.parentElement?.parentElement?.children[3] as HTMLInputElement;
    let cantidadHtml = button.parentNode?.parentNode?.children[4] as HTMLInputElement;
    let apartadoHtml = button.parentNode?.parentNode?.children[5] as HTMLInputElement;
    let disponibleHtmal = button.parentNode?.parentNode?.children[6] as HTMLInputElement;
    if(button.parentElement?.parentElement?.nodeName != "TR"){
      idHtml = button.parentElement?.parentElement?.parentElement?.children[0] as HTMLElement;      
      localizacionHtml = button.parentElement?.parentElement?.parentElement?.children[3] as HTMLInputElement;      
      cantidadHtml = button.parentNode?.parentNode?.parentElement?.children[4].children[0] as HTMLInputElement;
      apartadoHtml = button.parentNode?.parentNode?.parentElement?.children[5].children[0] as HTMLInputElement;
      disponibleHtmal = button.parentNode?.parentNode?.parentElement?.children[6].children[0] as HTMLInputElement;
    }else{
      idHtml = button.parentElement?.parentElement?.children[0] as HTMLElement;
      localizacionHtml = button.parentElement?.parentElement?.children[3].children[0] as HTMLInputElement;
      cantidadHtml = button.parentNode?.parentNode?.children[4].children[0] as HTMLInputElement;
      apartadoHtml = button.parentNode?.parentNode?.children[5].children[0] as HTMLInputElement;
      disponibleHtmal = button.parentNode?.parentNode?.children[6].children[0] as HTMLInputElement;
    }

    let id = Number(idHtml.textContent ?? 0);
    let localizacion = localizacionHtml.value;
    let cantidad = Number(cantidadHtml.value ?? 0);
    let apartado = Number(apartadoHtml.value ?? 0);
    let disponible = Number(disponibleHtmal.value ?? 0);
    // console.log(id,localizacion,cantidad,apartado,disponible);

    this.inventarioService.authenticate().subscribe((uid: number) => {
      if(uid == 2){
        this.inventarioService.update(uid,id,'dtm.diseno.almacen',{'localizacion':localizacion,'cantidad':cantidad,'apartado':apartado,'disponible':disponible}).subscribe(data=>{
        // console.log(data)        
        });
      }
    });  
    
  }

  seach(dominio:any[]){
    this.inventarioService.authenticate().subscribe((uid: number) => {
      this.inventarioService.read(uid,dominio,'dtm.diseno.almacen',['id','nombre','medida','localizacion','cantidad','apartado','disponible',]).subscribe(data=>{
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


