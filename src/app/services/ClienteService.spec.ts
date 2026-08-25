import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../environments/environment';
import { ClienteService } from './ClienteService';

describe('ClienteService', () => {
  let service: ClienteService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ClienteService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('searches clients with the expected query parameters', () => {
    service.buscar('  murgueytio  ', 20).subscribe((clients) => {
      expect(clients[0]?.nombreCompleto).toBe('Fernando Murgueytio');
    });

    const request = httpTesting.expectOne(
      `${environment.apiUrl}/Cliente/buscar?q=murgueytio&limit=20`,
    );
    expect(request.request.method).toBe('GET');
    request.flush([
      {
        cosabcli: '026775',
        nombreCompleto: 'Fernando Murgueytio',
        emails: ['fernando@example.com'],
        nucel: ['999999999'],
        bloqueoMotivo: null,
      },
    ]);
  });
});
