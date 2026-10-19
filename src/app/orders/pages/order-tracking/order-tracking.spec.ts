import { ChangeDetectorRef, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';

import { ClientOrder } from '../../models/client-order';
import { ClientOrderTrackingService } from '../../services/client-order-tracking.service';
import { OrderTrackingComponent } from './order-tracking';

describe('OrderTrackingComponent', () => {
  function createState() {
    const orders = signal<ClientOrder[]>(['BVL', 'CANACCORD', 'EUROCLEAR', 'EXTRANJERO'].map(
      (channel, index) => ({
        id: index + 1, clientCode: 'C001', proposalDate: '2026-09-07',
        proposalTime: '10:00:00', operationNumber: '', channel, instrument: 'ABC',
        side: 'Compra', proposedQuantity: 10, executedQuantity: 0, cancelledQuantity: 0,
        pendingQuantity: 10, price: 5, status: 'PENDIENTE',
      }),
    ));
    const navigate = vi.fn().mockResolvedValue(true);
    const markEntered = vi.fn().mockImplementation((id: number) => {
      orders.update(items => items.map(order => order.id === id
        ? { ...order, status: 'INGRESADO', canMarkEntered: false } : order));
      return of({ propuestaId: id, estado: 'INGRESADO' });
    });
    const loadOrders = vi.fn().mockReturnValue(of([]));
    const tracking = { orders, markEntered, loadOrders, lastUpdatedAt: () => null };
    return { orders, markEntered, loadOrders, tracking, navigate };
  }

  function create(query: Record<string, string> = {}) {
    TestBed.configureTestingModule({ providers: [
      { provide: ChangeDetectorRef, useValue: { markForCheck: vi.fn() } },
    ] });
    const { orders, markEntered, loadOrders, tracking, navigate } = createState();
    const component = TestBed.runInInjectionContext(() => new OrderTrackingComponent(
      tracking as unknown as ClientOrderTrackingService,
      { snapshot: { queryParamMap: convertToParamMap(query) } } as ActivatedRoute,
      { navigate } as unknown as Router,
    ));
    return { component, navigate, orders, markEntered, loadOrders, tracking };
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

  it('prioritizes states before pagination and reorders immediately after entry without mutating the source', () => {
    const { component, orders } = create();
    const base = orders()[0];
    orders.set([
      { ...base, id: 1, status: 'INGRESADO', proposalTime: '12:00:00' },
      { ...base, id: 2, status: 'CANCELADO', proposalTime: '11:00:00' },
      { ...base, id: 3, status: 'FIRMADO', canMarkEntered: true, proposalTime: '10:00:00' },
      { ...base, id: 4, status: 'ENVIADO', proposalTime: '08:00:00' },
      { ...base, id: 5, status: 'ENVIADO', proposalTime: '09:00:00' },
      { ...base, id: 6, status: 'PENDIENTE', proposalTime: '12:00:00' },
      { ...base, id: 7, status: 'ENVIADO', proposalTime: '09:00:00' },
      ...[8, 9, 10, 11].map(id => ({ ...base, id, status: 'INGRESADO' as const, proposalTime: '07:00:00' })),
    ]);
    expect(component.filteredOrders.map(o => o.id)).toEqual([7, 5, 4, 3, 2, 6, 1, 11, 10, 9, 8]);
    expect(component.visibleOrders.map(o => o.id)).toEqual([7, 5, 4, 3, 2, 6, 1, 11, 10, 9]);
    expect(orders().map(o => o.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
    component.markEntered(orders()[2]);
    expect(component.filteredOrders.map(o => o.id)).toEqual([7, 5, 4, 2, 6, 1, 3, 11, 10, 9, 8]);
    component.currentPage = 2;
    expect(component.visibleOrders.map(o => o.id)).toEqual([8]);
  });

  it('only marks a signed and authorized order, and clamps the filtered page after success', () => {
    const { component, orders, markEntered } = create();
    for (const order of orders()) component.markEntered(order);
    component.markEntered({ ...orders()[0], status: 'CANCELADO', canMarkEntered: true });
    expect(markEntered).not.toHaveBeenCalled();
    const signed: ClientOrder = { ...orders()[0], status: 'FIRMADO', canMarkEntered: true };
    orders.set([signed]);
    component.selectedStatus = 'FIRMADO';
    component.selectedOrder = signed;
    component.currentPage = 2;
    component.markEntered(signed);
    expect(markEntered).toHaveBeenCalledExactlyOnceWith(signed.id);
    expect(component.selectedOrder?.status).toBe('INGRESADO');
    expect(component.actionSuccess).toContain('#1');
    expect(component.currentPage).toBe(1);
    expect(component.filteredOrders).toEqual([]);
  });

  it('blocks duplicate requests and polling while entry is being saved', () => {
    const { component, orders, markEntered, loadOrders } = create();
    const pending = new Subject();
    markEntered.mockReturnValue(pending);
    const signed: ClientOrder = { ...orders()[0], status: 'FIRMADO', canMarkEntered: true };
    component.markEntered(signed);
    component.markEntered(signed);
    component.refreshOrders();
    expect(markEntered).toHaveBeenCalledOnce();
    expect(loadOrders).not.toHaveBeenCalled();
    expect(component.updatingOrderId).toBe(1);
    pending.complete();
    expect(component.updatingOrderId).toBeNull();
  });

  it('shows a conflict and refreshes the state without claiming success', () => {
    const { component, orders, markEntered, loadOrders } = create();
    markEntered.mockReturnValue(throwError(() => ({ status: 409, error: { detail: 'Faltan firmas.' } })));
    component.markEntered({ ...orders()[0], status: 'FIRMADO', canMarkEntered: true });
    expect(component.actionError).toBe('Faltan firmas.');
    expect(component.actionSuccess).toBe('');
    expect(component.updatingOrderId).toBeNull();
    expect(loadOrders).toHaveBeenCalledOnce();
  });

  it('renders the action only for signed orders with permission', async () => {
    const { orders, tracking } = createState();
    orders.set([
      { ...orders()[0], status: 'ENVIADO', canMarkEntered: false },
      { ...orders()[1], status: 'FIRMADO', canMarkEntered: true },
      { ...orders()[2], status: 'FIRMADO', canMarkEntered: false },
      { ...orders()[3], status: 'INGRESADO', canMarkEntered: false },
      { ...orders()[0], id: 5, status: 'CANCELADO', canMarkEntered: false },
    ]);
    await TestBed.configureTestingModule({
      imports: [OrderTrackingComponent],
      providers: [
        { provide: ClientOrderTrackingService, useValue: tracking },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({}) } } },
        { provide: Router, useValue: { navigate: vi.fn().mockResolvedValue(true) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(OrderTrackingComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.statuses.map(([status]) => status)).not.toContain('ACEPTADO');
    const buttons = fixture.nativeElement.querySelectorAll('.enter-button');
    expect(buttons.length).toBe(1);
    expect(buttons[0].getAttribute('aria-label')).toContain('2');
    const cancelledRow = fixture.nativeElement.querySelector('[data-status="CANCELADO"]').closest('tr');
    expect(cancelledRow.querySelector('.status').textContent).toContain('Cancelado');
    expect(cancelledRow.querySelector('[data-label="Acción"]').textContent).toContain('Proceso finalizado');
    expect(cancelledRow.querySelector('button')).toBeTruthy(); // Conserva el acceso al detalle.
    expect(cancelledRow.querySelector('.enter-button')).toBeNull();
    const response = new Subject();
    tracking.markEntered.mockReturnValue(response);
    buttons[0].click();
    await fixture.whenStable();
    expect(buttons[0].disabled).toBe(true);
    response.error({ status: 500, error: { detail: 'No se pudo guardar.' } });
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('No se pudo guardar.');
    expect(buttons[0].disabled).toBe(false);
    fixture.destroy();
  });
});
