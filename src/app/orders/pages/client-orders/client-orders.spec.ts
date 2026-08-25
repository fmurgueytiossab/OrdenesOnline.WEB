import { provideHttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';

import { ClienteSearchResult } from '../../../Model/ClienteSearchResult';
import { ClientOrdersComponent } from './client-orders';

describe('ClientOrdersComponent client blocking', () => {
  let fixture: ComponentFixture<ClientOrdersComponent>;
  let component: ClientOrdersComponent;
  const snackBar = {
    open: vi.fn(),
    dismiss: vi.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientOrdersComponent],
      providers: [
        provideHttpClient(),
        provideRouter([]),
      ],
    })
      .overrideProvider(MatSnackBar, { useValue: snackBar })
      .compileComponents();

    fixture = TestBed.createComponent(ClientOrdersComponent);
    component = fixture.componentInstance;
    snackBar.open.mockClear();
    snackBar.dismiss.mockClear();
  });

  afterEach(() => fixture.destroy());

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
