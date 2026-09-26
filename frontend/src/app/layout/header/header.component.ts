import { Component, afterNextRender, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from '../../core/theme.service';
import { IconComponent } from '../../core/icon.component';
import { FavoritesService } from '../../core/favorites.service';
import { LogoComponent } from '../logo/logo.component';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, LogoComponent, IconComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  protected readonly themeService = inject(ThemeService);
  protected readonly favorites = inject(FavoritesService);

  // Menú del render de marca; "Blog" se reemplazó por "Cómo publicar" (no hay artículos).
  protected readonly navLinks = [
    { path: '/comprar', label: 'Comprar' },
    { path: '/arrendar', label: 'Arrendar' },
    { path: '/proyectos', label: 'Proyectos' },
    { path: '/servicios', label: 'Servicios' },
    { path: '/publicar', label: 'Cómo publicar' },
  ];

  protected readonly menuAbierto = signal(false);

  // El contador de favoritos sale de localStorage, que no existe en el servidor: se
  // muestra recién después del primer render en el navegador para que el HTML de SSR y
  // el de la hidratación coincidan.
  protected readonly enNavegador = signal(false);

  constructor() {
    afterNextRender(() => this.enNavegador.set(true));
  }

  protected cerrarMenu(): void {
    this.menuAbierto.set(false);
  }
}
