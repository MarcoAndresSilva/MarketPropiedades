import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Observable, switchMap } from 'rxjs';
import { AdminPropertiesService } from '../../admin/shared/admin-properties.service';
import { Publisher, PublishersService } from '../../admin/shared/publishers.service';
import { AdminNavComponent } from '../../admin/shared/admin-nav.component';
import {
  MisPropiedadesService,
  PropiedadAnunciantePayload,
} from '../../features/cuenta/mis-propiedades/mis-propiedades.service';
import { LocationsService } from '../../core/locations.service';
import { CloudinaryUploadService } from '../../core/cloudinary-upload.service';
import { Comuna, EstadoPublicacion, Property, PropertyFoto, TipoOperacion, TipoPropiedad } from '../../core/property.model';
import { cloudinaryImageUrl } from '../../core/cloudinary.util';
import { ETIQUETA_ROL } from '../../core/format.util';
import { ESTADO_PUBLICACION } from '../../core/estado-publicacion';
import { mensajeDeErrorHttp } from '../../core/http-error.util';

/** Quién usa el formulario: viene de `data.panel` en app.routes.ts. */
type Panel = 'admin' | 'anunciante';

// Campos numéricos/opcionales del formulario, sueltos como strings/number|null porque
// vienen de <input> — se convierten a la forma que espera el backend recién al armar
// el payload en guardar().
interface FormModel {
  publicadorId: string;
  comunaId: string;
  tipoOperacion: TipoOperacion | '';
  tipoPropiedad: TipoPropiedad | '';
  estado: EstadoPublicacion;
  destacada: boolean;
  direccion: string;
  /** Solo ventas: en qué moneda publicó el anunciante. Arriendo va siempre en pesos. */
  monedaVenta: 'UF' | 'CLP';
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
  monedaVenta: 'UF',
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

// Un solo formulario de propiedad para el panel del admin y el del anunciante: los datos,
// el precio y las fotos son los mismos. Cambian la API (/properties o /mis-propiedades)
// y lo que se muestra: el admin elige publicador, estado y destacada; el anunciante ve
// el estado de moderación y envía a revisión.
@Component({
  selector: 'app-propiedad-form',
  imports: [FormsModule, RouterLink, AdminNavComponent],
  templateUrl: './propiedad-form.component.html',
  styleUrl: './propiedad-form.component.scss',
})
export class PropiedadFormComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly adminProperties = inject(AdminPropertiesService);
  private readonly misPropiedades = inject(MisPropiedadesService);
  private readonly locations = inject(LocationsService);
  private readonly publishersService = inject(PublishersService);
  private readonly cloudinary = inject(CloudinaryUploadService);

  readonly cloudinaryImageUrl = cloudinaryImageUrl;
  readonly etiquetaRol = ETIQUETA_ROL;
  readonly estadoPublicacion = ESTADO_PUBLICACION;

  readonly panel: Panel = this.route.snapshot.data['panel'] ?? 'admin';
  readonly esAdmin = this.panel === 'admin';
  readonly rutaListado = this.esAdmin ? '/admin/propiedades' : '/mi-cuenta';
  private readonly rutaPropiedades = this.esAdmin ? '/admin/propiedades' : '/mi-cuenta/propiedades';

  readonly propertyId = signal<string | null>(null);
  readonly comunas = signal<Comuna[]>([]);
  readonly publishers = signal<Publisher[]>([]);
  readonly fotos = signal<PropertyFoto[]>([]);
  readonly videoUrl = signal<string | null>(null);
  /** Estado guardado en el backend (el del select del admin puede no estar guardado aún). */
  readonly estadoActual = signal<EstadoPublicacion>('BORRADOR');
  readonly motivoRechazo = signal<string | null>(null);

  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly uploadingFoto = signal(false);
  readonly uploadingVideo = signal(false);
  readonly error = signal<string | null>(null);
  readonly guardado = signal(false);

  model: FormModel = { ...MODELO_VACIO };

  get esEdicion(): boolean {
    return this.propertyId() !== null;
  }

  /** Borrador o rechazada: lo que el anunciante puede mandar a revisión desde acá. */
  get puedeEnviarARevision(): boolean {
    return !this.esAdmin && this.esEdicion && ['BORRADOR', 'RECHAZADA'].includes(this.estadoActual());
  }

  /** Publicada o pausada: guardar cambios la saca del catálogo hasta aprobarla (Fase 35). */
  get editarVuelveARevision(): boolean {
    return !this.esAdmin && ['PUBLICADA', 'PAUSADA'].includes(this.estadoActual());
  }

