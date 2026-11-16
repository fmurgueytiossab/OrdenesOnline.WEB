import { PortalTableComponent, TablePagination } from '../../../shared/portal-table';
import { PortalFeedbackService } from '../../../shared/portal-feedback.service';
import { REPRESENTANTES_UI, calendarDate, calendarIso } from '../../../shared/representantes-ui';
import { PortalModalComponent } from '../../../shared/portal-modal';
import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { GrupoDetalle, GrupoMiembro, GruposConsulta, GruposRepresentantesService } from '../../../services/grupos-representantes.service';

@Component({selector: 'app-grupos-representantes', standalone: true, imports: [...REPRESENTANTES_UI, PortalModalComponent, PortalTableComponent],
  templateUrl: './grupos-representantes.html', styleUrl: './grupos-representantes.css'})
export class GruposRepresentantesComponent implements OnInit {
  private readonly feedback = inject(PortalFeedbackService);
  private readonly api = inject(GruposRepresentantesService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly destroy = inject(DestroyRef);
  readonly tablaMiembros = new TablePagination();
  data: GruposConsulta | null = null;
  mostrarMiembro = false;
  busy = false; error = ''; busqueda = ''; estado = ''; selectedId = 0;
  incluirSubgrupos = false; buscarPersona = ''; mostrarFormulario = false;
  grupo = {id: 0, nombre: '', grupoPadreId: null as number | null, activo: true, puedeConsultarTodosClientes: false};
  miembro = {representanteId: 0, activo: true, incluyeDescendientes: false, editando: false};
  ngOnInit() { this.reload(); }
  reload() {
    if (this.busy) return;
    this.busy = true; this.error = '';
    this.api.consultar().pipe(takeUntilDestroyed(this.destroy), finalize(() => {this.busy = false; this.cdr.markForCheck();}))
      .subscribe({next: data => {this.data = data; this.tablaMiembros.reset(); if (!this.selected) this.selectedId = data.grupos[0]?.grupoId ?? 0;}, error: e => this.error = e.error?.title ?? 'No se pudieron cargar los grupos.'});
  }
  get selected() { return this.data?.grupos.find(g => g.grupoId === this.selectedId); }
  path(id: number): string {
    const names: string[] = []; const seen = new Set<number>(); let next: number | null = id;
    while (next !== null && !seen.has(next)) {seen.add(next); const group: GrupoDetalle | undefined = this.data?.grupos.find(g => g.grupoId === next); if (!group) break; names.unshift(group.nombre); next = group.grupoPadreId;}
    return names.join(' / ');
  }
  descendants(id: number) {
    const ids = new Set<number>([id]); const queue = [id];
    while (queue.length) {const parent = queue.shift()!; for (const g of this.data?.grupos ?? []) if (g.grupoPadreId === parent && !ids.has(g.grupoId)) {ids.add(g.grupoId); queue.push(g.grupoId);}}
    return ids;
  }
  get gruposVisibles() { return (this.data?.grupos ?? []).filter(g => this.path(g.grupoId).toLocaleLowerCase().includes(this.busqueda.trim().toLocaleLowerCase()) && (!this.estado || String(g.activo) === this.estado)); }
  get padresDisponibles() { const excluded = this.grupo.id ? this.descendants(this.grupo.id) : new Set<number>(); return (this.data?.grupos ?? []).filter(g => !excluded.has(g.grupoId)); }
  get subgrupos() { return (this.data?.grupos ?? []).filter(g => g.grupoPadreId === this.selectedId); }
  get miembrosVisibles() {
    const ids = this.incluirSubgrupos ? this.descendants(this.selectedId) : new Set([this.selectedId]); const search = this.buscarPersona.trim().toLocaleLowerCase();
    return (this.data?.grupos ?? []).filter(g => ids.has(g.grupoId)).flatMap(g => g.miembros.map(m => ({...m, grupoId: g.grupoId, grupoNombre: g.nombre})))
      .filter(m => `${m.nombre} ${m.correoCorporativo}`.toLocaleLowerCase().includes(search)).sort((a, b) => a.nombre.localeCompare(b.nombre));
  }
  select(id: number) { this.tablaMiembros.reset(); this.selectedId = id; this.incluirSubgrupos = false; this.buscarPersona = ''; this.resetMember(); }
  nuevo(parent: number | null = null) { this.grupo = {id: 0, nombre: '', grupoPadreId: parent, activo: true, puedeConsultarTodosClientes: false}; this.mostrarFormulario = true; this.error = ''; }
  editar(g: GrupoDetalle) { this.grupo = {id: g.grupoId, nombre: g.nombre, grupoPadreId: g.grupoPadreId, activo: g.activo, puedeConsultarTodosClientes: g.puedeConsultarTodosClientes}; this.mostrarFormulario = true; this.error = ''; }
  guardarGrupo() {
    if (!this.data || this.busy || !this.grupo.nombre.trim()) return;
    const id = this.grupo.id; const request = {revision: this.data.revision, nombre: this.grupo.nombre.trim(), grupoPadreId: this.grupo.grupoPadreId, activo: this.grupo.activo, puedeConsultarTodosClientes: this.grupo.puedeConsultarTodosClientes};
    this.busy = true; this.error = '';
    this.api.guardar(id, request).pipe(takeUntilDestroyed(this.destroy), finalize(() => {this.busy = false; this.cdr.markForCheck();}))
      .subscribe({next: data => {this.data = data; this.select(id || data.grupos.find(g => g.nombre === request.nombre && g.grupoPadreId === request.grupoPadreId)!.grupoId); this.mostrarFormulario = false; this.feedback.success('Grupo guardado.');}, error: e => this.error = e.error?.title ?? 'No se pudo guardar el grupo.'});
  }
  cerrarGrupo() { if (!this.busy) {this.mostrarFormulario = false; this.error = '';} }
  cerrarMiembro() { if (!this.busy) {this.mostrarMiembro = false; this.error = ''; this.resetMember();} }
  abrirMiembro() { this.resetMember(); this.error = ''; this.mostrarMiembro = true; }
  resetMember() { this.mostrarMiembro = false; this.miembro = {representanteId: 0, activo: true, incluyeDescendientes: false, editando: false}; }
  editarMiembro(grupoId: number, member: GrupoMiembro) { this.select(grupoId); this.miembro = {representanteId: member.representanteId, activo: member.activo, incluyeDescendientes: member.incluyeDescendientes, editando: true}; this.mostrarMiembro = true; }
  yaPertenece(id: number) { return !this.miembro.editando && !!this.selected?.miembros.some(m => m.representanteId === id && m.activo); }
  guardarMiembro() {
    if (!this.data || !this.selected || !this.miembro.representanteId || this.busy) return;
    this.busy = true; this.error = '';
    this.api.miembro(this.selectedId, this.miembro.representanteId, {revision: this.data.revision, activo: this.miembro.activo, incluyeDescendientes: this.miembro.incluyeDescendientes})
      .pipe(takeUntilDestroyed(this.destroy), finalize(() => {this.busy = false; this.cdr.markForCheck();}))
      .subscribe({next: data => {this.data = data; this.resetMember(); this.feedback.success('Membresía guardada.');}, error: e => this.error = e.error?.title ?? 'No se pudo guardar la membresía.'});
  }
  memberState(m: GrupoMiembro) { return !m.activo ? 'Membresía inactiva' : !m.usuarioActivo ? 'Usuario inactivo' : !m.tieneAcceso ? 'Grupo deshabilitado' : 'Activa'; }
}
