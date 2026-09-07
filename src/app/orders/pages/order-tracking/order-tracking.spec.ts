import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';

import { ClientOrder } from '../../models/client-order';
import { ClientOrderTrackingService } from '../../services/client-order-tracking.service';
import { OrderTrackingComponent } from './order-tracking';

describe('OrderTrackingComponent', () => {
  function create(query: Record<string, string> = {}) {
    const orders = signal<ClientOrder[]>(['BVL', 'CANACCORD', 'EUROCLEAR', 'EXTRANJERO'].map(
      (channel, index) => ({
        id: index + 1, clientCode: 'C001', proposalDate: '2026-09-07',
        proposalTime: '10:00:00', operationNumber: '', channel, instrument: 'ABC',
        side: 'Compra', proposedQuantity: 10, executedQuantity: 0, cancelledQuantity: 0,
        pendingQuantity: 10, price: 5, status: 'PENDIENTE',
      }),
    ));
    const navigate = vi.fn().mockResolvedValue(true);
    const component = TestBed.runInInjectionContext(() => new OrderTrackingComponent(
      { orders } as unknown as ClientOrderTrackingService,
      { snapshot: { queryParamMap: convertToParamMap(query) } } as ActivatedRoute,
      { navigate } as unknown as Router,
    ));
    return { component, navigate };
  }

  it('partitions proposals by policy while keeping unclassified proposals in Todas', () => {
    const { component } = create();
    expect(component.channelCount('ALL')).toBe(4);
    expect(component.channels.map(channel => channel.code)).toEqual(['BVL', 'CANACCORD', 'EUROCLEAR']);
    for (const channel of component.channels) {
      component.selectChannel(channel.code);
      expect(component.filteredOrders.map(order => order.channel)).toEqual([channel.code]);
    }
  });

  it('ignores obsolete date and status filters from saved URLs and removes them on search', () => {
    const { component, navigate } = create({ from: '2030-01-01', to: '2030-01-02', status: 'PARCIAL' });
    expect(component.filteredOrders.length).toBe(4);
    component.applyFilters();
    const query = navigate.mock.calls[0][1].queryParams;
    expect(query).not.toHaveProperty('from');
    expect(query).not.toHaveProperty('to');
    expect(query.status).toBeNull();
  });

  it('finds a proposal by its DATAWEB id without an external operation number', () => {
    const { component } = create();
    component.orderNumber = '3';
    component.applyFilters();
    expect(component.filteredOrders.map(order => order.id)).toEqual([3]);
  });
});
