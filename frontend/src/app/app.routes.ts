import { Routes } from '@angular/router';
import { CatalogComponent } from './features/catalog/catalog.component';
import { HomeComponent } from './features/home/home.component';
import { PropertyDetailComponent } from './features/property-detail/property-detail.component';
import { PublicarComponent } from './features/publicar/publicar.component';
import { ProximamenteComponent } from './features/proximamente/proximamente.component';
import { AdminLoginComponent } from './admin/login/admin-login.component';
import { AdminPropertiesListComponent } from './admin/properties/admin-properties-list.component';
import { AdminPropertyFormComponent } from './admin/properties/admin-property-form.component';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'propiedades', component: CatalogComponent },
  { path: 'propiedad/:slug', component: PropertyDetailComponent },
  { path: 'comprar', component: CatalogComponent, data: { tipoOperacion: 'VENTA' } },
  { path: 'arrendar', component: CatalogComponent, data: { tipoOperacion: 'ARRIENDO' } },
  { path: 'publicar', component: PublicarComponent },
  {
    path: 'proyectos',
    component: ProximamenteComponent,
    data: {
      titulo: 'Proyectos inmobiliarios',
      texto: 'Muy pronto vas a encontrar aquí los proyectos que corredoras e inmobiliarias están desarrollando en Melipilla y alrededores.',
    },
  },
  {
    path: 'servicios',
    component: ProximamenteComponent,
    data: {
      titulo: 'Servicios de marketing inmobiliario',
      texto: 'Estamos preparando el detalle de nuestros planes y servicios de fotografía, video y campañas en Meta Ads.',
    },
  },
  {
    path: 'favoritos',
    component: ProximamenteComponent,
    data: {
      titulo: 'Tus favoritos',
      texto: 'Muy pronto vas a poder guardar las propiedades que te gustan con el corazón de cada ficha.',
    },
  },
  {
    path: 'ingresar',
    component: ProximamenteComponent,
    data: {
      titulo: 'Cuentas para anunciantes',
      texto: 'Estamos preparando el registro para propietarios, corredoras e inmobiliarias. Mientras tanto, publica con nosotros por WhatsApp.',
    },
  },

  // Panel interno: sin SEO, sin SSR (ver app.routes.server.ts) — detrás de login.
  { path: 'admin/login', component: AdminLoginComponent },
  { path: 'admin/propiedades', component: AdminPropertiesListComponent, canActivate: [authGuard] },
  { path: 'admin/propiedades/nueva', component: AdminPropertyFormComponent, canActivate: [authGuard] },
  { path: 'admin/propiedades/:id/editar', component: AdminPropertyFormComponent, canActivate: [authGuard] },

  {
    path: '**',
    component: ProximamenteComponent,
    data: {
      eyebrow: 'Error 404',
      titulo: 'No encontramos esta página',
      texto: 'Puede que el link esté mal escrito o que la propiedad ya no esté publicada.',
    },
  },
];
