import { TestBed } from '@angular/core/testing';
import { provideRouter, UrlTree } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';
import { RepresentantesAdminComponent, representantesAdminGuard } from './representantes-admin';
import { RepresentantesConfiguracionService } from '../../../services/representantes-configuracion.service';

describe('Read-only representative overview', () => {
  const config = {revision: 'r1', usuarios: [], gestores: [], grupos: [], miembros: [], reglas: [], opciones: [], motivos: [], ausencias: [], perfiles: []};
  const api = {sesion: vi.fn(), configuracion: () => of(config), auditoria: () => of([]), guardar: vi.fn()};
  beforeEach(() => {vi.clearAllMocks(); api.sesion.mockReturnValue(of({enabled: true, esAdmin: false})); TestBed.configureTestingModule({imports: [RepresentantesAdminComponent], providers: [provideRouter([]), {provide: RepresentantesConfiguracionService, useValue: api}]});});
  it('rejects non-admins', async () => {
    const result = TestBed.runInInjectionContext(() => representantesAdminGuard({} as never, {} as never)); expect(await firstValueFrom(result as ReturnType<typeof of>)).toBeInstanceOf(UrlTree);
  });
  it('allows admins and redirects other representatives within their own portal', async () => {
    api.sesion.mockReturnValue(of({enabled: true, esAdmin: true}));
    const allowed = TestBed.runInInjectionContext(() => representantesAdminGuard({} as never, {url: '/Representantes/grupos'} as never)); expect(await firstValueFrom(allowed as ReturnType<typeof of>)).toBe(true);
    api.sesion.mockReturnValue(of({enabled: true, esAdmin: false}));
    const denied = TestBed.runInInjectionContext(() => representantesAdminGuard({} as never, {url: '/Representantes/grupos'} as never)); expect(String(await firstValueFrom(denied as ReturnType<typeof of>))).toBe('/Representantes/ordenes');
  });
  it('contains no editing forms, write actions or redundant module shortcuts', () => {
    const fixture = TestBed.createComponent(RepresentantesAdminComponent); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Resumen de representantes'); expect(fixture.nativeElement.querySelector('form')).toBeNull();
    expect([...fixture.nativeElement.querySelectorAll('button')].some((b: HTMLElement) => /Editar|Guardar/.test(b.textContent ?? ''))).toBe(false);
    expect(fixture.nativeElement.querySelector('a.module-link')).toBeNull(); expect(api.guardar).not.toHaveBeenCalled(); fixture.destroy();
  });
  it('paginates users, changes page size and keeps navigation outside the table scroll', () => {
    const fixture = TestBed.createComponent(RepresentantesAdminComponent); fixture.detectChanges(); const component = fixture.componentInstance;
    component.config = {...config, usuarios: Array.from({length: 23}, (_, i) => ({representanteId: i + 1, nombre: `Persona ${i + 1}`, correoCorporativo: `p${i + 1}@example.test`, activo: true}))};
    fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('tbody tr')).toHaveLength(5);
    const next = fixture.nativeElement.querySelector('.portal-table-pagination nav button:last-child') as HTMLButtonElement; next.click(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('tbody').textContent).toContain('Persona 6'); expect(component.tablas.usuarios.start(component.totalUsuarios)).toBe(6);
    component.tablas.usuarios.changeSize(10); fixture.changeDetectorRef.markForCheck(); fixture.detectChanges(); expect(component.tablas.usuarios.page).toBe(1); expect(fixture.nativeElement.querySelectorAll('tbody tr')).toHaveLength(10);
    component.tablas.usuarios.page = 3; fixture.changeDetectorRef.markForCheck(); fixture.detectChanges(); expect(fixture.nativeElement.querySelectorAll('tbody tr')).toHaveLength(3); expect(next.disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('.table-scroll .portal-table-pagination')).toBeNull();
    component.config = {...config}; component.tablas.usuarios.changeSize(5); fixture.changeDetectorRef.markForCheck(); fixture.detectChanges(); expect(component.tablas.usuarios.start(component.totalUsuarios)).toBe(0); expect(component.tablas.usuarios.end(component.totalUsuarios)).toBe(0); expect(next.disabled).toBe(true); fixture.destroy();
  });

  it('filters every summary section independently and resets user pagination', () => {
    const fixture = TestBed.createComponent(RepresentantesAdminComponent); fixture.detectChanges(); const c = fixture.componentInstance;
    c.config = {...config,
      usuarios: [{representanteId: 1, nombre: 'Ana Peña', correoCorporativo: 'ana@example.test', activo: true}, {representanteId: 2, nombre: 'Luis', correoCorporativo: 'luis@example.test', activo: false}],
      gestores: [{representanteId: 1, codigoGestor: '000314', activo: true}, {representanteId: 2, codigoGestor: '000315', activo: false}],
      grupos: [{grupoId: 1, nombre: 'Master', grupoPadreId: null, activo: true, puedeConsultarTodosClientes: true}, {grupoId: 2, nombre: 'Onyx', grupoPadreId: 1, activo: false, puedeConsultarTodosClientes: false}],
      miembros: [{grupoId: 1, representanteId: 1, activo: true, incluyeDescendientes: true}, {grupoId: 2, representanteId: 2, activo: false, incluyeDescendientes: false}],
      reglas: [{reglaId: 10, titularRepresentanteId: 1, tipoRenta: 'RF', accion: 'ENVIO_OPERACION', modoResolucion: 'LISTA', activo: true}, {reglaId: 11, titularRepresentanteId: 2, tipoRenta: 'RV', accion: 'ENVIO_ORDEN', modoResolucion: 'TITULAR', activo: false}],
      opciones: [{reglaId: 10, responsableRepresentanteId: 2}],
      perfiles: [{representanteId: 1, tipoRenta: 'RF', esAsesor: true, esOperador: false}, {representanteId: 2, tipoRenta: 'RV', esAsesor: false, esOperador: true}]};
    c.filtros.usuarios.texto = 'pena'; c.tablas.usuarios.page = 3; c.filtrar(); expect(c.tablas.usuarios.page).toBe(1); expect(c.totalUsuarios).toBe(1);
    c.filtros.gestores.texto = '314'; expect(c.gestoresFiltrados).toHaveLength(1);
    c.filtros.grupos.estado = 'inactivo'; c.filtros.grupos.grupo = 1; expect(c.gruposFiltrados.map(g => g.nombre)).toEqual(['Onyx']);
    c.filtros.miembros.persona = 2; c.filtros.miembros.grupo = 2; expect(c.miembrosFiltrados).toHaveLength(1);
    c.filtros.reglas.renta = 'RF'; c.filtros.reglas.accion = 'ENVIO_OPERACION'; c.filtros.reglas.texto = 'Luis'; expect(c.reglasFiltradas).toHaveLength(1);
    c.filtros.perfiles.renta = 'RV'; c.filtros.perfiles.texto = 'operador'; expect(c.perfilesFiltrados).toHaveLength(1);
    c.auditoria = [{auditoriaId: 1, actorRepresentanteId: 1, entidad: 'membresia', clave: '2:1', fechaUtc: '2026-11-11T05:00:00Z'}, {auditoriaId: 2, actorRepresentanteId: 2, entidad: 'grupo', clave: '2', fechaUtc: '2026-11-10T04:59:59Z'}];
    c.filtros['auditoría'].persona = 1; c.filtros['auditoría'].texto = 'membresia'; c.filtros['auditoría'].desde = '2026-11-11'; expect(c.auditoriaFiltrada).toHaveLength(1);
    c.tab = 'reglas'; c.limpiarFiltros(); expect(c.reglasFiltradas).toHaveLength(2); expect(c.filtros.usuarios.texto).toBe('pena'); fixture.destroy();
  });
  it('filters absence overlaps using inclusive calendar days in Lima and distinguishes cancellation', () => {
    const fixture = TestBed.createComponent(RepresentantesAdminComponent); fixture.detectChanges(); const c = fixture.componentInstance;
    c.config = {...config, motivos: [{motivoAusenciaId: 1, nombre: 'Otro', activo: true}], ausencias: [
      {ausenciaId: 1, representanteId: 1, motivoAusenciaId: 1, desdeUtc: '2026-11-10T05:00:00Z', hastaUtc: '2026-11-11T05:00:00Z', cancelada: false, detalle: 'Trámite'},
      {ausenciaId: 2, representanteId: 1, motivoAusenciaId: 1, desdeUtc: '2026-11-11T05:00:00Z', hastaUtc: '2026-11-12T05:00:00Z', cancelada: false, detalle: 'Trámite'},
      {ausenciaId: 3, representanteId: 2, motivoAusenciaId: 1, desdeUtc: '2026-11-11T05:00:00Z', hastaUtc: '2026-11-12T05:00:00Z', cancelada: true},
      {ausenciaId: 4, representanteId: 1, motivoAusenciaId: 1, desdeUtc: '2026-11-12T05:00:00Z', hastaUtc: '2026-11-13T05:00:00Z', cancelada: false}]};
    c.tab = 'ausencias'; c.filtro.desde = c.filtro.hasta = '2026-11-11'; expect(c.ausenciasFiltradas.map(a => a.ausenciaId).sort()).toEqual([2, 3]);
    c.filtro.estado = 'CANCELADA'; expect(c.ausenciasFiltradas.map(a => a.ausenciaId)).toEqual([3]);
    c.filtro.estado = ''; c.filtro.persona = 1; c.filtro.texto = 'tramite'; expect(c.ausenciasFiltradas.map(a => a.ausenciaId)).toEqual([2]);
    c.filtro.desde = '2026-11-12'; expect(c.rangoValido).toBe(false); expect(c.ausenciasFiltradas).toHaveLength(0);
    c.limpiarFiltros(); expect(c.ausenciasFiltradas).toHaveLength(4); fixture.destroy();
  });

  it('renders the common paginated table in every tab and paginates its filtered rows', () => {
    const fixture = TestBed.createComponent(RepresentantesAdminComponent); fixture.detectChanges(); const c = fixture.componentInstance;
    c.config = {...config,
      usuarios: Array.from({length: 12}, (_, i) => ({representanteId: i + 1, nombre: `Persona ${i + 1}`, correoCorporativo: `p${i}@example.test`, activo: true})),
      gestores: Array.from({length: 12}, (_, i) => ({representanteId: i + 1, codigoGestor: `000${i + 1}`, activo: true}))};
    for (const tab of c.tabs) {
      c.tab = tab; fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
      expect(fixture.nativeElement.querySelectorAll('app-portal-table')).toHaveLength(1);
      expect(fixture.nativeElement.querySelector('.portal-table-scroll .portal-table-pagination')).toBeNull();
      expect(fixture.nativeElement.querySelector('.portal-table-pagination mat-select')).not.toBeNull();
    }
    c.tab = 'gestores'; fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('tbody tr')).toHaveLength(5);
    (fixture.nativeElement.querySelector('.portal-table-pagination nav button:last-child') as HTMLButtonElement).click(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('tbody td').textContent.trim()).toBe('6');
    c.filtro.texto = 'Persona 12'; c.filtrar(); fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
    expect(c.tablas.gestores.page).toBe(1); expect(fixture.nativeElement.querySelectorAll('tbody tr')).toHaveLength(1);
    expect(fixture.nativeElement.querySelector('tbody').textContent).toContain('Persona 12'); fixture.destroy();
  });

});
