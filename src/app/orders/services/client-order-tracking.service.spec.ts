import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { environment } from '../../../environments/environment';
import { TrackingItemResponse } from '../models/client-order';
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

  it('loads tracking and maps the API contract to the table model', () => {
    let result = service.orders();

    service.loadOrders().subscribe((orders) => (result = orders));

    const request = httpTesting.expectOne(
      `${environment.apiUrl}/PropuestaCliente/seguimiento?page=1&pageSize=100`,
    );
    expect(request.request.method).toBe('GET');
    request.flush({
      items: [trackingItem()],
      page: 1,
      pageSize: 100,
      totalCount: 1,
      lastUpdatedAt: '2026-09-04T15:30:00Z',
    });

    expect(result).toEqual([
      expect.objectContaining({
        id: 41,
        clientCode: 'C001',
        operationNumber: '9001',
        channel: 'BVL',
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

  it('maps Canaccord and Viewtrade into their tracking tabs', () => {
    service.loadOrders().subscribe();

    const request = httpTesting.expectOne(
      `${environment.apiUrl}/PropuestaCliente/seguimiento?page=1&pageSize=100`,
    );
    request.flush({
      items: [
        { ...trackingItem(), codigoOrden: 42, numeroOperacion: 'CAN-1', mercado: 'CANACCORD' },
        { ...trackingItem(), codigoOrden: 43, numeroOperacion: 'VIE-1', mercado: 'VIEWTRADE' },
      ],
      page: 1,
      pageSize: 100,
      totalCount: 2,
      lastUpdatedAt: '2026-09-04T15:30:00Z',
    });

    expect(service.orders().map((order) => order.channel)).toEqual([
      'CANACCORD',
      'VIEWTRADE',
    ]);
  });

  it('requests every API page when there are more than 100 tracked orders', () => {
    service.loadOrders().subscribe();

    httpTesting.expectOne(
      `${environment.apiUrl}/PropuestaCliente/seguimiento?page=1&pageSize=100`,
    ).flush({
      items: [trackingItem()],
      page: 1,
      pageSize: 100,
      totalCount: 101,
      lastUpdatedAt: '2026-09-04T15:30:00Z',
    });

    httpTesting.expectOne(
      `${environment.apiUrl}/PropuestaCliente/seguimiento?page=2&pageSize=100`,
    ).flush({
      items: [{ ...trackingItem(), codigoOrden: 42, numeroOperacion: '9002' }],
      page: 2,
      pageSize: 100,
      totalCount: 101,
      lastUpdatedAt: '2026-09-04T15:31:00Z',
    });

    expect(service.orders().map((order) => order.id)).toEqual([41, 42]);
  });

  function trackingItem(): TrackingItemResponse {
    return {
      codigoOrden: 41,
      cosabcli: ' C001 ',
      fechaPropuesta: '2026-09-04',
      horaPropuesta: '10:30:00',
      numeroOperacion: ' 9001 ',
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
