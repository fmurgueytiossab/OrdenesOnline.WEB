import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environments/environment';
import { PropuestaCliente } from '../Model/PropuestaCliente';
import { PropuestaClienteService } from './PropuestaClienteService';

describe('PropuestaClienteService', () => {
  let service: PropuestaClienteService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(PropuestaClienteService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('posts the client proposal to its dedicated endpoint', () => {
    const propuesta: PropuestaCliente = {
      correoCliente: 'fmurgueytio@seminariosab.com.pe',
      cosabcli: '026775',
      tipo: 'Compra',
      tipoOrden: 'Limite',
      cantidad: 100,
      instrumento: 'VOLCACB1',
      precio: 2,
      monto: 200,
      mercado: 'BVL',
      moneda: 'soles',
      vigencia: 'Por hoy : 10/3/2026',
    };

    service.registrar(propuesta).subscribe();

    const request = httpTesting.expectOne(`${environment.apiUrl}/PropuestaCliente`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(propuesta);
    request.flush({});
  });
});
