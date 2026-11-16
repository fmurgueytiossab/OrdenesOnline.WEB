import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { GruposRepresentantesComponent } from './grupos-representantes';
import { GruposConsulta, GruposRepresentantesService } from '../../../services/grupos-representantes.service';

const fixtureData: GruposConsulta = {revision: 'r1', representantes: [{representanteId: 1, nombre: 'Admin', correoCorporativo: 'admin@seminariosab.com.pe', activo: true}, {representanteId: 2, nombre: 'Persona dos', correoCorporativo: 'dos@seminariosab.com.pe', activo: true}], grupos: [
  {grupoId: 1, nombre: 'Master', grupoPadreId: null, activo: true, habilitadoEnJerarquia: true, puedeConsultarTodosClientes: true, miembros: [{representanteId: 1, nombre: 'Admin', correoCorporativo: 'admin@seminariosab.com.pe', usuarioActivo: true, activo: true, incluyeDescendientes: true, tieneAcceso: true}]},
  {grupoId: 2, nombre: 'Onyx RV', grupoPadreId: 1, activo: true, habilitadoEnJerarquia: true, puedeConsultarTodosClientes: false, miembros: [{representanteId: 2, nombre: 'Persona dos', correoCorporativo: 'dos@seminariosab.com.pe', usuarioActivo: true, activo: true, incluyeDescendientes: false, tieneAcceso: true}]},
]};
describe('Grupos de representantes', () => {
  const api = {consultar: vi.fn(), guardar: vi.fn(), miembro: vi.fn()};
  beforeEach(() => {vi.clearAllMocks(); api.consultar.mockReturnValue(of(fixtureData)); api.guardar.mockReturnValue(of({...fixtureData, revision: 'r2'})); api.miembro.mockReturnValue(of({...fixtureData, revision: 'r2'})); TestBed.configureTestingModule({imports: [GruposRepresentantesComponent], providers: [{provide: GruposRepresentantesService, useValue: api}]});});
  it('opens membership editing in a modal with Material selects and checkboxes', () => {
    const fixture = TestBed.createComponent(GruposRepresentantesComponent); fixture.detectChanges();
    fixture.componentInstance.select(2); fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
    const edit = [...fixture.nativeElement.querySelectorAll('button')].find((b: HTMLElement) => b.textContent?.trim() === 'Editar membresía') as HTMLButtonElement;
    edit.click(); fixture.detectChanges();
    const modal = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(modal.textContent).toContain('Integrante de Onyx RV'); expect(modal.querySelector('mat-select')).not.toBeNull(); expect(modal.querySelectorAll('mat-checkbox').length).toBe(2);
    expect(fixture.nativeElement.querySelector('.group-list')).not.toBeNull(); fixture.destroy();
  });
  it('distinguishes direct members from those belonging to subgroups', () => {
    const fixture = TestBed.createComponent(GruposRepresentantesComponent); fixture.detectChanges(); const component = fixture.componentInstance;
    expect(component.miembrosVisibles.map(x => x.nombre)).toEqual(['Admin']); component.incluirSubgrupos = true;
    expect(component.miembrosVisibles.map(x => x.nombre)).toEqual(['Admin', 'Persona dos']);
    expect(component.miembrosVisibles.find(x => x.representanteId === 2)?.grupoNombre).toBe('Onyx RV');
    component.select(2); fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('tbody').textContent).toContain('Persona dos'); fixture.destroy();
  });
  it('keeps Master global consultation and excludes itself and its descendants as possible parents', () => {
    const fixture = TestBed.createComponent(GruposRepresentantesComponent); fixture.detectChanges(); const component = fixture.componentInstance;
    component.editar(fixtureData.grupos[0]); expect(component.padresDisponibles).toHaveLength(0); component.guardarGrupo();
    expect(api.guardar).toHaveBeenCalledWith(1, expect.objectContaining({revision: 'r1', puedeConsultarTodosClientes: true})); fixture.destroy();
  });
  it('creates a group from an empty register and selects the saved group', () => {
    api.consultar.mockReturnValue(of({...fixtureData, grupos: []}));
    api.guardar.mockReturnValue(of({...fixtureData, revision: 'r2', grupos: [{...fixtureData.grupos[1], grupoId: 3, nombre: 'Nuevo', grupoPadreId: null, miembros: []}]}));
    const fixture = TestBed.createComponent(GruposRepresentantesComponent); fixture.detectChanges(); const component = fixture.componentInstance;
    expect(fixture.nativeElement.textContent).toContain('No hay grupos'); component.nuevo(); component.grupo.nombre = ' Nuevo '; component.guardarGrupo();
    expect(api.guardar).toHaveBeenCalledWith(0, expect.objectContaining({nombre: 'Nuevo', revision: 'r1'})); expect(component.selectedId).toBe(3); fixture.destroy();
  });
  it('edits a membership in its actual subgroup and surfaces stale-configuration conflicts', () => {
    api.miembro.mockReturnValue(throwError(() => ({status: 409, error: {title: 'La configuración cambió. Actualice.'}})));
    const fixture = TestBed.createComponent(GruposRepresentantesComponent); fixture.detectChanges(); const component = fixture.componentInstance;
    component.editarMiembro(2, fixtureData.grupos[1].miembros[0]); component.miembro.incluyeDescendientes = true; component.guardarMiembro(); fixture.detectChanges();
    expect(api.miembro).toHaveBeenCalledWith(2, 2, {revision: 'r1', activo: true, incluyeDescendientes: true}); expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Actualice'); expect(component.busy).toBe(false); fixture.destroy();
  });
  it('paginates members with row numbers, preserves subgroup editing and resets when changing groups', () => {
    const many = Array.from({length: 12}, (_, i) => ({...fixtureData.grupos[1].miembros[0], representanteId: i + 10, nombre: `Persona ${String(i + 1).padStart(2,'0')}`}));
    api.consultar.mockReturnValue(of({...fixtureData, grupos: [fixtureData.grupos[0], {...fixtureData.grupos[1], miembros: many}]}));
    const fixture = TestBed.createComponent(GruposRepresentantesComponent); fixture.detectChanges(); const c = fixture.componentInstance;
    c.select(2); fixture.changeDetectorRef.markForCheck(); fixture.detectChanges(); expect(fixture.nativeElement.querySelectorAll('tbody tr')).toHaveLength(5);
    (fixture.nativeElement.querySelector('.portal-table-pagination nav button:last-child') as HTMLButtonElement).click(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('tbody td').textContent.trim()).toBe('6');
    expect(fixture.nativeElement.querySelector('tbody').textContent).toContain('Persona 06');
    (fixture.nativeElement.querySelector('tbody button') as HTMLButtonElement).click(); fixture.detectChanges();
    expect(c.miembro.representanteId).toBe(15); expect(c.selectedId).toBe(2); c.cerrarMiembro();
    c.select(1); expect(c.tablaMiembros.page).toBe(1); fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('tbody').textContent).toContain('Admin'); fixture.destroy();
  });

});
