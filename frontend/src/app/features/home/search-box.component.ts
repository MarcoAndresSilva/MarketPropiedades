import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PropertiesService } from '../../core/properties.service';
import { Comuna } from '../../core/property.model';
import { IconComponent } from '../../core/icon.component';
import { RANGOS_PRECIO, RangoPrecio, TIPOS_PROPIEDAD } from '../../core/search-options';

type Pestana = 'comprar' | 'arrendar' | 'proyecto';

// Buscador del hero: pestañas Comprar / Arrendar / Proyecto + comuna, tipo y rango de
// precio. No busca por su cuenta: navega a la página de listado con los filtros como
// query params, así el resultado tiene URL propia (se puede compartir y volver atrás).
@Component({
  selector: 'app-search-box',
  imports: [FormsModule, IconComponent],
  templateUrl: './search-box.component.html',
  styleUrl: './search-box.component.scss',
})
export class SearchBoxComponent implements OnInit {
  private readonly properties = inject(PropertiesService);
  private readonly router = inject(Router);

  protected readonly pestanas: { id: Pestana; label: string }[] = [
    { id: 'comprar', label: 'Comprar' },
    { id: 'arrendar', label: 'Arrendar' },
    { id: 'proyecto', label: 'Proyecto' },
  ];
  protected readonly tipos = TIPOS_PROPIEDAD;

  protected readonly pestana = signal<Pestana>('comprar');
  protected readonly comunas = signal<Pick<Comuna, 'id' | 'nombre'>[]>([]);
  protected readonly rangos = computed(() => RANGOS_PRECIO[this.pestana() === 'arrendar' ? 'ARRIENDO' : 'VENTA']);

  protected comunaId = '';
  protected tipoPropiedad = '';
  protected rango = '';

  ngOnInit(): void {
    this.properties.findComunasConPropiedades().subscribe({
      next: (comunas) => this.comunas.set(comunas),
      error: () => this.comunas.set([]),
    });
  }

  protected elegir(pestana: Pestana): void {
    this.pestana.set(pestana);
    // Un tramo en UF no significa nada en arriendo (y al revés).
    this.rango = '';
  }

  protected buscar(): void {
    if (this.pestana() === 'proyecto') {
      this.router.navigate(['/proyectos'], { queryParams: { comuna: this.comunaId || null } });
      return;
    }
    const rango = this.rangos()[Number(this.rango)] as RangoPrecio | undefined;
    this.router.navigate([this.pestana() === 'comprar' ? '/comprar' : '/arrendar'], {
      queryParams: {
        comuna: this.comunaId || null,
        tipo: this.tipoPropiedad || null,
        precioMin: this.rango !== '' ? (rango?.min ?? null) : null,
        precioMax: this.rango !== '' ? (rango?.max ?? null) : null,
      },
    });
  }
}
