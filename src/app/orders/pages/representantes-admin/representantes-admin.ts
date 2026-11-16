import { PortalTableComponent, TablePagination } from '../../../shared/portal-table';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, CanActivateFn } from '@angular/router';
import { catchError, finalize, forkJoin, map, of } from 'rxjs';
import { Ausencia, Configuracion, RepresentantesConfiguracionService } from '../../../services/representantes-configuracion.service';
import { REPRESENTANTES_UI, calendarDate, calendarIso } from '../../../shared/representantes-ui';
import { ResponsibleListComponent } from '../../../shared/responsible-list';

export const representantesAdminGuard: CanActivateFn = (_route, state) => {
  const router = inject(Router);
  return inject(RepresentantesConfiguracionService).sesion().pipe(map(s => s.esAdmin || router.parseUrl(state.url?.startsWith('/Representantes') ? '/Representantes/ordenes' : '/Clientes/ordenes')), catchError(() => of(router.parseUrl(state.url?.startsWith('/Representantes') ? '/Representantes/ordenes' : '/Clientes/ordenes'))));
};
type Tab = 'usuarios' | 'gestores' | 'grupos' | 'miembros' | 'reglas' | 'perfiles' | 'ausencias' | 'auditoría';
interface Filtros { texto: string; estado: string; persona: number; grupo: number; renta: string; accion: string; desde: string; hasta: string; }
const vacios = (): Filtros => ({texto: '', estado: '', persona: 0, grupo: 0, renta: '', accion: '', desde: '', hasta: ''});

