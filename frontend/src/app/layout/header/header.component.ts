import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from '../../core/theme.service';
import { IconComponent } from '../../core/icon.component';
import { LogoComponent } from '../logo/logo.component';

@Component({
  selector: 'app-header',
  imports: [RouterLink, RouterLinkActive, LogoComponent, IconComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  protected readonly themeService = inject(ThemeService);

  // Menú del render de marca; "Blog" se reemplazó por "Cómo publicar" (no hay artículos).
  protected readonly navLinks = [
    { path: '/comprar', label: 'Comprar' },
    { path: '/arrendar', label: 'Arrendar' },
    { path: '/proyectos', label: 'Proyectos' },
    { path: '/servicios', label: 'Servicios' },
    { path: '/publicar', label: 'Cómo publicar' },
  ];

  protected readonly menuAbierto = signal(false);

  protected cerrarMenu(): void {
    this.menuAbierto.set(false);
  }
}
