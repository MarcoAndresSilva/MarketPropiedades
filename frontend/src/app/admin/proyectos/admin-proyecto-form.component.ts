import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminNavComponent } from '../shared/admin-nav.component';
import { AdminProyectosService, ProyectoPayload } from '../shared/admin-proyectos.service';
import { CloudinaryUploadService } from '../shared/cloudinary-upload.service';
import { LocationsService } from '../shared/locations.service';
import { Publisher, PublishersService, ROL_PUBLICADOR } from '../shared/publishers.service';
import { Comuna } from '../../core/property.model';
import { ETAPA_LABEL, EtapaProyecto, ProyectoFoto } from '../../core/proyecto.model';
import { cloudinaryImageUrl } from '../../core/cloudinary.util';

interface FormModel {
  publicadorId: string;
  nombre: string;
  etapa: EtapaProyecto | '';
  entrega: string;
  estado: 'BORRADOR' | 'PUBLICADA' | 'PAUSADA' | 'CERRADA';
  destacado: boolean;
  comunaId: string;
  direccion: string;
  descripcion: string;
  precioDesdeUf: number | null;
  dormitoriosMin: number | null;
  dormitoriosMax: number | null;
  banosMin: number | null;
  banosMax: number | null;
  m2Min: number | null;
  m2Max: number | null;
  unidades: number | null;
}

const MODELO_VACIO: FormModel = {
  publicadorId: '',
  nombre: '',
  etapa: '',
  entrega: '',
  estado: 'BORRADOR',
  destacado: false,
  comunaId: '',
  direccion: '',
  descripcion: '',
  precioDesdeUf: null,
  dormitoriosMin: null,
  dormitoriosMax: null,
  banosMin: null,
  banosMax: null,
  m2Min: null,
  m2Max: null,
  unidades: null,
};

// Mismo flujo que el formulario de propiedades: crear primero, subir fotos después
// (no quedan archivos huérfanos en Cloudinary si nunca se guarda).
@Component({
  selector: 'app-admin-proyecto-form',
  imports: [FormsModule, RouterLink, AdminNavComponent],
  templateUrl: './admin-proyecto-form.component.html',
  styleUrl: '../properties/admin-property-form.component.scss',
})
export class AdminProyectoFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly proyectos = inject(AdminProyectosService);
  private readonly locations = inject(LocationsService);
  private readonly publishersService = inject(PublishersService);
  private readonly cloudinary = inject(CloudinaryUploadService);

  protected readonly cloudinaryImageUrl = cloudinaryImageUrl;
  protected readonly rolPublicador = ROL_PUBLICADOR;
  protected readonly etapas = (Object.keys(ETAPA_LABEL) as EtapaProyecto[]).map((value) => ({ value, label: ETAPA_LABEL[value] }));

  protected readonly proyectoId = signal<string | null>(null);
  protected readonly comunas = signal<Comuna[]>([]);
  private readonly publishers = signal<Publisher[]>([]);
  // Un propietario particular no desarrolla proyectos: el backend lo rechaza igual.
  protected readonly desarrolladores = computed(() => this.publishers().filter((p) => p.role !== 'PERSONA'));
  protected readonly fotos = signal<ProyectoFoto[]>([]);

  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly uploadingFoto = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly guardado = signal(false);

  protected model: FormModel = { ...MODELO_VACIO };

  get esEdicion(): boolean {
    return this.proyectoId() !== null;
  }

  ngOnInit(): void {
    this.locations.findAll().subscribe({ next: (cs) => this.comunas.set(cs) });
    this.publishersService.findAll().subscribe({ next: (ps) => this.publishers.set(ps) });

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;
    this.proyectoId.set(id);
    this.loading.set(true);
    this.proyectos.findOne(id).subscribe({
      next: (p) => {
        this.model = {
          publicadorId: p.publicador.id,
          nombre: p.nombre,
          etapa: p.etapa,
          entrega: p.entrega ?? '',
          estado: p.estado,
          destacado: p.destacado,
          comunaId: p.comunaId,
          direccion: p.direccion ?? '',
          descripcion: p.descripcion,
          precioDesdeUf: p.precioDesdeUf !== null ? Number(p.precioDesdeUf) : null,
          dormitoriosMin: p.dormitoriosMin,
          dormitoriosMax: p.dormitoriosMax,
          banosMin: p.banosMin,
          banosMax: p.banosMax,
          m2Min: p.m2Min,
          m2Max: p.m2Max,
          unidades: p.unidades,
        };
        this.fotos.set(p.fotos);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No se pudo cargar el proyecto.');
      },
    });
  }

  protected guardar(): void {
    this.saving.set(true);
    this.error.set(null);
    this.guardado.set(false);

    const payload: ProyectoPayload = {
      publicadorId: this.model.publicadorId,
      nombre: this.model.nombre.trim(),
      etapa: this.model.etapa as EtapaProyecto,
      entrega: this.model.entrega.trim() || null,
      estado: this.model.estado,
      destacado: this.model.destacado,
      comunaId: this.model.comunaId,
      direccion: this.model.direccion.trim() || null,
      lat: null,
      lng: null,
      descripcion: this.model.descripcion,
      precioDesdeUf: this.model.precioDesdeUf,
      dormitoriosMin: this.model.dormitoriosMin,
      dormitoriosMax: this.model.dormitoriosMax,
      banosMin: this.model.banosMin,
      banosMax: this.model.banosMax,
      m2Min: this.model.m2Min,
      m2Max: this.model.m2Max,
      unidades: this.model.unidades,
    };

    const id = this.proyectoId();
    (id ? this.proyectos.update(id, payload) : this.proyectos.create(payload)).subscribe({
      next: (p) => {
        this.saving.set(false);
        if (!id) {
          this.router.navigate(['/admin/proyectos', p.id, 'editar']);
        } else {
          this.guardado.set(true);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        const detalle = err.error?.message;
        this.error.set(
          Array.isArray(detalle)
            ? `No se pudo guardar: ${detalle.join(' · ')}`
            : err.status === 0
              ? 'No se pudo guardar: no hay conexión con el servidor.'
              : `No se pudo guardar (error ${err.status}). Intenta de nuevo.`,
        );
      },
    });
  }

  protected onFotosSeleccionadas(event: Event): void {
    const proyectoId = this.proyectoId();
    const input = event.target as HTMLInputElement;
    if (!proyectoId || !input.files?.length) return;
    this.uploadingFoto.set(true);
    this.subirEnCola(Array.from(input.files), proyectoId);
    input.value = '';
  }

  protected eliminarFoto(fotoId: string): void {
    this.proyectos.removeFoto(fotoId).subscribe(() => this.fotos.update((fs) => fs.filter((f) => f.id !== fotoId)));
  }

  // Una por una: cada foto necesita saber cuántas van antes para su `orden`.
  private subirEnCola(files: File[], proyectoId: string): void {
    const [file, ...resto] = files;
    if (!file) {
      this.uploadingFoto.set(false);
      return;
    }
    this.cloudinary.subir(file).subscribe({
      next: (res) => {
        const orden = this.fotos().length;
        this.proyectos.addFoto(proyectoId, res.public_id, orden).subscribe(() => {
          this.fotos.update((fs) => [...fs, { id: `temp-${res.public_id}`, cloudinaryPublicId: res.public_id, orden }]);
          this.subirEnCola(resto, proyectoId);
        });
      },
      error: () => {
        this.uploadingFoto.set(false);
        this.error.set('No se pudo subir una de las fotos a Cloudinary.');
      },
    });
  }
}
