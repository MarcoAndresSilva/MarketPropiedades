import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminNavComponent } from '../shared/admin-nav.component';
import { AdminConsultasService, ConsultaAdmin } from '../shared/admin-consultas.service';
import { buildWhatsappUrl } from '../../core/whatsapp.util';

// Consultas que llegan desde el formulario de las fichas. Mientras no exista el aviso
// por correo ni el panel del anunciante, el equipo las revisa acá y se las pasa al
// anunciante. "Leída" es solo para el equipo: el visitante no ve nada de esto.
@Component({
  selector: 'app-admin-consultas',
  imports: [RouterLink, DatePipe, AdminNavComponent],
  templateUrl: './admin-consultas.component.html',
  styleUrls: ['../properties/admin-properties-list.component.scss', './admin-consultas.component.scss'],
})
export class AdminConsultasComponent implements OnInit {
  private readonly consultas = inject(AdminConsultasService);

  protected readonly items = signal<ConsultaAdmin[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal(false);
  protected readonly noLeidas = computed(() => this.items().filter((c) => !c.leida).length);

  ngOnInit(): void {
    this.consultas.findAll().subscribe({
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

  protected toggle(c: ConsultaAdmin): void {
    const leida = !c.leida;
    // Optimista: se marca al tiro y se revierte si el backend falla.
    this.items.update((items) => items.map((i) => (i.id === c.id ? { ...i, leida } : i)));
    this.consultas.marcarLeida(c.id, leida).subscribe({
      error: () => this.items.update((items) => items.map((i) => (i.id === c.id ? { ...i, leida: !leida } : i))),
    });
  }

  protected whatsapp(c: ConsultaAdmin): string {
    const numero = (c.telefono ?? '').replace(/\D/g, '');
    // Números chilenos escritos sin código de país (9 dígitos): se les antepone el 56.
    const e164 = numero.length === 9 ? `+56${numero}` : `+${numero}`;
    return buildWhatsappUrl(e164, `Hola ${c.nombre}, te escribimos por tu consulta sobre "${c.property.titulo}" en Habbi.`);
  }
}
