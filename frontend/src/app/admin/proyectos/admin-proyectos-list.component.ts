import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminNavComponent } from '../shared/admin-nav.component';
import { AdminProyectosService } from '../shared/admin-proyectos.service';
import { ETAPA_LABEL, Proyecto } from '../../core/proyecto.model';

@Component({
  selector: 'app-admin-proyectos-list',
  imports: [RouterLink, AdminNavComponent],
  templateUrl: './admin-proyectos-list.component.html',
  styleUrl: '../properties/admin-properties-list.component.scss',
})
export class AdminProyectosListComponent implements OnInit {
  private readonly proyectos = inject(AdminProyectosService);

  protected readonly etapa = ETAPA_LABEL;
  protected readonly items = signal<Proyecto[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);

  ngOnInit(): void {
    this.load();
  }

  protected precio(p: Proyecto): string {
    return Number(p.precioDesdeUf).toLocaleString('es-CL');
  }

  protected eliminar(p: Proyecto): void {
    if (!confirm(`¿Eliminar el proyecto "${p.nombre}"? Esta acción no se puede deshacer.`)) return;
    this.proyectos.remove(p.id).subscribe(() => this.load());
  }

  private load(): void {
    this.loading.set(true);
    this.proyectos.findAll().subscribe({
      next: (items) => {
        this.items.set(items);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      },
    });
  }
}
