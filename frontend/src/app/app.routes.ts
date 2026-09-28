import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { authGuard } from './core/auth.guard';

// Solo la home va en el bundle inicial: es la entrada del sitio y su LCP importa. Todo
// lo demás se carga al visitarlo (loadComponent). Sobre todo el panel de admin, que un
// visitante nunca usa y antes inflaba la primera descarga de todos.
const catalogo = () => import('./features/catalog/catalog.component').then((m) => m.CatalogComponent);
const proximamente = () =>
  import('./features/proximamente/proximamente.component').then((m) => m.ProximamenteComponent);
const adminPropertyForm = () =>
  import('./admin/properties/admin-property-form.component').then((m) => m.AdminPropertyFormComponent);
const adminProyectoForm = () =>
  import('./admin/proyectos/admin-proyecto-form.component').then((m) => m.AdminProyectoFormComponent);

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'propiedades', loadComponent: catalogo },
  { path: 'comprar', loadComponent: catalogo, data: { tipoOperacion: 'VENTA' } },
  { path: 'arrendar', loadComponent: catalogo, data: { tipoOperacion: 'ARRIENDO' } },
  {
    path: 'propiedad/:slug',
    loadComponent: () =>
      import('./features/property-detail/property-detail.component').then((m) => m.PropertyDetailComponent),
  },
  {
    path: 'proyectos',
    loadComponent: () => import('./features/proyectos/proyectos.component').then((m) => m.ProyectosComponent),
  },
  {
    path: 'proyecto/:slug',
    loadComponent: () =>
      import('./features/proyectos/proyecto-detail.component').then((m) => m.ProyectoDetailComponent),
  },
  {
    path: 'publicar',
    loadComponent: () => import('./features/publicar/publicar.component').then((m) => m.PublicarComponent),
  },
  {
    path: 'servicios',
    loadComponent: () => import('./features/servicios/servicios.component').then((m) => m.ServiciosComponent),
  },
  {
    path: 'favoritos',
    loadComponent: () => import('./features/favoritos/favoritos.component').then((m) => m.FavoritosComponent),
  },
  {
    path: 'ingresar',
    loadComponent: proximamente,
    data: {
      titulo: 'Cuentas para anunciantes',
      texto: 'Estamos preparando el registro para propietarios, corredoras e inmobiliarias. Mientras tanto, publica con nosotros por WhatsApp.',
    },
  },

  // Panel interno: sin SEO, sin SSR (ver app.routes.server.ts) — detrás de login.
  {
    path: 'admin/login',
    loadComponent: () => import('./admin/login/admin-login.component').then((m) => m.AdminLoginComponent),
  },
  {
    path: 'admin/propiedades',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./admin/properties/admin-properties-list.component').then((m) => m.AdminPropertiesListComponent),
  },
  { path: 'admin/propiedades/nueva', canActivate: [authGuard], loadComponent: adminPropertyForm },
  { path: 'admin/propiedades/:id/editar', canActivate: [authGuard], loadComponent: adminPropertyForm },
  {
    path: 'admin/proyectos',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./admin/proyectos/admin-proyectos-list.component').then((m) => m.AdminProyectosListComponent),
  },
  { path: 'admin/proyectos/nuevo', canActivate: [authGuard], loadComponent: adminProyectoForm },
  { path: 'admin/proyectos/:id/editar', canActivate: [authGuard], loadComponent: adminProyectoForm },
  {
    path: 'admin/consultas',
    canActivate: [authGuard],
    loadComponent: () => import('./admin/consultas/admin-consultas.component').then((m) => m.AdminConsultasComponent),
  },

  {
    path: '**',
    loadComponent: proximamente,
    data: {
      eyebrow: 'Error 404',
      titulo: 'No encontramos esta página',
      texto: 'Puede que el link esté mal escrito o que la propiedad ya no esté publicada.',
    },
  },
];
