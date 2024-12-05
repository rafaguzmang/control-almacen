import { provideRouter, Routes } from '@angular/router';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { InventarioComponent } from './inventario/inventario.component';


export const routes: Routes = [
    { path: 'almacen', component: InventarioComponent },
];
