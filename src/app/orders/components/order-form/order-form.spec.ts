import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { of } from 'rxjs';
import { ValorService } from '../../../services/ValorService';
import { MarketHoursService, MarketHoursSnapshot } from '../../services/market-hours.service';
import { OrderFormComponent } from './order-form';

describe('OrderFormComponent market hours', () => {
  let fixture: ComponentFixture<OrderFormComponent>;
  const current = signal<MarketHoursSnapshot | null>(null);
  const snackBar = { open: vi.fn() };
  const state: MarketHoursSnapshot = {
    serverNow: '2026-09-07T15:00:00-05:00', today: '2026-09-07',
    opensAt: '2026-09-07T06:00:00-05:00', closesAt: '2026-09-07T15:00:00-05:00',
    isOpen: false, nextOpenAt: '2026-09-08T06:00:00-05:00',
    validForDate: '2026-09-08', nextTransitionAt: '2026-09-08T06:00:00-05:00', applyToAllMarkets: true,
  };

  beforeEach(async () => {
    current.set(state);
    snackBar.open.mockClear();
    await TestBed.configureTestingModule({
      imports: [OrderFormComponent],
      providers: [
        { provide: MarketHoursService, useValue: { current, failed: signal(false), refresh: vi.fn() } },
        { provide: ValorService, useValue: { getAll: () => of([]) } },
      ],
    }).overrideProvider(MatSnackBar, { useValue: snackBar }).compileComponents();
    fixture = TestBed.createComponent(OrderFormComponent);
    fixture.componentRef.setInput('markets', [{ code: 'BVL', name: 'BVL' }]);
    fixture.detectChanges();
  });

  afterEach(() => fixture.destroy());

  function fill() {
    const form = fixture.componentInstance;
    form.instrumento = 'ABC'; form.cantidad = 10; form.precio = 5;
    return form;
  }

  it('lets clients submit an explicit next-session validity after closing', () => {
    const form = fill();
    const emit = vi.spyOn(form.orderSubmitted, 'emit');
    expect(form.controlsDisabled).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('Solo para mañana');
    expect(fixture.nativeElement.textContent).toContain('08/09/2026');
    form.submit();
    expect(emit).toHaveBeenCalledWith(expect.objectContaining({ vigencia: 'Solo el 08/09/2026' }));
  });

  it('blocks representatives at closing and preserves the draft until reopening', () => {
    const form = fill();
    fixture.componentRef.setInput('portal', 'representatives');
    current.set({ ...state, isOpen: true, validForDate: state.today });
    fixture.detectChanges();
    expect(form.controlsDisabled).toBe(false);
    current.set(state);
    fixture.detectChanges();
    const emit = vi.spyOn(form.orderSubmitted, 'emit');
    form.submit();
    expect(emit).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.schedule-blocker').textContent).toContain('08/09/2026, 06:00');
    expect(fixture.nativeElement.querySelector('.order-form').hasAttribute('inert')).toBe(true);
    current.set({ ...state, isOpen: true, today: '2026-09-08', validForDate: '2026-09-08' });
    fixture.detectChanges();
    expect(form.controlsDisabled).toBe(false);
    expect(form.instrumento).toBe('ABC');
  });

  it('renders Mercado as a dropdown for representatives', () => {
    fixture.componentRef.setInput('portal', 'representatives');
    fixture.componentRef.setInput('marketControl', 'select');
    fixture.detectChanges();

    const marketControl = fixture.nativeElement.querySelector('.channel-control');
    expect(marketControl.textContent).toContain('Mercado');
    expect(marketControl.querySelector('mat-select')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.market-options')).toBeNull();
  });

  it('names the next session instead of tomorrow when the next day is not a trading day', () => {
    current.set({ ...state, today: '2026-09-11', validForDate: '2026-09-14' });
    fixture.detectChanges();
    expect(fixture.componentInstance.validityLabel('Hoy')).toBe('Próxima sesión');
    expect(fixture.nativeElement.textContent).toContain('14/09/2026');
  });

  it('rejects an expired custom date and waits when the server schedule is unavailable', () => {
    const form = fill();
    const emit = vi.spyOn(form.orderSubmitted, 'emit');
    form.tipoVigencia = 'Fecha'; form.fechaSeleccionada = new Date(2026, 8, 7);
    form.submit();
    expect(emit).not.toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalled();
    current.set(null);
    expect(form.controlsDisabled).toBe(true);
  });
});
