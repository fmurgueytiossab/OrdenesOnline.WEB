import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ReglasResponsablesService } from './reglas-responsables.service';
import { environment } from '../../environments/environment';

describe('Administrative responsible rules API', () => {
  let api: ReglasResponsablesService; let http: HttpTestingController;
  beforeEach(() => {TestBed.configureTestingModule({providers: [provideHttpClient(), provideHttpClientTesting()]}); api = TestBed.inject(ReglasResponsablesService); http = TestBed.inject(HttpTestingController);});
  afterEach(() => http.verify());
  it('addresses the exact owner, rent and action and sends the revision with the allowed list', () => {
    api.guardar(2, 'RF', 'ENVIO_OPERACION', {revision: 'r1', modoResolucion: 'LISTA', opciones: [3, 4], activo: true}).subscribe();
    const request = http.expectOne(`${environment.apiUrl}/Representantes/reglas-responsables/2/RF/ENVIO_OPERACION`);
    expect(request.request.method).toBe('POST'); expect(request.request.body).toEqual({revision: 'r1', modoResolucion: 'LISTA', opciones: [3, 4], activo: true}); request.flush({});
  });
  it('sends no list options when using the owner', () => {
    api.guardar(2, 'RV', 'ENVIO_ORDEN', {revision: 'r2', modoResolucion: 'TITULAR', opciones: [], activo: true}).subscribe();
    const request = http.expectOne(`${environment.apiUrl}/Representantes/reglas-responsables/2/RV/ENVIO_ORDEN`); expect(request.request.body.opciones).toEqual([]); request.flush({});
  });
});