  ngOnInit(): void {
    this.locations.findAll().subscribe({ next: (cs) => this.comunas.set(cs) });
    if (this.esAdmin) {
      this.publishersService.findAll().subscribe({ next: (ps) => this.publishers.set(ps) });
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) return;

    this.propertyId.set(id);
    this.loading.set(true);
    const request: Observable<Omit<Property, 'publicador'> & { publicador?: Property['publicador'] }> = this.esAdmin
      ? this.adminProperties.findOne(id)
      : this.misPropiedades.findOne(id);

    request.subscribe({
      next: (p) => {
        this.model = {
          publicadorId: p.publicador?.id ?? '',
          comunaId: p.comunaId,
          tipoOperacion: p.tipoOperacion,
          tipoPropiedad: p.tipoPropiedad,
          estado: p.estado,
          destacada: p.destacada,
          direccion: p.direccion ?? '',
          monedaVenta: p.tipoOperacion === 'VENTA' && p.precioUf === null && p.precioClp !== null ? 'CLP' : 'UF',
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
        this.actualizarEstado(p);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No se pudo cargar la propiedad.');
      },
    });
  }

  guardar(): void {
    this.ejecutar(this.requestGuardar(), (property) => {
      if (!this.propertyId()) {
        // Recién creada: recién ahora tiene id para poder subirle fotos/video.
        this.router.navigate([this.rutaPropiedades, property.id, 'editar']);
      } else {
        this.guardado.set(true);
      }
    });
  }

  /** Guarda lo que haya en el formulario y recién después pide la revisión, para no perder cambios. */
  enviarARevision(): void {
    const id = this.propertyId()!;
    this.ejecutar(
      this.requestGuardar().pipe(switchMap(() => this.misPropiedades.cambiarEstado(id, 'EN_REVISION'))),
      () => this.router.navigateByUrl(this.rutaListado),
    );
  }

  onFotosSeleccionadas(event: Event): void {
    const propertyId = this.propertyId();
    const input = event.target as HTMLInputElement;
    if (!propertyId || !input.files?.length) return;

    this.uploadingFoto.set(true);
    this.cloudinary
      .subirEnOrden(Array.from(input.files), (publicId) =>
        this.esAdmin
          ? this.adminProperties.addFoto(propertyId, publicId, this.fotos().length)
          : this.misPropiedades.addFoto(propertyId, publicId, this.fotos().length),
      )
      .subscribe({
        next: (publicId) =>
          this.fotos.update((fs) => [...fs, { id: `temp-${publicId}`, cloudinaryPublicId: publicId, orden: fs.length }]),
        error: (err: HttpErrorResponse) => {
          this.uploadingFoto.set(false);
          this.error.set(
            err.status === 403
              ? 'Confirma tu correo para poder subir fotos.'
              : 'No se pudo subir una de las fotos. Las anteriores quedaron guardadas.',
          );
        },
        complete: () => {
          this.uploadingFoto.set(false);
          // Una foto nueva en una propiedad aprobada la devuelve a revisión (backend).
          if (this.editarVuelveARevision) this.estadoActual.set('EN_REVISION');
        },
      });
    input.value = '';
  }

  eliminarFoto(fotoId: string): void {
    const request = this.esAdmin ? this.adminProperties.removeFoto(fotoId) : this.misPropiedades.removeFoto(fotoId);
    request.subscribe(() => {
      this.fotos.update((fs) => fs.filter((f) => f.id !== fotoId));
    });
  }

  onVideoSeleccionado(event: Event): void {
    const propertyId = this.propertyId();
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!propertyId || !file) return;

    this.uploadingVideo.set(true);
    this.cloudinary.subir(file).subscribe({
      next: (res) => {
        const payload = { videoUrl: res.secure_url };
        const update: Observable<Pick<Property, 'estado' | 'motivoRechazo'>> = this.esAdmin
          ? this.adminProperties.update(propertyId, payload)
          : this.misPropiedades.update(propertyId, payload);
        update.subscribe((p) => {
          this.videoUrl.set(res.secure_url);
          this.actualizarEstado(p);
          this.uploadingVideo.set(false);
        });
      },
      error: () => {
        this.uploadingVideo.set(false);
        this.error.set('No se pudo subir el video a Cloudinary.');
      },
    });
    input.value = '';
  }

  private requestGuardar(): Observable<Pick<Property, 'id' | 'estado' | 'motivoRechazo'>> {
    const base: PropiedadAnunciantePayload = {
      comunaId: this.model.comunaId,
      tipoOperacion: this.model.tipoOperacion as TipoOperacion,
      tipoPropiedad: this.model.tipoPropiedad as TipoPropiedad,
      direccion: this.model.direccion || null,
      lat: null,
      lng: null,
      // Se guarda solo el precio de la moneda elegida, para que no quede un valor viejo en
      // la otra (el backend calcula la referencia en UF a partir del que venga).
      precioUf: this.model.tipoOperacion === 'VENTA' && this.model.monedaVenta === 'UF' ? this.model.precioUf : null,
      precioClp:
        this.model.tipoOperacion === 'ARRIENDO' || this.model.monedaVenta === 'CLP' ? this.model.precioClp : null,
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

    if (this.esAdmin) {
      const payload = {
        ...base,
        publicadorId: this.model.publicadorId,
        estado: this.model.estado,
        destacada: this.model.destacada,
      };
      return id ? this.adminProperties.update(id, payload) : this.adminProperties.create(payload);
    }
    return id ? this.misPropiedades.update(id, base) : this.misPropiedades.create(base);
  }

  private ejecutar<T extends Pick<Property, 'id' | 'estado' | 'motivoRechazo'>>(
    request: Observable<T>,
    alTerminar: (property: T) => void,
  ): void {
    this.saving.set(true);
    this.error.set(null);
    this.guardado.set(false);

    request.subscribe({
      next: (property) => {
        this.saving.set(false);
        this.actualizarEstado(property);
        alTerminar(property);
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(mensajeDeErrorHttp(err));
      },
    });
  }

  private actualizarEstado(p: Pick<Property, 'estado' | 'motivoRechazo'>): void {
    this.estadoActual.set(p.estado);
    this.motivoRechazo.set(p.motivoRechazo);
  }
}
