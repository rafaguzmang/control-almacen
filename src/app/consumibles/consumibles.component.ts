import { Component, OnDestroy, OnInit } from '@angular/core';
import { OdooJsonRpcService } from '../services/inventario.service';
import { DatosService } from '../services/datos.service';
import { interval, Subscription, switchMap } from 'rxjs';
import internal from 'stream';

@Component({
  selector: 'app-consumibles',
  standalone: true,
  imports: [],
  templateUrl: './consumibles.component.html',
  styleUrl: './consumibles.component.css'
})
export class ConsumiblesComponent implements OnInit {
  consumibles:any[] = [];
  empleados:any [] = [];
  configuracion:boolean = false;
  btnconfigcolor:string = "";
  private limit:number = 0;
  private autoRefreshSub: Subscription = new Subscription();
  
  public constructor(private odooConsumibles:OdooJsonRpcService,private odooData:DatosService){
    
  }
  minimoBtn() {
    this.configuracion = !this.configuracion;
      if(this.configuracion){
      this.btnconfigcolor = "yellow"
    }else{
      this.btnconfigcolor = ""
    }

  }
  restablecerBtn() {    
    this.consumibles = this.odooData.getConsumibles();
    let codigo = document.querySelector(".cogigo-search") as HTMLInputElement;    
    let nombre = document.querySelector(".nombre-search") as HTMLInputElement;    
    let medida = document.querySelector(".medida-search") as HTMLInputElement;    
    codigo.value = ''
    nombre.value = ''
    medida.value = ''
  }
  medidaSearch(event:Event) {
    let input = event.target as HTMLInputElement;
    let newtabla:any = [];
    this.odooData.getConsumibles().forEach
    // this.odooData.getConsumibles().forEach(element => {
    //   if(String(element.medida).toLocaleLowerCase().match(input.value.toLowerCase())){
    //     newtabla.push(element);
    //   }
    // })
    this.consumibles = [];
    this.consumibles = newtabla;
    if(input.value ===""){
      this.consumibles = [];
      this.consumibles = this.odooData.getConsumibles();
    }
    
  }
  nombreSearch(event:Event) {
    let input = event.target as HTMLInputElement;
    let newtabla:any = [];
    this.consumibles.forEach(element => {
      if(String(element.nombre).toLowerCase().match(input.value.toLowerCase())){
        newtabla.push(element);
      }
    })
    this.consumibles = [];
    this.consumibles = newtabla;
    if(input.value ===""){
      this.consumibles = [];
      this.consumibles = this.odooData.getConsumibles();
    }
  }
  codigoSearch(event:Event) {
    let input = event.target as HTMLInputElement;
    let newtabla:any = [];
    this.consumibles.forEach(element => {
      if(String(element.id).match(input.value)){
        newtabla.push(element);
      }
    })
    this.consumibles = [];
    this.consumibles = newtabla;
    if(input.value ===""){
      this.consumibles = [];
      this.consumibles = this.odooData.getConsumibles();
    }
  }
  
