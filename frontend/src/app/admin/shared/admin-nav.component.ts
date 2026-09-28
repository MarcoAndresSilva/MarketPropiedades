import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { LogoComponent } from '../../layout/logo/logo.component';

// Barra superior del panel: secciones, usuario y cerrar sesión. El panel no usa el
// header del sitio público (ver App), así que esta es su única navegación.
@Component({
  selector: 'app-admin-nav',
  imports: [RouterLink, RouterLinkActive, LogoComponent],
  templateUrl: './admin-nav.component.html',
  styleUrl: './admin-nav.component.scss',
})
export class AdminNavComponent {
  protected readonly auth = inject(AuthService);

  constructor() {
    this.auth.loadCurrentUser().subscribe();
  }
}
