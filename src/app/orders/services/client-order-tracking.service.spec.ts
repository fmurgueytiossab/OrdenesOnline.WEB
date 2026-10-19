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
        executedQuantity: 0,
        pendingQuantity: 100,
        status: 'PENDIENTE',
      }),
    ]);
    expect(service.orders()).toEqual(result);
    expect(service.lastUpdatedAt()).toBe('2026-09-04T15:30:00Z');
    expect(service.getById('9001')?.id).toBe(41);
  });

  it('maps Canaccord and Euroclear into their tracking tabs', () => {
    service.loadOrders().subscribe();

    const request = httpTesting.expectOne(
      `${environment.apiUrl}/PropuestaCliente/seguimiento?page=1&pageSize=100`,
    );
    request.flush({
      items: [
        { ...trackingItem(), codigoOrden: 42, numeroOperacion: 'CAN-1', mercado: 'CANACCORD' },
        { ...trackingItem(), codigoOrden: 43, numeroOperacion: 'EUR-1', mercado: 'EUROCLEAR' },
      ],
      page: 1,
      pageSize: 100,
      totalCount: 2,
      lastUpdatedAt: '2026-09-04T15:30:00Z',
    });

    expect(service.orders().map((order) => order.channel)).toEqual([
      'CANACCORD',
      'EUROCLEAR',
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

  it('preserves signature states and requires the API permission before enabling entry', () => {
    service.loadOrders().subscribe();
    httpTesting.expectOne(`${environment.apiUrl}/PropuestaCliente/seguimiento?page=1&pageSize=100`).flush({
      items: ['ENVIADO', 'FIRMADO', 'FIRMADO', 'INGRESADO', 'CANCELADO', 'ACEPTADO', 'OTRO'].map((estado, i) => ({
        ...trackingItem(), codigoOrden: i + 1, estado, puedeMarcarIngresado: i !== 2,
      })), page: 1, pageSize: 100, totalCount: 7, lastUpdatedAt: '2026-10-19T15:00:00Z',
    });
    expect(service.orders().map(o => o.status)).toEqual([
      'ENVIADO', 'FIRMADO', 'FIRMADO', 'INGRESADO', 'CANCELADO', 'PENDIENTE', 'DESCONOCIDO',
    ]);
    expect(service.orders().filter(o => o.canMarkEntered).map(o => o.id)).toEqual([2]);
  });

  it('updates the local state only after entry is persisted and keeps it on failure', () => {
    service.loadOrders().subscribe();
    httpTesting.expectOne(`${environment.apiUrl}/PropuestaCliente/seguimiento?page=1&pageSize=100`).flush({
      items: [{ ...trackingItem(), estado: 'FIRMADO', puedeMarcarIngresado: true }],
      page: 1, pageSize: 100, totalCount: 1, lastUpdatedAt: '2026-10-19T15:00:00Z',
    });
    service.markEntered(41).subscribe({ error: () => {} });
    const failed = httpTesting.expectOne(`${environment.apiUrl}/PropuestaCliente/41/ingresado`);
    expect(failed.request.method).toBe('POST');
    expect(service.orders()[0].status).toBe('FIRMADO');
    failed.flush({}, { status: 409, statusText: 'Conflict' });
    expect(service.orders()[0].status).toBe('FIRMADO');

    service.markEntered(41).subscribe();
    httpTesting.expectOne(`${environment.apiUrl}/PropuestaCliente/41/ingresado`)
      .flush({ propuestaId: 41, estado: 'INGRESADO' });
    expect(service.orders()[0]).toMatchObject({ status: 'INGRESADO', canMarkEntered: false });
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
      cantidadEjecutada: 0,
      cantidadAnulada: 0,
      cantidadPendiente: 100,
      precio: 12.5,
      estado: 'PENDIENTE',
      mercado: 'BVL',
    };
  }
});