  actualizarMin(event: Event) {
    let element = event.target as HTMLInputElement;
    let row = element.parentElement?.parentElement?.parentElement as HTMLInputElement
    let codigo = row.children[0].textContent==null?0:parseInt(row.children[0].textContent);
    let minimo = element.value

    this.odooConsumibles.authenticate().subscribe(uid=>{
      this.odooConsumibles.update(uid,codigo,'dtm.diseno.almacen',{'minimo':minimo}).subscribe(result=>console.log(result))
    })
    

  }
  descontar(event:Event) {
    let datos:any = [];
    let element = event.target as HTMLButtonElement;
    if(element.nodeName === "I"){
      element = element.parentNode as HTMLButtonElement;
    }

    let rowTable = element.parentNode?.parentNode?.parentElement as HTMLInputElement;//Se encuentra el valor de la fila
    let codigo = rowTable.children[0].textContent;
    let nombre = rowTable.children[1].textContent;
    let cantidad = rowTable.children[4].textContent;
    let entregado = rowTable.children[5].children[0].children[0] as HTMLInputElement;
    let recibe = rowTable.children[6].children[0] as HTMLSelectElement;
    let notas = rowTable.children[7].children[0] as HTMLInputElement;
    console.log(recibe)
    datos={'codigo':codigo,'nombre':nombre,'cantidad':cantidad,'entregado':parseInt(entregado.value),'recibe':recibe.options[recibe.selectedIndex].text,'notas':notas.value}
    console.log(datos)
    this.odooConsumibles.authenticate().subscribe(uid=>{
      this.odooConsumibles.create(uid,'dtm.diseno.consumibles',
        {
          'fecha':new Date(),
          'codigo':datos.codigo,
          'nombre':datos.nombre,
          'cantidad':datos.cantidad,
          'entregado':datos.entregado,
          'recibe':datos.recibe,
          'notas':datos.notas}).subscribe(result=>{console.log(result)
          })
      this.odooConsumibles.read(uid,[['id','=',datos.codigo]],'dtm.diseno.almacen',['cantidad'],1).subscribe(cantidad => {
        let nCantidad = cantidad[0].cantidad - datos.entregado
        this.odooConsumibles.update(uid,datos.codigo,'dtm.diseno.almacen',
          {'cantidad':nCantidad<0?0:nCantidad,
            'disponible':0
           }).subscribe(result=>{console.log(result)})
           this.fetchConsumibles();
      })
     
    })

  }

  fetchConsumibles(): void {
    this.odooConsumibles.authenticate().pipe(
      switchMap((uid)=>
      this.odooConsumibles.read(uid,[['caracteristicas','=','consumible']],'dtm.diseno.almacen',
        ['id','nombre','cantidad','minimo','localizacion','medida'],this.limit))
    ).subscribe({
      next:(datos) => {
        const sortedArray = datos.sort((a: {cantidad:number},b:{cantidad:number})=> a.cantidad - b.cantidad);
        this.odooData.setConsumibles(sortedArray);
        this.consumibles = this.odooData.getConsumibles();
      }
    })  
    
  }

  ngOnInit(): void {
    this.fetchConsumibles();
   
    this.consumibles = this.odooData.getConsumibles();
    // console.log(datos)
    const findCero = this.consumibles.find(dato => dato.cantidad === 0);
    const findMin = this.consumibles.find(dato => dato.cantidad <= dato.minimo);
    // console.log(findCero);
    //Encuentra si hay items con mínimo requerido o cero y pone una vandera
    if (findMin){
      this.odooData.setItemMin(true);
    }
      if (findCero){
      this.odooData.setItemCero(true);
    }
   
    this.odooConsumibles.authenticate().subscribe(uid =>{
      this.odooConsumibles.read(uid,[['id','!=','0']],'dtm.hr.empleados',['nombre'],0).subscribe(empleados=>{
        this.odooData.setEmpleados(empleados);
        this.empleados = this.odooData.getEmpleados();
      })
    })
    // this.autoRefresh();
  }

  autoRefresh():void{
    this.autoRefreshSub = interval(10000)
    .pipe(
      switchMap(()=>this.odooConsumibles.authenticate()),
      switchMap((uid)=>
        this.odooConsumibles.read(
          uid,
          [['caracteristicas', '=', 'consumible']],
          'dtm.diseno.almacen',
          ['id', 'nombre', 'cantidad', 'minimo', 'localizacion', 'medida'],
          this.limit
        )
      )
    ).subscribe({
      next: (datos) => {
        const sortedArray = datos.sort((a: { cantidad: number }, b: { cantidad: number }) => a.cantidad - b.cantidad);
        this.odooData.setConsumibles(sortedArray);
        this.consumibles = this.odooData.getConsumibles();
      }
    }
    )
  }

  

  
}
