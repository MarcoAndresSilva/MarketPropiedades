import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { adminGuard, anuncianteGuard, anuncianteVerificadoGuard } from './core/auth.guard';

// Solo la home va en el bundle inicial: es la entrada del sitio y su LCP importa. Todo
// lo demás se carga al visitarlo (loadComponent). Sobre todo el panel de admin, que un
// visitante nunca usa y antes inflaba la primera descarga de todos.
const catalogo = () => import('./features/catalog/catalog.component').then((m) => m.CatalogComponent);
const proximamente = () =>
  import('./features/proximamente/proximamente.component').then((m) => m.ProximamenteComponent);
const propiedadForm = () =>
  import('./shared/propiedad-form/propiedad-form.component').then((m) => m.PropiedadFormComponent);
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

  // Cuentas de anunciante.
  {
    path: 'ingresar',
    loadComponent: () => import('./features/cuenta/ingresar/ingresar.component').then((m) => m.IngresarComponent),
  },
  {
    path: 'registro',
    loadComponent: () => import('./features/cuenta/registro/registro.component').then((m) => m.RegistroComponent),
  },
  // /cuenta/verificar y /cuenta/restablecer son los links de los correos (PlantillasCorreo en el backend).
  {
    path: 'cuenta/verificar',
    loadComponent: () => import('./features/cuenta/verificar/verificar.component').then((m) => m.VerificarComponent),
  },
  {
    path: 'cuenta/recuperar',
    loadComponent: () => import('./features/cuenta/recuperar/recuperar.component').then((m) => m.RecuperarComponent),
  },
  {
    path: 'cuenta/restablecer',
    loadComponent: () =>
      import('./features/cuenta/restablecer/restablecer.component').then((m) => m.RestablecerComponent),
  },
  {
    path: 'mi-cuenta',
    canActivate: [anuncianteGuard],
    loadComponent: () => import('./features/cuenta/mi-cuenta/mi-cuenta.component').then((m) => m.MiCuentaComponent),
  },
  {
    path: 'mi-cuenta/propiedades/nueva',
    canActivate: [anuncianteVerificadoGuard],
    loadComponent: propiedadForm,
    data: { panel: 'anunciante' },
  },
  {
    path: 'mi-cuenta/propiedades/:id/editar',
    canActivate: [anuncianteVerificadoGuard],
    loadComponent: propiedadForm,
    data: { panel: 'anunciante' },
  },

  // Panel interno: sin SEO, sin SSR (ver app.routes.server.ts) — detrás de login.
  {
    path: 'admin/login',
    loadComponent: () => import('./admin/login/admin-login.component').then((m) => m.AdminLoginComponent),
  },
  {
    path: 'admin/propiedades',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./admin/properties/admin-properties-list.component').then((m) => m.AdminPropertiesListComponent),
  },
  { path: 'admin/propiedades/nueva', canActivate: [adminGuard], loadComponent: propiedadForm },
  { path: 'admin/propiedades/:id/editar', canActivate: [adminGuard], loadComponent: propiedadForm },
  {
    path: 'admin/proyectos',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./admin/proyectos/admin-proyectos-list.component').then((m) => m.AdminProyectosListComponent),
  },
  { path: 'admin/proyectos/nuevo', canActivate: [adminGuard], loadComponent: adminProyectoForm },
  { path: 'admin/proyectos/:id/editar', canActivate: [adminGuard], loadComponent: adminProyectoForm },
  {
    path: 'admin/consultas',
    canActivate: [adminGuard],
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
