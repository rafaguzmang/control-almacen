import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { InventarioComponent } from "./inventario/inventario.component";
import { NavInventarioComponent } from "./nav-inventario/nav-inventario.component";
import { SolicitudmaterialComponent } from "./solicitudmaterial/solicitudmaterial.component";
import { EntransitoComponent } from "./entransito/entransito.component";
import { HomeComponent } from "./home/home.component";
import { ConsumiblesComponent } from "./consumibles/consumibles.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [InventarioComponent, NavInventarioComponent, SolicitudmaterialComponent, EntransitoComponent, HomeComponent, ConsumiblesComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'control-almacen';

  constructor(){}
}
