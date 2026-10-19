import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ClienteSearchResult } from '../../../Model/ClienteSearchResult';
import { PropuestaClienteService } from '../../../services/PropuestaClienteService';
import { OrderFormValue } from '../../models/order-form-value';
import { ClientOrdersComponent } from './client-orders';

describe('ClientOrdersComponent client blocking', () => {
  let fixture: ComponentFixture<ClientOrdersComponent>;
  let component: ClientOrdersComponent;
  const snackBar = {
    open: vi.fn(),
    dismiss: vi.fn(),
  };
  const proposals = { registrar: vi.fn() };
  const order: OrderFormValue = {
    tipo: 'Compra', tipoOrden: 'Limite', cantidad: 100, instrumento: 'VOLCABC1',
    precio: 0.18, monto: 18, mercado: '01', moneda: 'Soles', vigencia: 'Hoy',
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientOrdersComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: PropuestaClienteService, useValue: proposals },
      ],
    })
      .overrideProvider(MatSnackBar, { useValue: snackBar })
      .compileComponents();

    fixture = TestBed.createComponent(ClientOrdersComponent);
    component = fixture.componentInstance;
    snackBar.open.mockClear();
    snackBar.dismiss.mockClear();
    proposals.registrar.mockReset();
    proposals.registrar.mockReturnValue(of({}));
  });

  afterEach(() => fixture.destroy());

  it('shows one phone as plain text and only offers a menu for multiple phones', () => {
    component.selectClient(client({ nucel: ['999888777'] }));
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.single-phone').textContent).toContain('999888777');
    expect(fixture.nativeElement.querySelector('.readonly-disclosure')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Correo electrónico');

    component.selectClient(client({ nucel: ['999888777', '988777666'] }));
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.single-phone')).toBeNull();
    expect(fixture.nativeElement.querySelector('.readonly-disclosure').textContent).toContain('2 números registrados');

    component.selectClient(client({ nucel: [] }));
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.readonly-disclosure')).toBeNull();
    expect(fixture.nativeElement.querySelector('.phone-field').textContent).toContain('Sin celular registrado');
  });

  it('submits a WhatsApp proposal for a client without an email', () => {
    component.selectClient(client({ emails: [] }));

    component.submitOrder(order);

    expect(proposals.registrar).toHaveBeenCalledOnce();
    expect(proposals.registrar.mock.calls[0][0]).toEqual({ ...order, cosabcli: 'C001', moneda: 'soles' });
    expect(component.submitting).toBe(false);
    expect(component.submissionError).toBe('');
  });

  it('shows the API detail without clearing the client and clears it on a new selection', () => {
    const detail = 'El cliente necesita un nombre y un celular valido en Opersab para recibir la firma por WhatsApp.';
    proposals.registrar.mockReturnValue(throwError(() => ({
      status: 400,
      error: { title: 'No se puede enviar la propuesta para firma.', detail },
    })));
    component.selectClient(client({ nucel: ['511999431098'] }));

    component.submitOrder(order);

    expect(component.submissionError).toBe(detail);
    expect(fixture.nativeElement.querySelector('.submission-error').textContent).toContain(detail);
    expect(component.selectedClientCode).toBe('C001');
    expect(component.submitting).toBe(false);

    component.selectClient(client({ cosabcli: 'C002' }));
    expect(component.submissionError).toBe('');
  });

  it('keeps the glass block while editing and replaces it for each selected client state', () => {
    component.selectClient(client({ bloqueoMotivo: 'Documentación pendiente' }));

    expect(component.orderFormDisabled).toBe(true);
    expect(component.orderBlockMessage).toContain('Documentación pendiente');

    component.onClientSearchChange('Miguel Ange');

    expect(component.client).toBeNull();
    expect(component.orderFormDisabled).toBe(true);
    expect(component.orderBlockMessage).toContain('Documentación pendiente');

    component.selectClient(client({ nucel: [], bloqueoMotivo: null }));

    expect(component.orderFormDisabled).toBe(true);
    expect(component.orderBlockMessage).toContain('no cuenta con número de celular');

    component.selectClient(client({ nucel: ['999888777'], bloqueoMotivo: 'Cuenta restringida' }));

    expect(component.orderFormDisabled).toBe(true);
    expect(component.orderBlockMessage).toContain('Cuenta restringida');

    component.selectClient(client({ nucel: ['999888777'], bloqueoMotivo: null }));

    expect(component.orderFormDisabled).toBe(false);
    expect(component.orderBlockMessage).toBe('');
    expect(snackBar.open).not.toHaveBeenCalled();
    expect(snackBar.dismiss).toHaveBeenCalledOnce();
  });

  function client(overrides: Partial<ClienteSearchResult>): ClienteSearchResult {
    return {
      cosabcli: 'C001',
      nombreCompleto: 'Miguel Angel Gutierrez Pérez',
      emails: ['cliente@email.com'],
      nucel: ['999888777'],
      bloqueoMotivo: null,
      ...overrides,
    };
  }
});
