import { Component, OnInit } from '@angular/core';
import { EntransitoComponent } from "../entransito/entransito.component";
import { SolicitudmaterialComponent } from "../solicitudmaterial/solicitudmaterial.component";
import { InventarioComponent } from "../inventario/inventario.component";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [EntransitoComponent, SolicitudmaterialComponent, InventarioComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  

}
