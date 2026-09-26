import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PropertiesService } from '../../core/properties.service';
import { Comuna } from '../../core/property.model';
import { IconComponent } from '../../core/icon.component';

type Pestana = 'comprar' | 'arrendar' | 'proyecto';

interface RangoPrecio {
  label: string;
  min?: number;
  max?: number;
}

// Tramos de precio según la convención chilena del resto del sitio: venta en UF,
// arriendo en CLP. Cambian con la pestaña activa.
const RANGOS: Record<'comprar' | 'arrendar', RangoPrecio[]> = {
  comprar: [
    { label: 'Hasta UF 2.000', max: 2000 },
    { label: 'UF 2.000 – 4.000', min: 2000, max: 4000 },
    { label: 'UF 4.000 – 6.000', min: 4000, max: 6000 },
    { label: 'UF 6.000 – 10.000', min: 6000, max: 10000 },
    { label: 'Más de UF 10.000', min: 10000 },
  ],
  arrendar: [
    { label: 'Hasta $400.000', max: 400000 },
    { label: '$400.000 – $600.000', min: 400000, max: 600000 },
    { label: '$600.000 – $900.000', min: 600000, max: 900000 },
    { label: '$900.000 – $1.500.000', min: 900000, max: 1500000 },
    { label: 'Más de $1.500.000', min: 1500000 },
  ],
};

const TIPOS = [
  { value: 'CASA', label: 'Casa' },
  { value: 'DEPARTAMENTO', label: 'Departamento' },
  { value: 'PARCELA', label: 'Parcela' },
  { value: 'TERRENO', label: 'Terreno' },
  { value: 'OFICINA', label: 'Oficina' },
  { value: 'LOCAL_COMERCIAL', label: 'Local comercial' },
  { value: 'BODEGA', label: 'Bodega' },
];

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
  protected readonly tipos = TIPOS;

  protected readonly pestana = signal<Pestana>('comprar');
  protected readonly comunas = signal<Pick<Comuna, 'id' | 'nombre'>[]>([]);
  protected readonly rangos = computed(() => (this.pestana() === 'arrendar' ? RANGOS.arrendar : RANGOS.comprar));

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
