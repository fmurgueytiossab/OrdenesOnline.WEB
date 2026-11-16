import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { ReglasResponsablesComponent } from './reglas-responsables';
import { ReglasConsulta, ReglasResponsablesService } from '../../../services/reglas-responsables.service';

const owner = {representanteId: 2, nombre: 'Titular', correoCorporativo: 'titular@seminariosab.com.pe', activo: true, disponibleEjecutar: true};
const ana = {representanteId: 3, nombre: 'Ana', correoCorporativo: 'ana@seminariosab.com.pe', activo: true, disponibleEjecutar: true};
const luis = {representanteId: 4, nombre: 'Luis', correoCorporativo: 'luis@seminariosab.com.pe', activo: true, disponibleEjecutar: false};
const inactive = {representanteId: 5, nombre: 'Inactivo', correoCorporativo: 'inactivo@seminariosab.com.pe', activo: false, disponibleEjecutar: false};
const config: ReglasConsulta = {revision: 'r1', representantes: [owner, ana, luis, inactive], reglas: [
  {reglaId: 1, titularRepresentanteId: 2, titular: 'Titular', tipoRenta: 'RF', accion: 'ENVIO_ORDEN', modoResolucion: 'TITULAR', activo: true, opciones: [], modificadoPorId: 2, modificadoPor: 'Admin', fechaModificacionUtc: '2026-11-11T14:00:00Z'},
  {reglaId: 2, titularRepresentanteId: 2, titular: 'Titular', tipoRenta: 'RF', accion: 'ENVIO_OPERACION', modoResolucion: 'LISTA', activo: true, opciones: [ana, luis], modificadoPorId: 2, modificadoPor: 'Admin', fechaModificacionUtc: '2026-11-11T14:00:00Z'},
  {reglaId: 3, titularRepresentanteId: 2, titular: 'Titular', tipoRenta: 'RF', accion: 'ENVIO_OPERACION', modoResolucion: 'LISTA', activo: false, opciones: [ana], modificadoPorId: 2, modificadoPor: 'Admin', fechaModificacionUtc: '2026-11-10T14:00:00Z'},
]};
describe('Reglas de responsables', () => {
  const api = {consultar: vi.fn(), guardar: vi.fn()};
  beforeEach(() => {vi.clearAllMocks(); api.consultar.mockReturnValue(of(config)); api.guardar.mockReturnValue(of({...config, revision: 'r2'})); TestBed.configureTestingModule({imports: [ReglasResponsablesComponent], providers: [{provide: ReglasResponsablesService, useValue: api}]});});
  it('offers creation and edits a fixed rule context with existing Material controls', () => {
    const fixture = TestBed.createComponent(ReglasResponsablesComponent); fixture.detectChanges();
    const header = fixture.nativeElement.querySelector('header') as HTMLElement;
    expect(header.textContent).toContain('Nueva regla'); expect(header.textContent).not.toContain('Actualizar');
    expect(fixture.nativeElement.querySelector('mat-checkbox')).not.toBeNull();
    const edit = [...fixture.nativeElement.querySelectorAll('button')].find((b: HTMLElement) => b.textContent?.trim() === 'Editar regla') as HTMLButtonElement;
    edit.click(); fixture.detectChanges();
    const modal = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
    expect(modal).not.toBeNull(); expect(modal.querySelectorAll('mat-select').length).toBe(1); expect(modal.querySelector('.rule-context')?.textContent).toContain('Titular'); expect(modal.querySelector('.rule-key-fields')).toBeNull(); expect(modal.querySelector('select')).toBeNull(); fixture.destroy();
  });
  it('changes a list to the owner and clears the options in the submitted rule', () => {
    const fixture = TestBed.createComponent(ReglasResponsablesComponent); fixture.detectChanges(); const component = fixture.componentInstance;
    component.editar(config.reglas[1]); component.form.modo = 'TITULAR'; component.cambiarModo(); component.guardar();
    expect(api.guardar).toHaveBeenCalledWith(2, 'RF', 'ENVIO_OPERACION', {revision: 'r1', modoResolucion: 'TITULAR', opciones: [], activo: true}); fixture.destroy();
  });
  it('adds and removes people while keeping an absent but active executor configured', () => {
    const fixture = TestBed.createComponent(ReglasResponsablesComponent); fixture.detectChanges(); const component = fixture.componentInstance;
    component.editar(config.reglas[1]); component.toggle(3, false); component.toggle(2, true); component.guardar();
    expect(api.guardar).toHaveBeenCalledWith(2, 'RF', 'ENVIO_OPERACION', expect.objectContaining({modoResolucion: 'LISTA', opciones: [4, 2]})); fixture.destroy();
  });
  it('rejects an empty list and inactive users before submitting', () => {
    const fixture = TestBed.createComponent(ReglasResponsablesComponent); fixture.detectChanges(); const component = fixture.componentInstance;
    component.editar(config.reglas[1]); component.form.opciones = []; component.guardar(); expect(api.guardar).not.toHaveBeenCalled();
    component.form.opciones = [5]; component.guardar(); expect(api.guardar).not.toHaveBeenCalled(); expect(component.error).toContain('inactiva'); fixture.destroy();
  });
  it('filters by action and shows historical versions only when requested', () => {
    const fixture = TestBed.createComponent(ReglasResponsablesComponent); fixture.detectChanges(); const component = fixture.componentInstance;
    expect(component.reglasFiltradas).toHaveLength(2); component.accionFiltro = 'ENVIO_OPERACION'; expect(component.reglasFiltradas).toHaveLength(1);
    component.incluirHistorial = true; expect(component.reglasFiltradas).toHaveLength(2); fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Solo consulta'); fixture.destroy();
  });
  it('refreshes the open editor along with the revision so old options are not saved over a newer rule', () => {
    const fixture = TestBed.createComponent(ReglasResponsablesComponent); fixture.detectChanges(); const component = fixture.componentInstance;
    component.editar(config.reglas[1]); api.consultar.mockReturnValue(of({...config, revision: 'r2', reglas: config.reglas.map(r => r.reglaId === 2 ? {...r, modoResolucion: 'TITULAR', opciones: []} : r)})); component.reload();
    expect(component.data?.revision).toBe('r2'); expect(component.form.modo).toBe('TITULAR'); expect(component.form.opciones).toEqual([]); fixture.destroy();
  });
  it('surfaces server conflicts without discarding the requested list', () => {
    api.guardar.mockReturnValue(throwError(() => ({status: 409, error: {title: 'La configuración cambió. Actualice.'}})));
    const fixture = TestBed.createComponent(ReglasResponsablesComponent); fixture.detectChanges(); fixture.componentInstance.editar(config.reglas[1]); fixture.componentInstance.guardar(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Actualice'); expect(fixture.componentInstance.form.opciones).toEqual([3, 4]); expect(fixture.componentInstance.busy).toBe(false); fixture.destroy();
  });
  it('uses a read-only dropdown for multiple people and keeps editor actions in cancel/save order', () => {
    const fixture = TestBed.createComponent(ReglasResponsablesComponent); fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('app-responsible-list button')).toHaveLength(1);
    const c = fixture.componentInstance; c.editar(config.reglas[1]); fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
    const buttons = [...fixture.nativeElement.querySelectorAll('.rule-editor-actions button')].map((b: HTMLElement) => b.textContent?.trim()); expect(buttons).toEqual(['Cancelar edición', 'Guardar cambios']); fixture.destroy();
  });

  it('clears every filter including history and resets pagination', () => {
    const fixture = TestBed.createComponent(ReglasResponsablesComponent); fixture.detectChanges(); const c = fixture.componentInstance;
    c.titularFiltro = 2; c.rentaFiltro = 'RV'; c.accionFiltro = 'ENVIO_ORDEN'; c.busqueda = 'Ana'; c.incluirHistorial = true; c.pagina = 3;
    const clear = [...fixture.nativeElement.querySelectorAll('button')].find((b: HTMLElement) => b.textContent?.trim() === 'Limpiar filtros') as HTMLButtonElement;
    clear.click(); fixture.detectChanges(); expect([c.titularFiltro,c.rentaFiltro,c.accionFiltro,c.busqueda,c.incluirHistorial,c.pagina]).toEqual([0,'','','',false,1]);
    expect(c.reglasFiltradas).toHaveLength(2); expect(api.guardar).not.toHaveBeenCalled(); fixture.destroy();
  });
  it('opens a creation form and creates a missing rent/action combination', () => {
    const fixture = TestBed.createComponent(ReglasResponsablesComponent); fixture.detectChanges(); const c = fixture.componentInstance;
    (fixture.nativeElement.querySelector('.new-rule-button') as HTMLButtonElement).click(); fixture.detectChanges();
    expect(c.esEdicion).toBe(false); expect(fixture.nativeElement.querySelector('[role=dialog] h2').textContent).toContain('Nueva regla');
    expect(fixture.nativeElement.querySelectorAll('.rule-key-fields mat-select')).toHaveLength(3);
    c.form.titularId = 2; c.form.renta = 'RV'; c.form.accion = 'ENVIO_ORDEN'; c.seleccionarClave();
    expect(c.puedeGuardar).toBe(true); c.guardar();
    expect(api.guardar).toHaveBeenCalledWith(2,'RV','ENVIO_ORDEN',{revision:'r1',modoResolucion:'TITULAR',opciones:[],activo:true}); fixture.destroy();
  });
  it('does not overwrite an existing rule from creation and offers explicit editing instead', () => {
    const fixture = TestBed.createComponent(ReglasResponsablesComponent); fixture.detectChanges(); const c = fixture.componentInstance;
    c.nueva(); c.form.titularId = 2; c.form.renta = 'RF'; c.form.accion = 'ENVIO_ORDEN'; c.seleccionarClave(); fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
    expect(c.reglaExistente?.reglaId).toBe(1); expect(c.puedeGuardar).toBe(false); c.guardar(); expect(api.guardar).not.toHaveBeenCalled();
    (fixture.nativeElement.querySelector('.existing-rule button') as HTMLButtonElement).click(); fixture.detectChanges();
    expect(c.esEdicion).toBe(true); expect(c.contextoEdicion?.reglaId).toBe(1); expect(fixture.nativeElement.querySelector('.rule-key-fields')).toBeNull(); fixture.destroy();
  });
  it('keeps the original holder/rent/action when saving an edit even if the creation model is altered', () => {
    const fixture = TestBed.createComponent(ReglasResponsablesComponent); fixture.detectChanges(); const c = fixture.componentInstance;
    c.editar(config.reglas[1]); c.form.titularId = 4; c.form.renta = 'RV'; c.form.accion = 'ENVIO_ORDEN'; c.seleccionarClave();
    c.guardar(); expect(api.guardar).toHaveBeenCalledWith(2,'RF','ENVIO_OPERACION',expect.objectContaining({opciones:[3,4]})); fixture.destroy();
  });
  it('blocks saving when a refreshed edit no longer has a current rule', () => {
    const fixture = TestBed.createComponent(ReglasResponsablesComponent); fixture.detectChanges(); const c = fixture.componentInstance;
    c.editar(config.reglas[1]); api.consultar.mockReturnValue(of({...config, revision:'r2', reglas:config.reglas.map(r => ({...r,activo:false}))}));
    c.reload(); expect(c.edicionDesactualizada).toBe(true); expect(c.puedeGuardar).toBe(false); c.guardar(); expect(api.guardar).not.toHaveBeenCalled(); fixture.destroy();
  });

  it('filters renta when selecting the actual Material option and clears it through the button', () => {
    api.consultar.mockReturnValue(of({...config,reglas:[...config.reglas,{...config.reglas[0],reglaId:4,tipoRenta:'RV'}]}));
    const fixture = TestBed.createComponent(ReglasResponsablesComponent); fixture.detectChanges(); const c = fixture.componentInstance;
    expect(c.reglasFiltradas).toHaveLength(3);
    (fixture.nativeElement.querySelector('mat-select[name="rentaFiltro"]') as HTMLElement).click(); fixture.detectChanges();
    const rf = [...document.querySelectorAll('mat-option')].find(o => o.textContent?.trim() === 'RF') as HTMLElement;
    rf.click(); fixture.detectChanges(); expect(c.rentaFiltro).toBe('RF'); expect(c.reglasFiltradas).toHaveLength(2);
    const clear = [...fixture.nativeElement.querySelectorAll('button')].find((b: HTMLElement) => b.textContent?.trim() === 'Limpiar filtros') as HTMLButtonElement;
    clear.click(); fixture.detectChanges(); expect(c.rentaFiltro).toBe(''); expect(c.reglasFiltradas).toHaveLength(3); fixture.destroy();
  });

});
