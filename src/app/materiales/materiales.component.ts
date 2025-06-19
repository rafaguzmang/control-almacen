import { ChangeDetectorRef, Component, input, NgZone, OnInit } from '@angular/core';
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
  
  // Variables para criterios de busqueda
  private concepto:string = '';
  private material:string = '';
  private medidaCompleta:string ='';
  private calibre:string = '';
  private criterio:string = '';
  private medida:string = '';
  private noTimer:boolean = false;
  private codsearch:string = '';
  private nomsearch:string = '';
  private medidasearch:string = '';
  
  // Variables para la configuración de máximos y mínimos
  btnconfigcolor:string = "";
  configuracion:boolean = false;
  private timer:any;  
  
  constructor(
    private odooConect:OdooJsonRpcService,
    private datosService:DatosService,
    private cdr: ChangeDetectorRef,
    private ngzone:NgZone
  ){} 
  
  restartSearch() {
    document.querySelectorAll('#item').forEach(element => (element as HTMLSelectElement).selectedIndex = 0);
    this.concepto = '';
    this.material = '';
    this.medidaCompleta = '';
    this.calibre = '';
    this.criterio = '';
    this.medida = '';
    this.searchFiltroNombre();
  }
  

  //Busca los items por nombre
  searchFiltroNombre(){
    this.criterio = `${this.concepto} ${this.material}`;
    this.medida = `${this.medidaCompleta}${this.calibre}`;
    (document.getElementById('nombreSearch') as HTMLInputElement).value = this.criterio;
    (document.getElementById('materialSearch') as HTMLInputElement).value = this.medida;

    let search = this.datosService.getOnlyMateriales().filter(row=>String(row.nombre).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(this.criterio.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")));
    search = search.filter(row=>String(row.medida).includes(this.medida));
    this.table = search.length > 0?search:[];
  }
  
  // Recibe el calibre a buscar
  searchMedidaCalibreInputFiltro(event:Event) {    
    const input = event.target as HTMLSelectElement;    
    this.calibre = (input.options[input.selectedIndex].textContent??'');
    this.searchFiltroNombre();
  }

  // Recibe la medida a buscar
  searchMedidaCompletaInputFiltro(event:Event) {    
    const input = event.target as HTMLSelectElement;    
    this.medidaCompleta = (input.options[input.selectedIndex].textContent??'');
    this.searchFiltroNombre();
  }
  // Recibe el tipo de material a buscar (Acero al carbón,Inoxidable..)
  searchMaterialInputFiltro(event:Event) {    
    const input = event.target as HTMLSelectElement;    
    this.material = (input.options[input.selectedIndex].textContent??'');
    this.searchFiltroNombre();
  }
  // Recibe el tipo de concepto a buscar (Lámina,Perfil..)
  searchConceptoInputFiltro(event:Event) {    
    const input = event.target as HTMLSelectElement;    
    this.concepto = (input.options[input.selectedIndex].textContent??'');
    this.searchFiltroNombre();
  }
   
  // busca por código
  codigoSearchInput(event:Event) {
    let input = (event.target as HTMLInputElement).value;
    this.codsearch = input;
    this.nomsearch = '';
    this.medidasearch = '';
    this.codigoSearch(this.codsearch);
  }
  // hace la búsqueda
  codigoSearch(input:any){
    let search = this.datosService.getOnlyMateriales().filter(row=>row.id == Number(input));
    this.table = search.length > 0?search:[];
  }
  
  // busca por nombre
  nombreSearchInput(event:Event) {
    let input = (event.target as HTMLInputElement).value;
    this.nomsearch = input;
    this.codsearch = '';
    this.nombreSearch(this.nombreSearch);   
  }
  // hace la búsqueda
  nombreSearch(input:any){
    const search = this.datosService.getOnlyMateriales().filter(row=>String(row.nombre).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(input.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")));
    this.table = search.length > 0?search:[];
  }
  // busca por medida
  materialSearchInput(event:Event) {
    let input = (event.target as HTMLInputElement).value;
    this.medidasearch = input;
    this.codsearch = '';
    this.materialSearch(this.medidasearch);
  }
  // hace la búsqueda
  materialSearch(input:any) {    
    const search = this.datosService.getOnlyMateriales().filter(row=>String(row.medida).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(input.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")));
    this.table = search.length > 0?search:[];
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

  entregaMaterial(event:Event){
     const input = (event.target as HTMLInputElement).value;
      const row = (event.target as HTMLInputElement).closest("tr")
      const id = row?.children[0].textContent;
      const minimo = (row?.children[3].children[0] as HTMLInputElement).value;
      const maximo = (row?.children[4].children[0]as HTMLInputElement).value;
      const stock = (row?.children[5].children[0]as HTMLInputElement).value;
      const apartado = (row?.children[6].children[0]as HTMLInputElement).value;
      const disponible = (row?.children[7].children[0]as HTMLInputElement).value;
      // console.log(id,minimo,maximo,stock,apartado,disponible);
      this.odooConect.authenticate().subscribe(uid=>{
        this.odooConect.update(uid,Number(id),'dtm.materiales',{"minimo":minimo,"maximo":maximo,"cantidad":stock,"apartado":apartado,"disponible":disponible}).subscribe(()=> this.cdr.detectChanges());
      });
  }

  //Actualiza la BD en Odoo
  upDateCant(event:Event){
     clearTimeout(this.timer);
    
    this.timer = setTimeout(() => {
      this.entregaMaterial(event);
    },800)
   
  }

  fetchAll(){
    this.odooConect.authenticate().subscribe(uid=>{
      this.odooConect.read(uid,[['id','!=','0']],'dtm.materiales',['id','nombre','medida','cantidad','apartado','disponible','minimo','maximo'],0).subscribe(result =>{
        this.datosService.setOnlyMaterials(result);
        this.table = this.datosService.getOnlyMateriales();
        console.log('código',this.codigoSearch);
        if(this.codsearch != ''){
          this.codigoSearch(this.codsearch)
        }

      })
    })
  }

  checkMinMat(){

  }

  ngOnInit(): void {
   this.fetchAll();

   
    this.ngzone.runOutsideAngular(()=>{
      setInterval(() => {
        this.ngzone.run(()=>{
          if(!this.noTimer){
            this.fetchAll();   

          }
        })
      }, 5000);
    }) 
   
   
   this.checkMinMat();
  }

}
