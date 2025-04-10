import { Routes } from '@angular/router';
import { InventarioComponent } from './inventario/inventario.component';
import { ConsumiblesComponent } from './consumibles/consumibles.component';
import { SolicitudmaterialComponent } from './solicitudmaterial/solicitudmaterial.component';
import { EntransitoComponent } from './entransito/entransito.component';
import { HerramientasComponent } from './herramientas/herramientas.component';
import { HomeComponent } from './home/home.component';
import { MaterialesComponent } from './materiales/materiales.component';


export const routes: Routes = [
    { path: '', component: HomeComponent},
    { path: 'consumibles', component: ConsumiblesComponent },
    { path: 'ordenes', component: SolicitudmaterialComponent },
    { path: 'transito', component: EntransitoComponent },
    { path: 'inventario', component: InventarioComponent },
    { path: 'herramientas', component: HerramientasComponent },
    { path: 'materiales', component: MaterialesComponent },
    
];
