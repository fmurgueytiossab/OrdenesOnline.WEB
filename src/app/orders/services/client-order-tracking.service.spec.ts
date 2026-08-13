import { TestBed } from '@angular/core/testing';

import { ClientOrderTrackingService } from './client-order-tracking.service';

describe('ClientOrderTrackingService', () => {
  let service: ClientOrderTrackingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClientOrderTrackingService);
  });

  it('annuls an active order and stores its reason', () => {
    expect(service.annul('ORD-000194', 'El cliente cambió su estrategia')).toBe(true);

    const order = service.getById('ORD-000194');
    expect(order?.status).toBe('ANULADA');
    expect(order?.cancellationReason).toBe('El cliente cambió su estrategia');
    expect(order?.cancelledBy).toBe('Cliente autenticado');
    expect(order?.cancelledAt).toBeTruthy();
  });

  it('does not annul a completed order', () => {
    expect(service.annul('ORD-000197', 'Ya no deseo la operación')).toBe(false);
    expect(service.getById('ORD-000197')?.status).toBe('EJECUTADA');
  });
});
