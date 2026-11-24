import { PortalFeedbackService } from '../../../shared/portal-feedback.service';
import { ChangeDetectorRef, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';

import { ClientOrder } from '../../models/client-order';
import { ClientOrderTrackingService } from '../../services/client-order-tracking.service';
import { OrderTrackingComponent } from './order-tracking';

describe('OrderTrackingComponent', () => {
  const feedback = {success: vi.fn(), error: vi.fn()};
  beforeEach(() => {feedback.success.mockClear(); feedback.error.mockClear(); TestBed.configureTestingModule({providers: [{provide: PortalFeedbackService, useValue: feedback}]});});
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
    const cancelOrder = vi.fn().mockImplementation((id: number) => {
      orders.update(items => items.map(order => order.id === id
        ? { ...order, status: 'CANCELADO', canMarkEntered: false, canceledByName: 'Lorena' } : order));
      return of({ propuestaId: id, estado: 'CANCELADO' });
    });
    const tracking = { orders, markEntered, cancelOrder, loadOrders, lastUpdatedAt: () => null };
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

  it('shows the creator waiting for Miguel, allows only the assigned executor and identifies who entered it', async () => {
    const { orders, tracking } = createState();
    orders.set([
      {...orders()[0], id: 1, status: 'FIRMADO', operationResponsible: 'Miguel', canMarkEntered: false},
      {...orders()[0], id: 2, status: 'FIRMADO', operationResponsible: 'Miguel', canMarkEntered: true},
      {...orders()[0], id: 3, status: 'INGRESADO', operationResponsible: 'Miguel', canMarkEntered: false,
        creatorName: 'Fernando', orderResponsible: 'Lorena',
        enteredByName: 'Miguel', enteredAt: '2026-11-16T17:20:00Z'},
    ]);
    await TestBed.configureTestingModule({imports: [OrderTrackingComponent],providers: [
      {provide: ClientOrderTrackingService,useValue: tracking},
      {provide: ActivatedRoute,useValue: {snapshot:{queryParamMap:convertToParamMap({})}}},
      {provide: Router,useValue:{navigate:vi.fn().mockResolvedValue(true)}},
    ]}).compileComponents();
    const fixture=TestBed.createComponent(OrderTrackingComponent);fixture.detectChanges();
    const rows=[...fixture.nativeElement.querySelectorAll('tbody tr')] as HTMLElement[];
    const waiting=rows.find(row=>row.textContent?.includes('Esperando ingreso por Miguel'))!;
    expect(waiting.querySelector('.order-actions-dropdown .portal-dropdown-trigger')).toBeNull();
    expect(waiting.querySelector('[data-label="Estado"] .status-detail')?.textContent)
      .toContain('Esperando ingreso por Miguel');
    expect(fixture.nativeElement.querySelectorAll('.order-actions-dropdown .portal-dropdown-trigger')).toHaveLength(1);
    expect(fixture.nativeElement.textContent).toContain('Ingresado por Miguel');
    fixture.componentInstance.markEntered(orders()[0]);expect(tracking.markEntered).not.toHaveBeenCalled();
    const enteredRow=fixture.nativeElement.querySelector('[data-status="INGRESADO"]').closest('tr');
    enteredRow.querySelector('button').click();await fixture.whenStable();
    const detail = fixture.nativeElement.querySelector('app-portal-modal [role="dialog"]') as HTMLElement;
    const roles = new Map(Array.from(detail.querySelectorAll('#detail-roles-heading + dl > div'), field => [
      field.querySelector('dt')?.textContent?.trim(),
      field.querySelector('dd')?.textContent?.trim(),
    ]));
    expect(roles.get('Creada por')).toBe('Fernando');
    expect(roles.get('Responsable del envío a firma')).toBe('Lorena');
    expect(roles.get('Responsable de ejecución e ingreso')).toBe('Miguel');
    expect(roles.get('Ingresada por')).toContain('Miguel');
    expect(detail.querySelector('time')?.textContent).toContain('16/11/2026, 12:20');
    expect(detail.textContent).toContain('Cantidad propuesta');
    expect(detail.textContent).not.toMatch(/Cantidad (ejecutada|anulada|pendiente)/);
    fixture.destroy();
  });

  it('opens the action panel outside the table and asks for confirmation before canceling', async () => {
    const { orders, tracking } = createState();
    orders.update(([allowed, entered, unauthorized]) => [
      { ...allowed, status: 'FIRMADO', canMarkEntered: true, canCancel: true },
      { ...entered, status: 'INGRESADO', canCancel: true, enteredByName: 'Miguel',
        enteredById: 3, enteredAt: '2026-11-24T15:00:00Z' },
      { ...unauthorized, status: 'FIRMADO', canCancel: false },
    ]);
    await TestBed.configureTestingModule({imports: [OrderTrackingComponent], providers: [
      {provide: ClientOrderTrackingService, useValue: tracking},
      {provide: ActivatedRoute, useValue: {snapshot: {queryParamMap: convertToParamMap({})}}},
      {provide: Router, useValue: {navigate: vi.fn().mockResolvedValue(true)}},
    ]}).compileComponents();
    const fixture = TestBed.createComponent(OrderTrackingComponent);
    fixture.detectChanges();
    const page = fixture.nativeElement as HTMLElement;
    expect(page.querySelector('input[name="orderNumber"]')?.getAttribute('placeholder')).toBe('Ej. 1654');
    const filterActions = page.querySelector('.filter-actions')!;
    expect(filterActions.children[0].textContent).toContain('Buscar');
    expect(filterActions.children[1].classList.contains('filter-action-divider')).toBe(true);
    expect(filterActions.children[2].textContent).toContain('Limpiar filtros');
    expect(fixture.componentInstance.statuses.map(([status]) => status)).toEqual([
      'PENDIENTE', 'ENVIADO', 'FIRMADO', 'INGRESADO', 'CANCELADO',
    ]);
    const signedTrigger = page.querySelector<HTMLButtonElement>('[aria-label="Acciones de la orden #1"]')!;
    const enteredTrigger = page.querySelector<HTMLButtonElement>('[aria-label="Acciones de la orden #2"]')!;
    expect(page.querySelectorAll('td[data-label="Acción"] app-portal-dropdown')).toHaveLength(2);
    expect(signedTrigger.getAttribute('aria-expanded')).toBe('false');
    signedTrigger.click();
    fixture.detectChanges();
    const signedMenu = document.getElementById(signedTrigger.getAttribute('aria-controls')!)!;
    expect(signedMenu.closest('tr')).toBeNull();
    const signedActions = Array.from(signedMenu.querySelectorAll('button'), button => button.textContent?.trim());
    expect(signedActions).toEqual(['Marcar ingresada', 'Cancelar orden']);
    const entryAction = signedMenu.querySelector('button')!;
    entryAction.focus();
    entryAction.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    fixture.detectChanges();
    expect(signedTrigger.getAttribute('aria-expanded')).toBe('false');
    expect(document.activeElement).toBe(signedTrigger);
    expect(page.querySelector('[aria-label="Acciones de la orden #3"]')).toBeNull();
    fixture.componentInstance.requestCancellation(orders().find(order => order.id === 3)!);
    fixture.detectChanges();
    expect(page.querySelector('.confirm-cancellation')).toBeNull();
    fixture.componentInstance.loading = true;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    enteredTrigger.click();
    fixture.detectChanges();
    expect(enteredTrigger.getAttribute('aria-expanded')).toBe('true');
    const enteredMenu = document.getElementById(enteredTrigger.getAttribute('aria-controls')!)!;
    const [cancelAction] = enteredMenu.querySelectorAll('button');
    expect(enteredMenu.querySelectorAll('button')).toHaveLength(1);
    expect(cancelAction.textContent?.trim()).toBe('Cancelar orden');
    expect(cancelAction.disabled).toBe(false);
    cancelAction.click();
    fixture.detectChanges();
    expect(enteredTrigger.getAttribute('aria-expanded')).toBe('false');
    expect(page.textContent).toContain('El ingreso original se conserva');
    fixture.componentInstance.loading = false;
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    expect(tracking.cancelOrder).not.toHaveBeenCalled();
    page.querySelector<HTMLButtonElement>('.confirm-cancellation')!.click();
    fixture.detectChanges();
    expect(tracking.cancelOrder).toHaveBeenCalledExactlyOnceWith(2);
    const canceledRow = page.querySelector('[data-status="CANCELADO"]')!.closest('tr')!;
    expect(canceledRow.querySelector('[data-label="Estado"] .status-detail')?.textContent)
      .toBe('Cancelado por Lorena');
    expect(canceledRow.textContent).not.toContain('Ingresado por Miguel');
    expect(canceledRow.querySelector('[data-label="Acción"]')?.textContent?.trim()).toBe('');
    expect(page.querySelector('[aria-label="Acciones de la orden #2"]')).toBeNull();
    fixture.componentInstance.requestCancellation(orders().find(order => order.id === 2)!);
    expect(fixture.componentInstance.orderToCancel).toBeNull();
    expect(tracking.cancelOrder).toHaveBeenCalledOnce();
    canceledRow.querySelector<HTMLButtonElement>('.order-link')!.click();
    await fixture.whenStable();
    const roles = page.querySelector('#detail-roles-heading + dl')!;
    expect(roles.textContent).toContain('Cancelada por');
    expect(roles.textContent).toContain('Lorena');
    expect(roles.textContent).toContain('Ingresada por');
    expect(roles.textContent).toContain('Miguel');
    fixture.destroy();
  });

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
    expect(feedback.success).toHaveBeenCalledWith('La orden #1 fue marcada como ingresada.');
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
    expect(feedback.error).toHaveBeenCalledWith('Faltan firmas.');
    expect(feedback.success).not.toHaveBeenCalled();
    expect(component.updatingOrderId).toBeNull();
    expect(loadOrders).toHaveBeenCalledOnce();
  });

  it('offers entry only for signed orders with permission and reenables it after a failure', async () => {
    const { orders, tracking } = createState();
    orders.set([
      { ...orders()[0], status: 'ENVIADO', canMarkEntered: false },
      { ...orders()[1], status: 'FIRMADO', canMarkEntered: true },
      { ...orders()[2], status: 'FIRMADO', canMarkEntered: false },
      { ...orders()[3], status: 'INGRESADO', canMarkEntered: false },
      { ...orders()[0], id: 5, status: 'CANCELADO', canMarkEntered: false, canCancel: true },
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
    const page = fixture.nativeElement as HTMLElement;
    const [trigger] = page.querySelectorAll<HTMLElement>('.order-actions-dropdown .portal-dropdown-trigger');
    expect(page.querySelectorAll('.order-actions-dropdown .portal-dropdown-trigger')).toHaveLength(1);
    expect(trigger.getAttribute('aria-label')).toContain('#2');
    trigger.click();
    fixture.detectChanges();
    const menu = document.getElementById(trigger.getAttribute('aria-controls')!)!;
    const [entryOption] = menu.querySelectorAll('button');
    expect(menu.querySelectorAll('button')).toHaveLength(1);
    expect(entryOption.textContent?.trim()).toBe('Marcar ingresada');
    const cancelledRow = fixture.nativeElement.querySelector('[data-status="CANCELADO"]').closest('tr');
    expect(cancelledRow.querySelector('.status').textContent).toContain('Cancelado');
    expect(cancelledRow.querySelector('.status-detail')).toBeNull();
    expect(cancelledRow.querySelector('[data-label="Acción"] button')).toBeNull();
    expect(cancelledRow.querySelector('button')).toBeTruthy(); // Conserva el acceso al detalle.
    const response = new Subject();
    tracking.markEntered.mockReturnValue(response);
    entryOption.click();
    await fixture.whenStable();
    expect(tracking.markEntered).toHaveBeenCalledExactlyOnceWith(2);
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.textContent?.trim()).toBe('Guardando…');
    trigger.click();
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    const reopenedMenu = document.getElementById(trigger.getAttribute('aria-controls')!)!;
    const currentOption = reopenedMenu.querySelector('button')!;
    expect(currentOption.disabled).toBe(true);
    response.error({ status: 500, error: { detail: 'No se pudo guardar.' } });
    await fixture.whenStable();
    expect(feedback.error).toHaveBeenCalledWith('No se pudo guardar.');
    expect(fixture.nativeElement.querySelector('.error-notice')).toBeNull();
    expect(currentOption.disabled).toBe(false);
    fixture.destroy();
  });
});
