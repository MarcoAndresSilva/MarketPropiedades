import { Routes } from '@angular/router';
import { CatalogComponent } from './features/catalog/catalog.component';
import { PropertyDetailComponent } from './features/property-detail/property-detail.component';

export const routes: Routes = [
  { path: '', component: CatalogComponent },
  { path: 'propiedad/:slug', component: PropertyDetailComponent },
];
