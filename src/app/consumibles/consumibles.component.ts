import { Component, OnInit } from '@angular/core';
import { OdooJsonRpcService } from '../services/inventario.service';
import { DatosService } from '../services/datos.service';

@Component({
  selector: 'app-consumibles',
  standalone: true,
  imports: [],
  templateUrl: './consumibles.component.html',
  styleUrl: './consumibles.component.css'
})
export class ConsumiblesComponent implements OnInit {
  consumibles:any[] = [];
  isVisible:boolean = false;
  
  public constructor(private odooConsumibles:OdooJsonRpcService,private odooData:DatosService){
    
  }
  descontar(event:Event) {
    let datos:any = [];
    let element = event.target as HTMLButtonElement;
    if(element.nodeName === "I"){
      element = element.parentNode as HTMLButtonElement;
    }

    let rowTable = element.parentNode?.parentNode?.parentElement as HTMLInputElement;
    let nombre = rowTable.children[0].textContent;
    let caracteristicas = rowTable.children[1].textContent;
    let cantidad = rowTable.children[2].textContent;
    let minimo = rowTable.children[3].children[0] as HTMLInputElement;
    let localizacion = rowTable.children[4].children[0] as HTMLInputElement;
    let entregado = rowTable.children[5].children[0].children[0] as HTMLInputElement;
    let recibe = rowTable.children[6].children[0] as HTMLInputElement;
    let notas = rowTable.children[7].children[0] as HTMLInputElement;
    datos={'nombre':nombre,'caracteristicas':caracteristicas,'cantidad':cantidad,'minimo':parseInt(minimo.value),'localizacion':localizacion.value,'entregado':parseInt(entregado.value),'recibe':recibe.value,'notas':notas.value}
    console.log(nombre,caracteristicas,cantidad,minimo.value,localizacion.value,entregado.value,recibe.value,notas.value)
    this.odooConsumibles.authenticate().subscribe(uid=>{
      this.odooConsumibles.read(uid,[['nombre','=',datos.nombre]],'dtm.diseno.consumibles',['id']).subscribe(getId=>{
        console.log(getId[0].id )
        let nCantidad = datos.cantidad - datos.entregado;
        this.odooConsumibles.update(uid,getId[0].id,'dtm.diseno.consumibles',
          {'cantidad':nCantidad<0?0:nCantidad,
            'minimo':datos.minimo,
            'localizacion':datos.localizacion,
            'entregado':datos.entregado,
            'recibe':datos.recibe,
            'notas':datos.notas}).subscribe()
        this.odooConsumibles.read(uid,[['id','!=','0']],'dtm.diseno.consumibles',
          ['nombre','caracteristicas','cantidad','minimo','localizacion','notas']).subscribe(datos=>{
            this.odooData.setConsumibles(datos);
            this.consumibles = this.odooData.getConsumibles();
          })
      })
    })

  }
  ngOnInit(): void {
    this.odooData.isConsumibleVisible$.subscribe(visible=>{
      this.isVisible=visible;
      this.odooConsumibles.authenticate().subscribe(uid => 
        this.odooConsumibles.read(uid,[['id','!=','0']],'dtm.diseno.consumibles',
          ['codigo','nombre','caracteristicas','cantidad','minimo','localizacion','notas']).subscribe(datos=>{
            this.odooData.setConsumibles(datos);
            const sortedArray = datos.sort((a: { cantidad: number; }, b: { cantidad: number; }) => a.cantidad - b.cantidad);
            this.consumibles = this.odooData.getConsumibles();
            
          })
      )
    })
    this.odooData.consumibles$.subscribe(datos=>{
      this.consumibles = datos;
      const findCero = datos.find(dato => dato.cantidad === 0);
      const findMin = datos.find(dato => dato.cantidad <= dato.minimo);
      // console.log(findCero);
      if (findMin){
        this.odooData.setItemMin(true);
      }
       if (findCero){
        this.odooData.setItemCero(true);
      }
    })
  }
}
