import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { InventarioComponent } from "./inventario/inventario.component";
import { NavInventarioComponent } from "./nav-inventario/nav-inventario.component";
import { SolicitudmaterialComponent } from "./solicitudmaterial/solicitudmaterial.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, InventarioComponent, NavInventarioComponent, SolicitudmaterialComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'control-almacen';

  constructor(){}
}