@Component({selector: 'app-representantes-admin', standalone: true, imports: [...REPRESENTANTES_UI, ResponsibleListComponent, PortalTableComponent], templateUrl: './representantes-admin.html', styleUrl: './representantes-admin.css'})
export class RepresentantesAdminComponent implements OnInit {
  private readonly api = inject(RepresentantesConfiguracionService);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);
  config: Configuracion | null = null;
  auditoria: {auditoriaId: number; actorRepresentanteId: number; entidad: string; clave: string; fechaUtc: string}[] = [];
  busy = false; error = ''; enabled = false; tab: Tab = 'usuarios';
  readonly tabs: Tab[] = ['usuarios', 'gestores', 'grupos', 'miembros', 'reglas', 'perfiles', 'ausencias', 'auditoría'];
  readonly filtros = Object.fromEntries(this.tabs.map(t => [t, vacios()])) as Record<Tab, Filtros>;
  get filtro() { return this.filtros[this.tab]; }
  get filtraPersona() { return ['gestores', 'miembros', 'reglas', 'perfiles', 'ausencias', 'auditoría'].includes(this.tab); }
  get filtraEstado() { return ['usuarios', 'gestores', 'grupos', 'miembros', 'reglas'].includes(this.tab); }
  get filtraFechas() { return this.tab === 'ausencias' || this.tab === 'auditoría'; }
  get desdeDate() { return calendarDate(this.filtro.desde); }
  set desdeDate(value: Date | null) { this.filtro.desde = calendarIso(value); }
  get hastaDate() { return calendarDate(this.filtro.hasta); }
  set hastaDate(value: Date | null) { this.filtro.hasta = calendarIso(value); }
  get rangoValido() { return !this.filtro.desde || !this.filtro.hasta || this.filtro.desde <= this.filtro.hasta; }
  readonly tablas = Object.fromEntries(this.tabs.map(t => [t, new TablePagination()])) as Record<Tab, TablePagination>;
  get totalUsuarios() { return this.usuariosFiltrados.length; }
  filtrar() { this.tablas[this.tab].reset(); }
  limpiarFiltros() { this.filtros[this.tab] = vacios(); this.filtrar(); }
  ngOnInit() {
    const requested = this.route.snapshot.queryParamMap.get('tab');
    if (this.tabs.includes(requested as Tab)) this.tab = requested as Tab;
    this.reload();
  }
  reload() {
    this.busy = true; this.error = '';
    forkJoin({config: this.api.configuracion(), session: this.api.sesion(), audit: this.api.auditoria()})
      .pipe(finalize(() => {this.busy = false; this.cdr.markForCheck();})).subscribe({next: r => {this.config = r.config; this.tabs.forEach(t => this.tablas[t].reset()); this.enabled = r.session.enabled; this.auditoria = r.audit;}, error: e => this.error = e.error?.title ?? 'No se pudo cargar el resumen.'});
  }
  private texto(tab: Tab, ...values: unknown[]) {
    const normalize = (text: string) => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('es');
    return normalize(values.join(' ')).includes(normalize(this.filtros[tab].texto.trim()));
  }
  private activo(tab: Tab, value: boolean) { return !this.filtros[tab].estado || (this.filtros[tab].estado === 'activo') === value; }
  private persona(tab: Tab, value: number) { return !this.filtros[tab].persona || this.filtros[tab].persona === value; }
  private renta(tab: Tab, value: string) { return !this.filtros[tab].renta || this.filtros[tab].renta === value; }
  get usuariosFiltrados() { return (this.config?.usuarios ?? []).filter(u => this.texto('usuarios', u.nombre, u.correoCorporativo, u.representanteId) && this.activo('usuarios', u.activo)); }
  get gestoresFiltrados() { return (this.config?.gestores ?? []).filter(g => this.texto('gestores', this.name(g.representanteId), g.codigoGestor) && this.activo('gestores', g.activo) && this.persona('gestores', g.representanteId)); }
  get gruposFiltrados() { return (this.config?.grupos ?? []).filter(g => this.texto('grupos', g.nombre, this.groupName(g.grupoPadreId), g.puedeConsultarTodosClientes ? 'consulta global' : '') && this.activo('grupos', g.activo) && (!this.filtros.grupos.grupo || g.grupoPadreId === this.filtros.grupos.grupo)); }
  get miembrosFiltrados() { return (this.config?.miembros ?? []).filter(m => this.texto('miembros', this.name(m.representanteId), this.groupName(m.grupoId)) && this.activo('miembros', m.activo) && this.persona('miembros', m.representanteId) && (!this.filtros.miembros.grupo || m.grupoId === this.filtros.miembros.grupo)); }
  get reglasFiltradas() { return (this.config?.reglas ?? []).filter(r => this.texto('reglas', r.reglaId, this.name(r.titularRepresentanteId), this.options(r.reglaId).join(' '), r.modoResolucion === 'TITULAR' ? 'El mismo titular' : 'Lista') && this.activo('reglas', r.activo) && this.persona('reglas', r.titularRepresentanteId) && this.renta('reglas', r.tipoRenta) && (!this.filtros.reglas.accion || r.accion === this.filtros.reglas.accion)); }
  get perfilesFiltrados() { return (this.config?.perfiles ?? []).filter(p => this.texto('perfiles', this.name(p.representanteId), p.esAsesor ? 'asesor' : '', p.esOperador ? 'operador' : '') && this.persona('perfiles', p.representanteId) && this.renta('perfiles', p.tipoRenta)); }
  private start(iso: string) { return Date.parse(`${iso}T00:00:00-05:00`); }
  private range(tab: Tab, start: number, end?: number) {
    const f = this.filtros[tab];
    if (f.desde && f.hasta && f.desde > f.hasta) return false;
    return (!f.desde || (end === undefined ? start >= this.start(f.desde) : end > this.start(f.desde))) && (!f.hasta || start < this.start(f.hasta) + 86400000);
  }
  estadoAusencia(a: Ausencia) { const now = Date.now(); return a.cancelada ? 'CANCELADA' : Date.parse(this.utc(a.hastaUtc)) <= now ? 'FINALIZADA' : Date.parse(this.utc(a.desdeUtc)) > now ? 'PROGRAMADA' : 'VIGENTE'; }
  estadoNombre(state: string) { return ({VIGENTE: 'Vigente', PROGRAMADA: 'Programada', FINALIZADA: 'Finalizada', CANCELADA: 'Cancelada'} as Record<string, string>)[state] ?? state; }
  get ausenciasFiltradas() { return (this.config?.ausencias ?? []).filter(a => this.texto('ausencias', this.name(a.representanteId), this.motive(a.motivoAusenciaId), a.detalle) && this.persona('ausencias', a.representanteId) && (!this.filtros.ausencias.estado || this.estadoAusencia(a) === this.filtros.ausencias.estado) && this.range('ausencias', Date.parse(this.utc(a.desdeUtc)), Date.parse(this.utc(a.hastaUtc)))).sort((a,b) => Date.parse(this.utc(b.desdeUtc))-Date.parse(this.utc(a.desdeUtc))); }
  get auditoriaFiltrada() { return this.auditoria.filter(a => this.texto('auditoría', this.name(a.actorRepresentanteId), a.entidad, a.clave) && this.persona('auditoría', a.actorRepresentanteId) && this.range('auditoría', Date.parse(this.utc(a.fechaUtc)))); }
  get resultados() { return ({usuarios: this.totalUsuarios, gestores: this.gestoresFiltrados.length, grupos: this.gruposFiltrados.length, miembros: this.miembrosFiltrados.length, reglas: this.reglasFiltradas.length, perfiles: this.perfilesFiltrados.length, ausencias: this.ausenciasFiltradas.length, auditoría: this.auditoriaFiltrada.length})[this.tab]; }
  name(id: number) { return this.config?.usuarios.find(u => u.representanteId === id)?.nombre ?? String(id); }
  groupName(id: number | null) { return id === null ? 'Sin grupo padre' : this.config?.grupos.find(g => g.grupoId === id)?.nombre ?? String(id); }
  options(id: number) { return this.config?.opciones.filter(o => o.reglaId === id).map(o => this.name(o.responsableRepresentanteId)) ?? []; }
  motive(id: number) { return this.config?.motivos.find(m => m.motivoAusenciaId === id)?.nombre ?? String(id); }
  utc(value: string) { return /Z$|[+-]\d\d:\d\d$/.test(value) ? value : `${value}Z`; }
}
