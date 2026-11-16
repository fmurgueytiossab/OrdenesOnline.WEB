import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RepresentantesAusenciasService } from './representantes-ausencias.service';
import { environment } from '../../environments/environment';

describe('Ausencias API contracts', () => {
  let service: RepresentantesAusenciasService; let http: HttpTestingController;
  beforeEach(() => {TestBed.configureTestingModule({providers: [provideHttpClient(), provideHttpClientTesting()]}); service = TestBed.inject(RepresentantesAusenciasService); http = TestBed.inject(HttpTestingController);});
  afterEach(() => http.verify());
  it('uses authenticated own endpoints without sending an editable representative ID', () => {
    service.registrar({revision: 'r1', motivoAusenciaId: 2, periodo: 'HOY'}).subscribe();
    const request = http.expectOne(`${environment.apiUrl}/Representantes/ausencias/mias`);
    expect(request.request.method).toBe('POST'); expect(request.request.body.representanteId).toBeUndefined(); request.flush({});
    service.cancelar(7, 'r2').subscribe();
    const cancel = http.expectOne(`${environment.apiUrl}/Representantes/ausencias/mias/7/cancelar`);
    expect(cancel.request.body).toEqual({revision: 'r2'}); cancel.flush({});
  });
  it('sends inclusive calendar filters for the administrative register', () => {
    service.registro({representanteId: 3, desde: '2026-11-11', hasta: '2026-11-15', estado: 'VIGENTE'}).subscribe();
    const request = http.expectOne(r => r.url.endsWith('/Representantes/ausencias'));
    expect(request.request.params.get('representanteId')).toBe('3'); expect(request.request.params.get('hasta')).toBe('2026-11-15'); expect(request.request.params.get('estado')).toBe('VIGENTE'); request.flush({});
  });
});
