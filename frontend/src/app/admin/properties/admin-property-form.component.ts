import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AdminPropertiesService, CreatePropertyPayload } from '../shared/admin-properties.service';
import { LocationsService } from '../shared/locations.service';
import { Publisher, PublishersService } from '../shared/publishers.service';
import { Comuna, PropertyFoto, TipoOperacion, TipoPropiedad } from '../../core/property.model';
import { cloudinaryImageUrl } from '../../core/cloudinary.util';

// Campos numéricos/opcionales del formulario, sueltos como strings/number|null porque
// vienen de <input> — se convierten a la forma que espera el backend recién al armar
// el payload en guardar().
interface FormModel {
  publicadorId: string;
  comunaId: string;
  tipoOperacion: TipoOperacion | '';
  tipoPropiedad: TipoPropiedad | '';
  estado: 'BORRADOR' | 'PUBLICADA' | 'PAUSADA' | 'CERRADA';
  destacada: boolean;
  direccion: string;
  precioUf: number | null;
  precioClp: number | null;
  m2Construidos: number | null;
  m2Terreno: number | null;
  dormitorios: number | null;
  banos: number | null;
  estacionamientos: number | null;
  bodegas: number | null;
  gastosComunesClp: number | null;
  titulo: string;
  descripcion: string;
}

const MODELO_VACIO: FormModel = {
  publicadorId: '',
  comunaId: '',
  tipoOperacion: '',
  tipoPropiedad: '',
  estado: 'BORRADOR',
  destacada: false,
  direccion: '',
  precioUf: null,
  precioClp: null,
  m2Construidos: null,
  m2Terreno: null,
  dormitorios: null,
  banos: null,
  estacionamientos: null,
  bodegas: null,
  gastosComunesClp: null,
  titulo: '',
  descripcion: '',
};

