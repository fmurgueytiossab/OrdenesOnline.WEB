import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { BvlTrackingItemResponse } from '../models/client-order';
import { ClientOrderTrackingService } from './client-order-tracking.service';

describe('ClientOrderTrackingService', () => {
  let service: ClientOrderTrackingService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ClientOrderTrackingService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpTesting.verify());

  it('loads BVL tracking and maps the API contract to the table model', () => {
    let result = service.orders();

    service.loadBvlOrders().subscribe((orders) => (result = orders));

    const request = httpTesting.expectOne(
      `${environment.apiUrl}/PropuestaCliente/seguimiento/bvl?page=1&pageSize=100`,
    );
    expect(request.request.method).toBe('GET');
    request.flush({
      items: [bvlItem()],
      page: 1,
      pageSize: 100,
      totalCount: 1,
      lastUpdatedAt: '2026-09-04T15:30:00Z',
    });

    expect(result).toEqual([
      expect.objectContaining({
        id: 41,
        clientCode: 'C001',
        bvlProposalNumber: '9001',
        side: 'Compra',
        proposedQuantity: 100,
        executedQuantity: 20,
        pendingQuantity: 80,
        status: 'PARCIAL',
      }),
    ]);
    expect(service.orders()).toEqual(result);
    expect(service.lastUpdatedAt()).toBe('2026-09-04T15:30:00Z');
    expect(service.getById('9001')?.id).toBe(41);
  });

  it('requests every API page when there are more than 100 BVL orders', () => {
    service.loadBvlOrders().subscribe();

    httpTesting.expectOne(
      `${environment.apiUrl}/PropuestaCliente/seguimiento/bvl?page=1&pageSize=100`,
    ).flush({
      items: [bvlItem()],
      page: 1,
      pageSize: 100,
      totalCount: 101,
      lastUpdatedAt: '2026-09-04T15:30:00Z',
    });

    httpTesting.expectOne(
      `${environment.apiUrl}/PropuestaCliente/seguimiento/bvl?page=2&pageSize=100`,
    ).flush({
      items: [{ ...bvlItem(), codigoOrden: 42, numeroPropuestaBvl: '9002' }],
      page: 2,
      pageSize: 100,
      totalCount: 101,
      lastUpdatedAt: '2026-09-04T15:31:00Z',
    });

    expect(service.orders().map((order) => order.id)).toEqual([41, 42]);
  });

  function bvlItem(): BvlTrackingItemResponse {
    return {
      codigoOrden: 41,
      cosabcli: ' C001 ',
      fechaPropuesta: '2026-09-04',
      horaPropuesta: '10:30:00',
      numeroPropuestaBvl: ' 9001 ',
      instrumento: ' ABC ',
      tipo: 'C',
      cantidadPropuesta: 100,
      cantidadEjecutada: 20,
      cantidadAnulada: 0,
      cantidadPendiente: 80,
      precio: 12.5,
      estado: 'PARCIAL',
      mercado: 'BVL',
    };
  }
});
