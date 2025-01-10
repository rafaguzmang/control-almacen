import { Component, OnInit } from '@angular/core';
import { OdooJsonRpcService } from '../services/inventario.service';
import { DatosService } from '../services/datos.service';

@Component({
  selector: 'app-solicitudmaterial',
  standalone: true,
  imports: [],
  templateUrl: './solicitudmaterial.component.html',
  styleUrl: './solicitudmaterial.component.css'
})
export class SolicitudmaterialComponent implements OnInit{
  material:any [] = [];
  isInordVisible:boolean = true;
  limit = 10;

  // Variables para hacer los filtros
  private orden:string = "";
  private codigo:string = "";
  private nombre:string = "";
  private medida:string = "";
  
  constructor(private solMat:OdooJsonRpcService, private dataMat:DatosService){}
  
  // Botón para entregar el material a producción
  entregado(event: Event ):void {
    let element = event.target as HTMLInputElement;    
    if(element.nodeName === 'I'){
        // console.log(element.parentElement.parentElement?.nodeName);
        element = element.parentNode as HTMLInputElement;
    }
    let rowTable = element.parentNode?.parentNode?.parentElement as HTMLInputElement;
    console.log(rowTable);
    let orden = rowTable.children[0].textContent;
    let codigo = rowTable.children[1].textContent??'0';
    let cantidad = rowTable.children[5].textContent??'0';
    let entregado = rowTable.children[6].children[0].children[0] as HTMLInputElement;
    let recibe =  rowTable.children[6].children[0].children[1] as HTMLInputElement;
    console.log(orden,codigo,cantidad,entregado.value,recibe.value);    
    this.solMat.authenticate().subscribe((uid: number) => {
      if(uid == 2){
        this.solMat.read(uid,[['ot_number','=',orden]],'dtm.odt',['id'],this.limit).subscribe(ordenData =>{ 
          // console.log(ordenData[0].id);
          this.solMat.read(uid,[['model_id','=',ordenData[0].id],['materials_list','=',parseInt(codigo)]],'dtm.materials.line',['id','materials_availabe'],this.limit).subscribe(ordenId =>{
            // console.log(ordenId[0].id,ordenId[0].materials_availabe);          
            this.solMat.update(uid,ordenId[0].id,'dtm.materials.line',{'entregado':true,'recibe':recibe.value}).subscribe();
            this.solMat.read(uid,[['id','=',parseInt(codigo)]],'dtm.diseno.almacen',['apartado'],this.limit).subscribe(apartado =>{
              // console.log(apartado[0].apartado, ordenId[0].materials_availabe)
              let apartadoMaterial = apartado[0].apartado - ordenId[0].materials_availabe;
              if(apartadoMaterial < 0){apartadoMaterial = 0}
              let cantidadMaterial = parseInt(cantidad)-parseInt(entregado.value);
              if(cantidadMaterial < 0){cantidadMaterial = 0}
              // console.log(cantidadMaterial,apartadoMaterial)
              this.solMat.update(uid,parseInt(codigo),'dtm.diseno.almacen',{'cantidad':cantidadMaterial,'apartado':apartadoMaterial }).subscribe();              
            })
          })    
        });
        this.search([['id','!=',parseInt(codigo)]]);       
      }
    });  
  }
  // Restringe el valor a los limites de la cantidad solicitada
  entregadoCantidad(event: Event){
    let restar = event.target as HTMLInputElement;
    let cantidadElement = restar.parentElement?.parentElement?.parentElement?.children[4] as HTMLElement;
    // console.log(restar,cantidadElement);
    if(parseInt(restar.value) < 0){
      restar.value = '0';
    }
    if(Number(cantidadElement.textContent??0) < parseInt(restar.value)  ){
      restar.value = cantidadElement.textContent??'0';
    }
    // console.log(cantidadElement.textContent);
  }

  onOrdenInput(event: Event) {
    const input = event?.target as HTMLInputElement;    
    console.log(input.value);
    let domain = [['ot_number','=',input.value]];
    if(input.value===""){
      domain = [['id','!=','0']];
    }
    this.search(domain);
  }
  
