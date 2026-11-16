import { PortalFeedbackService } from '../../../shared/portal-feedback.service';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { MiDisponibilidadComponent } from './mi-disponibilidad';
import { AusenciasConsulta, RepresentantesAusenciasService } from '../../../services/representantes-ausencias.service';

export const ownAbsences: AusenciasConsulta = {revision: 'r1', hoyLima: '2026-11-11', representanteId: 2, nombre: 'Representante de prueba', disponible: true,
  motivos: [{motivoAusenciaId: 1, nombre: 'Vacaciones'}], representantes: [{representanteId: 2, nombre: 'Representante de prueba'}], ausencias: []};
describe('Mi disponibilidad', () => {
  const api = {mias: vi.fn(), registrar: vi.fn(), cancelar: vi.fn()}; const feedback = {success: vi.fn(), error: vi.fn()};
  beforeEach(() => {
    vi.clearAllMocks(); api.mias.mockReturnValue(of(ownAbsences));
    api.registrar.mockReturnValue(of({...ownAbsences, revision: 'r2', disponible: false})); api.cancelar.mockReturnValue(of({...ownAbsences, revision: 'r3'}));
    TestBed.configureTestingModule({imports: [MiDisponibilidadComponent], providers: [{provide: RepresentantesAusenciasService, useValue: api}, {provide: PortalFeedbackService, useValue: feedback}]});
  });
  it('requires the explanation for Otro and sends it with the absence', () => {
    api.mias.mockReturnValue(of({...ownAbsences, motivos: [{motivoAusenciaId: 2, nombre: 'Otro', codigo: 'OTRO'}]}));
    const fixture = TestBed.createComponent(MiDisponibilidadComponent); fixture.detectChanges();
    fixture.componentInstance.motivoId = 2; fixture.componentInstance.guardar(); expect(api.registrar).not.toHaveBeenCalled();
    fixture.componentInstance.detalle = '  Trámite personal  '; fixture.changeDetectorRef.markForCheck(); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('textarea[matinput]')).not.toBeNull(); fixture.componentInstance.guardar();
    expect(api.registrar).toHaveBeenCalledWith(expect.objectContaining({motivoAusenciaId: 2, detalle: 'Trámite personal'})); fixture.destroy();
  });
  it('uses Material calendars while keeping calendar days unchanged in the API request', () => {
    const fixture = TestBed.createComponent(MiDisponibilidadComponent); fixture.detectChanges(); const component = fixture.componentInstance;
    component.periodo = 'FECHAS'; component.motivoId = 1; component.desdeDate = new Date(2026, 10, 12); component.hastaDate = new Date(2026, 10, 13);
    fixture.changeDetectorRef.markForCheck(); fixture.detectChanges(); expect(fixture.nativeElement.querySelectorAll('mat-datepicker-toggle').length).toBe(2); component.guardar();
    expect(api.registrar).toHaveBeenCalledWith(expect.objectContaining({desde: '2026-11-12', hasta: '2026-11-13'})); fixture.destroy();
  });
  it('asks for cancellation in a modal and calls the API only after confirmation', () => {
    api.mias.mockReturnValue(of({...ownAbsences, ausencias: [{ausenciaId: 4, representanteId: 2, nombre: 'Persona', motivo: 'Otro', detalle: 'Trámite', desdeUtc: '2026-11-11T05:00:00Z', hastaUtc: '2026-11-12T05:00:00Z', estado: 'VIGENTE', puedeCancelar: true, modificadoPorId: 2, fechaModificacionUtc: '2026-11-11T14:00:00Z'}]}));
    const fixture = TestBed.createComponent(MiDisponibilidadComponent); fixture.detectChanges();
    (fixture.nativeElement.querySelector('tbody button') as HTMLButtonElement).click(); fixture.detectChanges();
    expect(api.cancelar).not.toHaveBeenCalled(); expect(fixture.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
    (fixture.nativeElement.querySelector('app-portal-modal button.danger') as HTMLButtonElement).click(); fixture.detectChanges();
    expect(api.cancelar).toHaveBeenCalledWith(4, 'r1'); expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull(); fixture.destroy();
  });
  it('renders self-service and registers today without another user ID or browser-derived dates', () => {
    const fixture = TestBed.createComponent(MiDisponibilidadComponent); fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Mi disponibilidad'); expect(fixture.nativeElement.textContent).toContain('Todavía no tienes ausencias');
    fixture.componentInstance.motivoId = 1; fixture.componentInstance.guardar(); fixture.detectChanges();
    expect(api.registrar).toHaveBeenCalledWith({revision: 'r1', motivoAusenciaId: 1, periodo: 'HOY'});
    expect(fixture.nativeElement.textContent).toContain('No disponible'); expect(feedback.success).toHaveBeenCalled(); expect(fixture.nativeElement.querySelector('.success')).toBeNull(); fixture.destroy();
  });
  it('sends both inclusive range dates and rejects a reversed range before submitting', () => {
    const fixture = TestBed.createComponent(MiDisponibilidadComponent); fixture.detectChanges(); const component = fixture.componentInstance;
    component.motivoId = 1; component.periodo = 'FECHAS'; component.desde = '2026-11-14'; component.hasta = '2026-11-12'; component.guardar();
    expect(api.registrar).not.toHaveBeenCalled(); component.hasta = '2026-11-15'; component.guardar();
    expect(api.registrar).toHaveBeenCalledWith(expect.objectContaining({desde: '2026-11-14', hasta: '2026-11-15'})); fixture.destroy();
  });
  it('surfaces a conflict and preserves the form so the user can refresh and retry', () => {
    api.registrar.mockReturnValue(throwError(() => ({status: 409, error: {title: 'Ya existe una ausencia para esas fechas.'}})));
    const fixture = TestBed.createComponent(MiDisponibilidadComponent); fixture.detectChanges(); fixture.componentInstance.motivoId = 1; fixture.componentInstance.guardar(); fixture.detectChanges();
    expect(feedback.error).toHaveBeenCalledWith('Ya existe una ausencia para esas fechas.'); expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull(); expect(fixture.componentInstance.busy).toBe(false); expect(fixture.componentInstance.motivoId).toBe(1); fixture.destroy();
  });
  it('displays the inclusive last day and cancels using the current revision', () => {
    api.mias.mockReturnValue(of({...ownAbsences, disponible: false, ausencias: [{ausenciaId: 4, representanteId: 2, nombre: ownAbsences.nombre, motivo: 'Vacaciones', desdeUtc: '2026-11-11T05:00:00Z', hastaUtc: '2026-11-12T05:00:00Z', estado: 'VIGENTE', puedeCancelar: true, modificadoPorId: 2, fechaModificacionUtc: '2026-11-11T14:00:00Z'}]}));
    const fixture = TestBed.createComponent(MiDisponibilidadComponent); fixture.detectChanges();
    const cells = [...fixture.nativeElement.querySelectorAll('tbody td')].map((x: Element) => x.textContent?.trim()); expect(cells[1]).toBe('11/11/2026 00:00:00'); expect(cells[2]).toBe('11/11/2026');
    fixture.componentInstance.cancelar(4); expect(api.cancelar).toHaveBeenCalledWith(4, 'r1'); fixture.destroy();
  });
});
