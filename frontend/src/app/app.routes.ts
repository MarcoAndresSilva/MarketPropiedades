import { Routes } from '@angular/router';
import { CatalogComponent } from './features/catalog/catalog.component';
import { PropertyDetailComponent } from './features/property-detail/property-detail.component';
import { PublicarComponent } from './features/publicar/publicar.component';
import { AdminLoginComponent } from './admin/login/admin-login.component';
import { AdminPropertiesListComponent } from './admin/properties/admin-properties-list.component';
import { AdminPropertyFormComponent } from './admin/properties/admin-property-form.component';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', component: CatalogComponent },
  { path: 'propiedad/:slug', component: PropertyDetailComponent },
  { path: 'publicar', component: PublicarComponent },

  // Panel interno: sin SEO, sin SSR (ver app.routes.server.ts) — detrás de login.
  { path: 'admin/login', component: AdminLoginComponent },
  { path: 'admin/propiedades', component: AdminPropertiesListComponent, canActivate: [authGuard] },
  { path: 'admin/propiedades/nueva', component: AdminPropertyFormComponent, canActivate: [authGuard] },
  { path: 'admin/propiedades/:id/editar', component: AdminPropertyFormComponent, canActivate: [authGuard] },
];
