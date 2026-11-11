import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, CanActivateFn } from '@angular/router';
import { catchError, finalize, forkJoin, map, of } from 'rxjs';
import { Cambio, Configuracion, Grupo, Miembro, Regla, RepresentantesConfiguracionService } from '../../../services/representantes-configuracion.service';

export const representantesAdminGuard: CanActivateFn = () => {
  const router = inject(Router);
  return inject(RepresentantesConfiguracionService).sesion().pipe(map(s => s.esAdmin || router.parseUrl('/Clientes/ordenes')), catchError(() => of(router.parseUrl('/Clientes/ordenes'))));
};
@Component({selector: 'app-representantes-admin', standalone: true, imports: [CommonModule, FormsModule], templateUrl: './representantes-admin.html', styleUrl: './representantes-admin.css'})
export class RepresentantesAdminComponent implements OnInit {
  private readonly api = inject(RepresentantesConfiguracionService);
  private readonly cdr = inject(ChangeDetectorRef);
  config: Configuracion | null = null;
  catalogo: {codigo: string; nombre: string}[] = [];
  auditoria: {auditoriaId: number; actorRepresentanteId: number; entidad: string; clave: string; fechaUtc: string}[] = [];
  busy = false; error = ''; message = ''; enabled = false;
  tab = 'gestores'; readonly tabs = ['gestores', 'grupos', 'miembros', 'reglas', 'perfiles', 'ausencias', 'usuarios', 'auditoría'];
  person = 0; gestor = ''; active = true;
  grupo = {id: 0, nombre: '', grupoPadreId: null as number | null, activo: true, puedeConsultarTodosClientes: false};
  miembro = {id: 0, representanteId: 0, incluyeDescendientes: false, activo: true};
  regla = {representanteId: 0, tipoRenta: 'RV', accion: 'ENVIO_ORDEN', modoResolucion: 'TITULAR', opciones: [] as number[], activo: true};
  perfil = {representanteId: 0, tipoRenta: 'RV', esAsesor: false, esOperador: false};
  ausencia = {representanteId: 0, motivoAusenciaId: 0, desde: '', hasta: ''};
  ngOnInit() { this.reload(); }
  reload() {
    this.busy = true; this.error = '';
    forkJoin({config: this.api.configuracion(), catalogo: this.api.catalogo(), session: this.api.sesion(), audit: this.api.auditoria()})
      .pipe(finalize(() => {this.busy = false; this.cdr.markForCheck();})).subscribe({next: r => {this.config = r.config; this.catalogo = r.catalogo; this.enabled = r.session.enabled; this.auditoria = r.audit;}, error: e => this.error = e.error?.title ?? 'No se pudo cargar la configuración.'});
  }
  name(id: number) { return this.config?.usuarios.find(u => u.representanteId === id)?.nombre ?? String(id); }
  groupName(id: number | null) { return id === null ? 'Sin grupo padre' : this.config?.grupos.find(g => g.grupoId === id)?.nombre ?? String(id); }
  save(change: Cambio) {
    if (!this.config || this.busy) return;
    this.busy = true; this.error = ''; this.message = '';
    this.api.guardar({...change, revision: this.config.revision}).pipe(finalize(() => {this.busy = false; this.cdr.markForCheck();})).subscribe({next: config => {this.config = config; this.message = 'Cambio guardado y registrado en auditoría.';}, error: e => this.error = e.error?.title ?? 'No se pudo guardar. Actualiza la configuración antes de reintentar.'});
  }
  editGroup(g: Grupo) { this.grupo = {id: g.grupoId, nombre: g.nombre, grupoPadreId: g.grupoPadreId, activo: g.activo, puedeConsultarTodosClientes: g.puedeConsultarTodosClientes}; }
  editMember(m: Miembro) { this.miembro = {id: m.grupoId, representanteId: m.representanteId, incluyeDescendientes: m.incluyeDescendientes, activo: m.activo}; }
  editRule(r: Regla) { this.regla = {representanteId: r.titularRepresentanteId, tipoRenta: r.tipoRenta, accion: r.accion, modoResolucion: r.modoResolucion, opciones: this.config!.opciones.filter(o => o.reglaId === r.reglaId).map(o => o.responsableRepresentanteId), activo: r.activo}; }
  saveRule() { this.save({tipo: 'regla', ...this.regla, opciones: this.regla.modoResolucion === 'TITULAR' ? [] : this.regla.opciones}); }
  saveGroup() { this.save({tipo: 'grupo', ...this.grupo}); }
  saveMember() { this.save({tipo: 'miembro', ...this.miembro}); }
  saveProfile() { this.save({tipo: 'perfil', ...this.perfil}); }
  utc(value: string) { return /Z$|[+-]\d\d:\d\d$/.test(value) ? value : `${value}Z`; }
  saveAbsence() {
    if (!this.ausencia.desde || !this.ausencia.hasta) {this.error = 'Indica inicio y fin de ausencia.'; return;}
    this.save({tipo: 'ausencia', ...this.ausencia, desde: `${this.ausencia.desde}:00-05:00`, hasta: `${this.ausencia.hasta}:00-05:00`});
  }
}
