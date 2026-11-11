import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { RepresentantesConfiguracionService } from './representantes-configuracion.service';
import { environment } from '../../environments/environment';

describe('RepresentantesConfiguracionService', () => {
  let api: RepresentantesConfiguracionService; let http: HttpTestingController;
  beforeEach(() => {TestBed.configureTestingModule({providers: [provideHttpClient(), provideHttpClientTesting()]}); api = TestBed.inject(RepresentantesConfiguracionService); http = TestBed.inject(HttpTestingController);});
  afterEach(() => http.verify());
  it('encodes client and instrument query parameters without trusting a supplied renta', () => {
    api.responsables('000314', 'ABC&X').subscribe();
    const request = http.expectOne(r => r.url.endsWith('/responsables'));
    expect(request.request.params.get('cosabcli')).toBe('000314'); expect(request.request.params.get('instrumento')).toBe('ABC&X');
    expect(request.request.params.has('tipoRenta')).toBe(false);
    request.flush({tipoRenta: 'RV', revision: 'v1', titulares: []});
  });
  it('sends the revision with administrative changes', () => {
    api.guardar({tipo: 'miembro', revision: 'version-1', id: 2, representanteId: 3}).subscribe();
    const request = http.expectOne(`${environment.apiUrl}/Representantes/configuracion/cambios`);
    expect(request.request.method).toBe('POST'); expect(request.request.body.revision).toBe('version-1'); request.flush({revision: 'version-2'});
  });
});
