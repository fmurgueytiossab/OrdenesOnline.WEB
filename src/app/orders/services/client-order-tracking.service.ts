import { Injectable, signal } from '@angular/core';

import { ClientOrder } from '../models/client-order';

const MOCK_ORDERS: ClientOrder[] = [
  {
    id: 'ORD-000198',
    submittedAt: '2026-08-13T09:42:00-05:00',
    updatedAt: '2026-08-13T10:15:00-05:00',
    clientName: 'Cliente de prueba',
    clientCode: 'CLI-MOCK-001',
    channel: 'BVL',
    instrument: 'CREDICORC1',
    side: 'Compra',
    quantity: 120,
    orderType: 'Límite',
    price: 145.8,
    currency: 'PEN',
    validity: 'Por hoy',
    status: 'EN_PROCESO',
    sourceOrderId: 'ORD-000152',
  },
  {
    id: 'ORD-000197',
    submittedAt: '2026-08-12T15:20:00-05:00',
    updatedAt: '2026-08-12T15:47:00-05:00',
    clientName: 'Cliente de prueba',
    clientCode: 'CLI-MOCK-001',
    channel: 'CANACCORD',
    instrument: 'AAPL',
    side: 'Compra',
    quantity: 15,
    orderType: 'Mercado',
    price: null,
    currency: 'USD',
    validity: 'Por hoy',
    status: 'EJECUTADA',
  },
  {
    id: 'ORD-000194',
    submittedAt: '2026-08-11T11:05:00-05:00',
    updatedAt: '2026-08-11T11:05:00-05:00',
    clientName: 'Cliente de prueba',
    clientCode: 'CLI-MOCK-001',
    channel: 'PERSHING',
    instrument: 'MSFT',
    side: 'Venta',
    quantity: 8,
    orderType: 'Límite',
    price: 518.25,
    currency: 'USD',
    validity: 'Permanente',
    status: 'PENDIENTE',
  },
  {
    id: 'ORD-000191',
    submittedAt: '2026-08-08T13:32:00-05:00',
    updatedAt: '2026-08-08T14:10:00-05:00',
    clientName: 'Cliente de prueba',
    clientCode: 'CLI-MOCK-001',
    channel: 'RENTA4',
    instrument: 'FERREYC1',
    side: 'Compra',
    quantity: 300,
    orderType: 'Límite',
    price: 2.91,
    currency: 'PEN',
    validity: 'Por hoy',
    status: 'RECHAZADA',
  },
  {
    id: 'ORD-000184',
    submittedAt: '2026-08-04T10:10:00-05:00',
    updatedAt: '2026-08-04T10:52:00-05:00',
    clientName: 'Cliente de prueba',
    clientCode: 'CLI-MOCK-001',
    channel: 'BVL',
    instrument: 'VOLCABC1',
    side: 'Venta',
    quantity: 1000,
    orderType: 'Mercado',
    price: null,
    currency: 'PEN',
    validity: 'Por hoy',
    status: 'ANULADA',
    cancellationReason: 'El cliente decidió cambiar la cantidad.',
    cancelledAt: '2026-08-04T10:52:00-05:00',
    cancelledBy: 'Cliente de prueba',
  },
  {
    id: 'ORD-000179',
    submittedAt: '2026-07-30T12:18:00-05:00',
    updatedAt: '2026-07-30T12:55:00-05:00',
    clientName: 'Cliente de prueba',
    clientCode: 'CLI-MOCK-001',
    channel: 'CANACCORD',
    instrument: 'NVDA',
    side: 'Compra',
    quantity: 20,
    orderType: 'Límite',
    price: 176.4,
    currency: 'USD',
    validity: 'Permanente',
    status: 'EJECUTADA',
  },
];

@Injectable({ providedIn: 'root' })
export class ClientOrderTrackingService {
  private readonly orderState = signal<ClientOrder[]>(MOCK_ORDERS.map((order) => ({ ...order })));

  readonly orders = this.orderState.asReadonly();

  getById(id: string): ClientOrder | undefined {
    return this.orderState().find((order) => order.id === id);
  }

  annul(id: string, reason: string): boolean {
    const order = this.getById(id);
    if (!order || !this.canAnnul(order)) return false;

    const cancelledAt = new Date().toISOString();

    this.orderState.update((orders) =>
      orders.map((current) =>
        current.id === id
          ? {
              ...current,
              status: 'ANULADA',
              cancellationReason: reason.trim(),
              cancelledAt,
              cancelledBy: 'Cliente autenticado',
              updatedAt: cancelledAt,
            }
          : current,
      ),
    );
    return true;
  }

  canAnnul(order: ClientOrder): boolean {
    return order.status === 'PENDIENTE' || order.status === 'EN_PROCESO';
  }
}