  onCodigoInput(event: Event) {
    const input = event?.target as HTMLInputElement; 
    this.material = this.dataMat.getMaterial();   
    let material:any[] = [];
    for(const item of this.material){
      if( String(item.codigo).match(input.value)){
        // console.log(input.value , String(item.codigo));
        // console.log(item);
        material.push({'numero':item.numero,'orden':item.orden,'codigo':item.codigo,'nombre':item.nombre,
          'medida':item.medida,'cantidad':item.cantidad})
        // material.push({'codigo':item.codigo})
      }
    }
    // console.log(material);  
    this.material = material;
    if(input.value===""){
      this.material = this.dataMat.getMaterial();
    }
  }

  onNombreInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // console.log(`Valor ingresado: ${input.value}`);
    this.nombre = input.value;
    // this.solMat([['nombre','like',this.nombre],['medida','like',this.medida],['localizacion','like',this.localizacion]]);
    // if (this.nombre == "" && this.medida=="" && this.localizacion == "" ){
    //   this.emptyFields();
    // }
  }

  onMedidaInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    // console.log(`Valor ingresado: ${input.value}`);
    this.medida = input.value;
    // this.seach([['nombre','like',this.nombre],['medida','like',this.medida],['localizacion','like',this.localizacion]]);
    // if (this.nombre == "" && this.medida=="" && this.localizacion == "" ){
    //   this.emptyFields();
    // }
  }

  search(dominio:any[]){
    let num = 0;
    let material:any = [];
    this.solMat.authenticate().subscribe(uid => 
      this.solMat.read(uid,dominio,'dtm.proceso',['ot_number','materials_ids'],this.limit).subscribe(data =>{
        for(const items of data){
          for(const item of items.materials_ids){
            this.solMat.read(uid,[['id','=',item]],'dtm.materials.line',
            ['materials_list','nombre','medida', 'materials_cuantity',
            'materials_inventory', 'materials_required','entregado','recibe'],this.limit).subscribe(info => {
              // console.log(info[0].recibe);
              material.push({'numero':num++,'orden':items.ot_number,'codigo':info[0].materials_list[0],'nombre':info[0].nombre,
                                  'medida':info[0].medida,'stock':info[0].materials_inventory,'cantidad':info[0].materials_cuantity,'entregado':info[0].entregado,
                                'recibe':info[0].recibe===false?'':info[0].recibe})
            })
          }           
        } 
        this.dataMat.setMaterial(material);
        this.material = this.dataMat.getMaterial();       
      })
    );   
  }

  fetchSolMat(){
    let num = 0;
    let material:any = [];
    this.solMat.authenticate().subscribe(uid => 
      this.solMat.read(uid,[['id','!=',0]],'dtm.proceso',['ot_number','materials_ids'],this.limit).subscribe(data =>{
        // console.log(data);
        for(const items of data){
          for(const item of items.materials_ids){
            // console.log(item);
            this.solMat.read(uid,[['id','=',item]],'dtm.materials.line',
            ['materials_list','nombre','medida', 'materials_cuantity',
            'materials_inventory', 'materials_required','entregado'],this.limit).subscribe(info => {
              // console.log(items.ot_number,info[0].materials_list[0],info[0].nombre,info[0].medida,info[0].materials_cuantity)
              material.push({'numero':num++,'orden':items.ot_number,'codigo':info[0].materials_list[0],'nombre':info[0].nombre,
                                  'medida':info[0].medida,'stock':info[0].materials_inventory,'cantidad':info[0].materials_cuantity,'entregado':info[0].entregado,
                                'recibe':info[0].recibe === false ? '' : info[0].recibe})
            })
          }          
        }   
        this.dataMat.setMaterial(material);
        this.material = this.dataMat.getMaterial();
             
      })
    );
  }

  ngOnInit(): void {
    this.dataMat.isInordVisible$.subscribe(visible =>{
      this.isInordVisible = visible;
      this.fetchSolMat();
    })   
  }
}