@Component({
  selector: 'app-admin-property-form',
  imports: [FormsModule, RouterLink],
  templateUrl: './admin-property-form.component.html',
  styleUrl: './admin-property-form.component.scss',
})
export class AdminPropertyFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly adminProperties = inject(AdminPropertiesService);
  private readonly locations = inject(LocationsService);
  private readonly publishersService = inject(PublishersService);
  // HttpClient plano (no pasa por el interceptor de auth: la URL de Cloudinary nunca
  // empieza con environment.apiUrl, así que el Bearer token no se le agrega igual).
  private readonly http = inject(HttpClient);

  readonly cloudinaryImageUrl = cloudinaryImageUrl;

  readonly propertyId = signal<string | null>(null);
  readonly comunas = signal<Comuna[]>([]);
  readonly publishers = signal<Publisher[]>([]);
  readonly fotos = signal<PropertyFoto[]>([]);
  readonly videoUrl = signal<string | null>(null);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly uploadingFoto = signal(false);
  readonly uploadingVideo = signal(false);
  readonly error = signal<string | null>(null);

  model: FormModel = { ...MODELO_VACIO };

  get esEdicion(): boolean {
    return this.propertyId() !== null;
  }

  ngOnInit(): void {
    this.locations.findAll().subscribe({ next: (cs) => this.comunas.set(cs) });
    this.publishersService.findAll().subscribe({ next: (ps) => this.publishers.set(ps) });

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.propertyId.set(id);
    this.loading.set(true);
    this.adminProperties.findOne(id).subscribe({
      next: (p) => {
        this.model = {
          publicadorId: p.publicador.id,
          comunaId: p.comunaId,
          tipoOperacion: p.tipoOperacion,
          tipoPropiedad: p.tipoPropiedad,
          estado: p.estado,
          destacada: p.destacada,
          direccion: p.direccion ?? '',
          precioUf: p.precioUf !== null ? Number(p.precioUf) : null,
          precioClp: p.precioClp,
          m2Construidos: p.m2Construidos,
          m2Terreno: p.m2Terreno,
          dormitorios: p.dormitorios,
          banos: p.banos,
          estacionamientos: p.estacionamientos,
          bodegas: p.bodegas,
          gastosComunesClp: p.gastosComunesClp,
          titulo: p.titulo,
          descripcion: p.descripcion,
        };
        this.fotos.set(p.fotos);
        this.videoUrl.set(p.videoUrl);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No se pudo cargar la propiedad.');
      },
    });
  }

  guardar(): void {
    this.saving.set(true);
    this.error.set(null);

    const payload: CreatePropertyPayload = {
      publicadorId: this.model.publicadorId,
      comunaId: this.model.comunaId,
      tipoOperacion: this.model.tipoOperacion as TipoOperacion,
      tipoPropiedad: this.model.tipoPropiedad as TipoPropiedad,
      estado: this.model.estado,
      destacada: this.model.destacada,
      direccion: this.model.direccion || null,
      lat: null,
      lng: null,
      precioUf: this.model.precioUf,
      precioClp: this.model.precioClp,
      m2Construidos: this.model.m2Construidos,
      m2Terreno: this.model.m2Terreno,
      dormitorios: this.model.dormitorios,
      banos: this.model.banos,
      estacionamientos: this.model.estacionamientos,
      bodegas: this.model.bodegas,
      gastosComunesClp: this.model.gastosComunesClp,
      titulo: this.model.titulo.trim(),
      descripcion: this.model.descripcion,
      videoUrl: this.videoUrl(),
    };

    const id = this.propertyId();
    const request = id ? this.adminProperties.update(id, payload) : this.adminProperties.create(payload);

    request.subscribe({
      next: (property) => {
        this.saving.set(false);
        if (!id) {
          // Recién creada: recién ahora tiene id para poder subirle fotos/video.
          this.router.navigate(['/admin/propiedades', property.id, 'editar']);
        }
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(this.mensajeDeError(err));
      },
    });
  }

  onFotosSeleccionadas(event: Event): void {
    const propertyId = this.propertyId();
    const input = event.target as HTMLInputElement;
    if (!propertyId || !input.files?.length) return;

    this.uploadingFoto.set(true);
    this.subirFotosEnCola(Array.from(input.files), propertyId);
    input.value = '';
  }

  private subirFotosEnCola(files: File[], propertyId: string): void {
    const [file, ...resto] = files;
    if (!file) {
      this.uploadingFoto.set(false);
      return;
    }

    this.adminProperties.getUploadSignature().subscribe({
      next: (sig) => {
        const form = new FormData();
        form.append('file', file);
        form.append('api_key', sig.apiKey);
        form.append('timestamp', String(sig.timestamp));
        form.append('signature', sig.signature);
        form.append('folder', sig.folder);

        this.http
          .post<{ public_id: string }>(`https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`, form)
          .subscribe({
            next: (res) => {
              const orden = this.fotos().length;
              this.adminProperties.addFoto(propertyId, res.public_id, orden).subscribe(() => {
                this.fotos.update((fs) => [
                  ...fs,
                  { id: `temp-${res.public_id}`, cloudinaryPublicId: res.public_id, orden },
                ]);
                this.subirFotosEnCola(resto, propertyId);
              });
            },
            error: () => {
              this.uploadingFoto.set(false);
              this.error.set('No se pudo subir una de las fotos a Cloudinary.');
            },
          });
      },
      error: () => {
        this.uploadingFoto.set(false);
        this.error.set('No se pudo pedir el permiso de subida al backend.');
      },
    });
  }

  eliminarFoto(fotoId: string): void {
    this.adminProperties.removeFoto(fotoId).subscribe(() => {
      this.fotos.update((fs) => fs.filter((f) => f.id !== fotoId));
    });
  }

  onVideoSeleccionado(event: Event): void {
    const propertyId = this.propertyId();
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!propertyId || !file) return;

    this.uploadingVideo.set(true);
    this.adminProperties.getUploadSignature().subscribe({
      next: (sig) => {
        const form = new FormData();
        form.append('file', file);
        form.append('api_key', sig.apiKey);
        form.append('timestamp', String(sig.timestamp));
        form.append('signature', sig.signature);
        form.append('folder', sig.folder);

        this.http
          .post<{ secure_url: string }>(`https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`, form)
          .subscribe({
            next: (res) => {
              this.adminProperties.update(propertyId, { videoUrl: res.secure_url }).subscribe(() => {
                this.videoUrl.set(res.secure_url);
                this.uploadingVideo.set(false);
              });
            },
            error: () => {
              this.uploadingVideo.set(false);
              this.error.set('No se pudo subir el video a Cloudinary.');
            },
          });
      },
      error: () => {
        this.uploadingVideo.set(false);
        this.error.set('No se pudo pedir el permiso de subida al backend.');
      },
    });
    input.value = '';
  }

  // Antes esto siempre mostraba la misma frase genérica sin importar qué falló de
  // verdad (un campo vacío, un id inválido, la red caída) - class-validator (backend)
  // devuelve el detalle exacto en error.error.message, uno por campo.
  private mensajeDeError(err: HttpErrorResponse): string {
    const detalle = err.error?.message;
    if (Array.isArray(detalle) && detalle.length > 0) {
      return `No se pudo guardar: ${detalle.join(' · ')}`;
    }
    if (typeof detalle === 'string') {
      return `No se pudo guardar: ${detalle}`;
    }
    if (err.status === 0) {
      return 'No se pudo guardar: no hay conexión con el servidor.';
    }
    return `No se pudo guardar (error ${err.status}). Intenta de nuevo.`;
  }
}
