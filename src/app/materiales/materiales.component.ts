import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { OdooJsonRpcService } from '../services/inventario.service';
import { DatosService } from '../services/datos.service';

@Component({
  selector: 'app-materiales',
  standalone: true,
  imports: [],
  templateUrl: './materiales.component.html',
  styleUrl: './materiales.component.css'
})
export class MaterialesComponent implements OnInit{
  
  table:any [] = [];
  
  // Variables para la configuración de máximos y mínimos
  btnconfigcolor:string = "gray";
  configuracion:boolean = true;
  
  constructor(
    private odooConect:OdooJsonRpcService,
    private datosService:DatosService,
    private cdr: ChangeDetectorRef
  ){}

  
  // busca por código
  codigoSearch(event:Event) {
    let input = (event.target as HTMLInputElement).value;
    let search = this.datosService.getOnlyMateriales().filter(row=>String(row.id).includes(input));
    this.table = search.length > 0?search:this.datosService.getOnlyMateriales();
  }
  // busca por nombre
  nombreSearch(event:Event) {
    let input = (event.target as HTMLInputElement).value;
    const search = this.datosService.getOnlyMateriales().filter(row=>String(row.nombre).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(input));
    this.table = search.length > 0?search:this.datosService.getOnlyMateriales();
  }
  // busca por material
  materialSearch(event:Event) {
    let input = (event.target as HTMLInputElement).value;
    const search = this.datosService.getOnlyMateriales().filter(row=>String(row.medida).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(input));
    this.table = search.length > 0?search:this.datosService.getOnlyMateriales();
  }
  
  // Botón de configuración para mínimos y máximos
  minimoBtn() {
    this.configuracion = !this.configuracion;
    if(this.configuracion){
      this.btnconfigcolor = "gray"
    }else{
      this.btnconfigcolor = ""
    }

  }

  //Actualiza la BD en Odoo
  upDateCant(event:Event){
    const input = (event.target as HTMLInputElement).value;
    const row = (event.target as HTMLInputElement).closest("tr")
    const id = row?.children[0].textContent;
    const minimo = (row?.children[3].children[0] as HTMLInputElement).value;
    const maximo = (row?.children[4].children[0]as HTMLInputElement).value;
    const stock = (row?.children[5].children[0]as HTMLInputElement).value;
    const apartado = (row?.children[6].children[0]as HTMLInputElement).value;
    const disponible = (row?.children[7].children[0]as HTMLInputElement).value;
    console.log(id,minimo,maximo,stock,apartado,disponible);
    this.odooConect.authenticate().subscribe(uid=>{
      this.odooConect.update(uid,Number(id),'dtm.materiales',{"minimo":minimo,"maximo":maximo,"cantidad":stock,"apartado":apartado,"disponible":disponible}).subscribe(()=> this.cdr.detectChanges());
    });
  }

  fetchAll(){
    this.odooConect.authenticate().subscribe(uid=>{
      this.odooConect.read(uid,[['id','!=','0']],'dtm.materiales',['id','nombre','medida','cantidad','apartado','disponible','minimo','maximo'],0).subscribe(result =>{
        this.datosService.setOnlyMaterials(result);
        this.table = this.datosService.getOnlyMateriales();
      })
    })
  }

  checkMinMat(){

  }


  ngOnInit(): void {
   this.fetchAll();
   this.checkMinMat();
  }

}
