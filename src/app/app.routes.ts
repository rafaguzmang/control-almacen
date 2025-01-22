import { provideRouter, Routes } from '@angular/router';
import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { InventarioComponent } from './inventario/inventario.component';
import { ConsumiblesComponent } from './consumibles/consumibles.component';
import { SolicitudmaterialComponent } from './solicitudmaterial/solicitudmaterial.component';
import { EntransitoComponent } from './entransito/entransito.component';
import { HerramientasComponent } from './herramientas/herramientas.component';


export const routes: Routes = [
    { path: '', component: ConsumiblesComponent },
    { path: 'ordenes', component: SolicitudmaterialComponent },
    { path: 'transito', component: EntransitoComponent },
    { path: 'inventario', component: InventarioComponent },
    { path: 'herramientas', component: HerramientasComponent },
    
];
