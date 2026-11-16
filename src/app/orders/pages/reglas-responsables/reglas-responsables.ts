import { ResponsibleListComponent } from '../../../shared/responsible-list';
import { PortalFeedbackService } from '../../../shared/portal-feedback.service';
import { REPRESENTANTES_UI } from '../../../shared/representantes-ui';
import { PortalModalComponent } from '../../../shared/portal-modal';
import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { ReglaAdmin, ReglasConsulta, ReglasResponsablesService } from '../../../services/reglas-responsables.service';

@Component({selector: 'app-reglas-responsables', standalone: true, imports: [...REPRESENTANTES_UI, PortalModalComponent, ResponsibleListComponent],
  templateUrl: './reglas-responsables.html', styleUrl: './reglas-responsables.css'})
export class ReglasResponsablesComponent implements OnInit {
  private readonly feedback = inject(PortalFeedbackService);
  private readonly api = inject(ReglasResponsablesService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy = inject(DestroyRef);
  data: ReglasConsulta | null = null;
  busy = false; error = ''; mostrarFormulario = false; reglaActualId = 0;
  titularFiltro = 0; rentaFiltro = ''; accionFiltro = ''; busqueda = ''; incluirHistorial = false; pagina = 1; readonly tamanoPagina = 20;
  buscarResponsable = '';
  modoEditor: 'crear' | 'editar' = 'crear';
  private reglaEditada: ReglaAdmin | null = null;
  edicionDesactualizada = false;
  get esEdicion() { return this.modoEditor === 'editar'; }
  get contextoEdicion() { return this.reglaEditada; }
  get reglaExistente() { return this.data?.reglas.find(r => r.activo && r.titularRepresentanteId === this.form.titularId && r.tipoRenta === this.form.renta && r.accion === this.form.accion); }
  get mostrarConfiguracion() { return this.esEdicion || (this.form.titularId > 0 && !this.reglaExistente); }
  get puedeGuardar() { return !this.busy && !!this.data && !this.edicionDesactualizada && (this.esEdicion ? !!this.reglaEditada : this.form.titularId > 0 && !this.reglaExistente) && (this.form.modo !== 'LISTA' || this.form.opciones.length > 0); }
  limpiarFiltros() { this.titularFiltro = 0; this.rentaFiltro = ''; this.accionFiltro = ''; this.busqueda = ''; this.incluirHistorial = false; this.filtrar(); }

  form = {titularId: 0, renta: 'RF', accion: 'ENVIO_OPERACION', modo: 'TITULAR' as 'TITULAR' | 'LISTA', opciones: [] as number[], activo: true};
  ngOnInit() { this.reload(); }
  reload() {
    if (this.busy) return;
    this.busy = true; this.error = '';
    this.api.consultar().pipe(takeUntilDestroyed(this.destroy), finalize(() => {this.busy = false; this.cdr.markForCheck();}))
      .subscribe({next: data => {this.data = data; this.pagina = 1; if (this.mostrarFormulario) {
        if (this.esEdicion && this.reglaEditada) {
          const key = this.reglaEditada;
          const current = data.reglas.find(r => r.activo && r.titularRepresentanteId === key.titularRepresentanteId && r.tipoRenta === key.tipoRenta && r.accion === key.accion);
          if (current) this.editar(current);
          else { this.edicionDesactualizada = true; this.error = 'Esta regla ya no está vigente. Cierra la edición y revisa el listado.'; }
        } else this.seleccionarClave();
      }}, error: e => this.error = e.error?.title ?? 'No se pudieron cargar las reglas.'});
  }
  get reglasFiltradas() {
    const search = this.busqueda.trim().toLocaleLowerCase();
    return (this.data?.reglas ?? []).filter(r => (this.incluirHistorial || r.activo) && (!this.titularFiltro || r.titularRepresentanteId === this.titularFiltro) && (!this.rentaFiltro || r.tipoRenta === this.rentaFiltro) && (!this.accionFiltro || r.accion === this.accionFiltro) && `${r.reglaId} ${r.titular} ${r.opciones.map(x => x.nombre).join(' ')}`.toLocaleLowerCase().includes(search));
  }
  get reglasPagina() { return this.reglasFiltradas.slice((this.pagina - 1) * this.tamanoPagina, this.pagina * this.tamanoPagina); }
  get paginas() { return Math.max(1, Math.ceil(this.reglasFiltradas.length / this.tamanoPagina)); }
  filtrar() { this.pagina = 1; }
  get responsablesVisibles() {
    const search = this.buscarResponsable.trim().toLocaleLowerCase();
    return (this.data?.representantes ?? []).filter(p => (p.activo || this.form.opciones.includes(p.representanteId)) && `${p.nombre} ${p.correoCorporativo}`.toLocaleLowerCase().includes(search));
  }
  cerrarEditor() { if (!this.busy) {this.mostrarFormulario = false; this.error = ''; this.reload();} }
  nueva() {
    this.modoEditor = 'crear'; this.reglaEditada = null; this.edicionDesactualizada = false; this.reglaActualId = 0;
    this.form = {titularId: this.titularFiltro, renta: this.rentaFiltro || 'RF', accion: this.accionFiltro || 'ENVIO_OPERACION', modo: 'TITULAR', opciones: [], activo: true};
    this.mostrarFormulario = true; this.buscarResponsable = ''; this.error = '';
  }
  editar(r: ReglaAdmin) {
    this.modoEditor = 'editar'; this.reglaEditada = {...r}; this.edicionDesactualizada = false;
    this.form = {titularId: r.titularRepresentanteId, renta: r.tipoRenta, accion: r.accion, modo: r.modoResolucion, opciones: r.opciones.map(x => x.representanteId), activo: r.activo};
    this.reglaActualId = r.reglaId; this.mostrarFormulario = true; this.buscarResponsable = ''; this.error = '';
  }
  seleccionarClave() {
    if (this.esEdicion) return;
    this.reglaActualId = 0; this.form.modo = 'TITULAR'; this.form.opciones = []; this.form.activo = true; this.buscarResponsable = ''; this.error = '';
  }
  cambiarModo() { if (this.form.modo === 'TITULAR') this.form.opciones = []; }
  toggle(id: number, checked: boolean) { this.form.opciones = checked ? [...new Set([...this.form.opciones, id])] : this.form.opciones.filter(x => x !== id); }
  guardar() {
    if (!this.data || this.busy) return;
    if (this.edicionDesactualizada) return;
    if (!this.esEdicion && this.reglaExistente) { this.error = 'Ya existe una regla vigente para esta combinación. Usa Editar esta regla.'; return; }
    const key = this.esEdicion && this.reglaEditada ? {titularId: this.reglaEditada.titularRepresentanteId, renta: this.reglaEditada.tipoRenta, accion: this.reglaEditada.accion} : this.esEdicion ? null : this.form;
    if (!key?.titularId) return;
    if (this.form.modo === 'LISTA' && !this.form.opciones.length) {this.error = 'Selecciona al menos una persona para la lista.'; return;}
    if (this.form.modo === 'LISTA' && this.form.opciones.some(id => !this.data!.representantes.some(p => p.representanteId === id && p.activo))) {this.error = 'Quita los responsables con cuenta inactiva antes de guardar.'; return;}
    const request = {revision: this.data.revision, modoResolucion: this.form.modo, opciones: this.form.modo === 'TITULAR' ? [] : [...this.form.opciones], activo: this.form.activo};
    this.busy = true; this.error = '';
    const editing = this.esEdicion;
    this.api.guardar(key.titularId, key.renta, key.accion, request)
      .pipe(takeUntilDestroyed(this.destroy), finalize(() => {this.busy = false; this.cdr.markForCheck();}))
      .subscribe({next: data => {this.data = data; this.mostrarFormulario = false; this.pagina = 1; this.feedback.success(editing ? 'Regla actualizada.' : 'Regla creada.');}, error: e => this.error = e.error?.title ?? 'No se pudo guardar la regla. Actualiza antes de reintentar.'});
  }
  responsablesDe(rule: ReglaAdmin) { return rule.modoResolucion === 'TITULAR' ? [rule.titular] : rule.opciones.map(p => p.nombre + (p.activo ? '' : ' (inactivo)')); }
  accionNombre(action: string) { return action === 'ENVIO_ORDEN' ? 'Envío de orden' : 'Ejecución de operación'; }
}
