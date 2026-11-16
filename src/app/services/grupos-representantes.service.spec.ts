import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { GruposRepresentantesService } from './grupos-representantes.service';
import { environment } from '../../environments/environment';

describe('Administrative groups API', () => {
  let api: GruposRepresentantesService; let http: HttpTestingController;
  beforeEach(() => {TestBed.configureTestingModule({providers: [provideHttpClient(), provideHttpClientTesting()]}); api = TestBed.inject(GruposRepresentantesService); http = TestBed.inject(HttpTestingController);});
  afterEach(() => http.verify());
  it('creates and edits groups with the loaded revision and global consultation flag', () => {
    const body = {revision: 'r1', nombre: 'Master', grupoPadreId: null, activo: true, puedeConsultarTodosClientes: true};
    api.guardar(0, body).subscribe(); const create = http.expectOne(`${environment.apiUrl}/Representantes/grupos`); expect(create.request.method).toBe('POST'); create.flush({});
    api.guardar(7, body).subscribe(); const edit = http.expectOne(`${environment.apiUrl}/Representantes/grupos/7`); expect(edit.request.method).toBe('POST'); expect(edit.request.body.puedeConsultarTodosClientes).toBe(true); edit.flush({});
  });
  it('addresses membership by both group and user and preserves its descendant scope', () => {
    api.miembro(7, 9, {revision: 'r2', activo: true, incluyeDescendientes: true}).subscribe();
    const request = http.expectOne(`${environment.apiUrl}/Representantes/grupos/7/miembros/9`); expect(request.request.method).toBe('POST'); expect(request.request.body).toEqual({revision: 'r2', activo: true, incluyeDescendientes: true}); request.flush({});
  });
});
