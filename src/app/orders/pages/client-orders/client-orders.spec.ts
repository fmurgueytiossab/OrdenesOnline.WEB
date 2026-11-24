import { MatSelect } from '@angular/material/select';
import { By } from '@angular/platform-browser';
import { HttpTestingController } from '@angular/common/http/testing';
import { OrderFormComponent } from '../../components/order-form/order-form';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';

import { ClienteSearchResult } from '../../../Model/ClienteSearchResult';
import { PropuestaClienteService } from '../../../services/PropuestaClienteService';
import { OrderFormValue } from '../../models/order-form-value';
import { ClientOrdersComponent } from './client-orders';
import { RepresentantesConfiguracionService } from '../../../services/representantes-configuracion.service';

describe('ClientOrdersComponent client blocking', () => {
  let fixture: ComponentFixture<ClientOrdersComponent>;
  let component: ClientOrdersComponent;
  const snackBar = {
    open: vi.fn(),
    dismiss: vi.fn(),
  };
  const proposals = { registrar: vi.fn() };
  const configuration = {sesion: () => of({enabled: false, esAdmin: false}), responsables: vi.fn()};
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
        { provide: RepresentantesConfiguracionService, useValue: configuration },
      ],
    })
      .overrideProvider(MatSnackBar, { useValue: snackBar })
      .compileComponents();

    fixture = TestBed.createComponent(ClientOrdersComponent);
    component = fixture.componentInstance;
    snackBar.open.mockClear();
    snackBar.dismiss.mockClear();
    proposals.registrar.mockReset();
    proposals.registrar.mockReturnValue(of({success: true, propuestaId: 123, docuSignEnviado: true}));
  });

  afterEach(() => fixture.destroy());

  it('shows Inmediata before selecting client/instrument and places responsibilities just before the estimated amount', () => {
    component.configurationEnabled = true; fixture.detectChanges();
    const panel = fixture.nativeElement.querySelector('.responsibles-panel') as HTMLElement;
    expect(panel.hidden).toBe(false); expect(component.modalidadReferencia).toBe('Inmediata');
    expect(panel.querySelectorAll('mat-select')).toHaveLength(1); // Solo modalidad mientras no haya candidatos.
    expect(panel.textContent).toContain('Selecciona un cliente');
    const instrument = fixture.nativeElement.querySelector('app-order-form input[placeholder]') as HTMLElement;
    const send = fixture.nativeElement.querySelector('.submit-button') as HTMLElement;
    const operation = fixture.nativeElement.querySelector('#operation-section-title') as HTMLElement;
    expect(panel.compareDocumentPosition(operation) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
    expect(panel.compareDocumentPosition(instrument) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
    const amount = fixture.nativeElement.querySelector('.order-summary') as HTMLElement;
    expect(panel.compareDocumentPosition(amount) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(panel.compareDocumentPosition(send) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    component.modalidadReferencia = 'Manual'; component.clearOrderForm(); expect(component.modalidadReferencia).toBe('Inmediata');
  });
  it('loads rules from the real child instrument event and does not clear choices on repeated blur', () => {
    configuration.responsables.mockReset();
    configuration.responsables.mockReturnValue(of({tipoRenta: 'RV', revision: 'revision-1', titulares: [{representanteId: 9, nombre: 'Titular', puedeCrear: true, error: null,
      orden: [{representanteId: 9, nombre: 'Titular'}], operacion: [{representanteId: 3, nombre: 'Sofía'}, {representanteId: 4, nombre: 'Lucía'}]}]}));
    component.configurationEnabled = true; fixture.detectChanges();
    const http = TestBed.inject(HttpTestingController);
    for (const request of http.match(() => true)) {
      if (request.request.url.includes('Valor')) request.flush([{cosabval: 1, mnemo: order.instrumento, comon: '01', estado: '0'}]);
      else request.flush({serverNow:'2026-11-16T09:30:00-05:00',today:'2026-11-16',opensAt:'2026-11-16T06:00:00-05:00',closesAt:'2026-11-16T15:00:00-05:00',isOpen:true,nextOpenAt:'2026-11-17T06:00:00-05:00',validForDate:'2026-11-16',timeZone:'America/Lima'});
    }
    component.selectClient(client({})); expect(configuration.responsables).not.toHaveBeenCalled();
    const child = fixture.debugElement.query(By.directive(OrderFormComponent)).componentInstance as OrderFormComponent;
    child.selectInstrument(order.instrumento); expect(configuration.responsables).toHaveBeenCalledWith('C001',order.instrumento);
    expect(component.orderResponsibleId).toBe(9); expect(component.operationResponsibleId).toBe(0);
    component.operationResponsibleId = 3; child.validateInstrument(); expect(configuration.responsables).toHaveBeenCalledTimes(1); expect(component.operationResponsibleId).toBe(3);
    component.submitOrder(order); expect(proposals.registrar).toHaveBeenCalledWith(expect.objectContaining({modalidadReferencia:'Inmediata',titularRepresentanteId:9,responsableOperacionRepresentanteId:3}));
    child.filterValues('OTRO'); expect(component.responsibleOptions).toBeNull(); expect(component.operationResponsibleId).toBe(0);
  });

  it('renders unique holder/order/execution defaults as readable readonly inputs without dropdown arrows', () => {
    configuration.responsables.mockReturnValue(of({tipoRenta: 'RV', revision: 'r1', titulares: [{representanteId: 9, nombre: 'Victor', puedeCrear: true, error: null,
      orden: [{representanteId: 9, nombre: 'Victor'}], operacion: [{representanteId: 9, nombre: 'Victor'}]}]}));
    component.configurationEnabled = true; component.selectClient(client({})); component.onInstrumentChanged(order.instrumento); fixture.detectChanges();
    for (const selector of ['.titular-field', '.order-responsible-field', '.operation-responsible-field']) {
      const field = fixture.nativeElement.querySelector(selector) as HTMLElement; const input = field.querySelector('input')!;
      expect(field.querySelector('mat-select')).toBeNull(); expect(input.value).toBe('Victor'); expect(input.readOnly).toBe(true); expect(input.disabled).toBe(false);
    }
    expect(component.titularId).toBe(9); expect(component.orderResponsibleId).toBe(9); expect(component.operationResponsibleId).toBe(9);
    expect(fixture.nativeElement.querySelectorAll('.responsibles-panel mat-select')).toHaveLength(1);
  });
  it('keeps a dropdown only for roles with multiple candidates and never picks the first executor automatically', () => {
    configuration.responsables.mockReturnValue(of({tipoRenta: 'RF', revision: 'r1', titulares: [{representanteId: 9, nombre: 'Titular', puedeCrear: true, error: null,
      orden: [{representanteId: 9, nombre: 'Titular'}], operacion: [{representanteId: 3, nombre: 'Sofía'}, {representanteId: 4, nombre: 'Lucía'}]}]}));
    component.configurationEnabled = true; component.selectClient(client({})); component.onInstrumentChanged(order.instrumento); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.titular-field mat-select')).toBeNull(); expect(fixture.nativeElement.querySelector('.order-responsible-field mat-select')).toBeNull();
    expect(fixture.nativeElement.querySelector('.operation-responsible-field mat-select')).not.toBeNull(); expect(component.operationResponsibleId).toBe(0);
  });
  it('requires an explicit executor choice and sends four independent identities through the API contract', () => {
    configuration.responsables.mockReturnValue(of({tipoRenta: 'RV', revision: 'revision-1', titulares: [{representanteId: 9, nombre: 'Titular', puedeCrear: true, error: null,
      orden: [{representanteId: 2, nombre: 'Manuel'}], operacion: [{representanteId: 3, nombre: 'Sofía'}, {representanteId: 4, nombre: 'Lucía'}]}]}));
    component.configurationEnabled = true;
    component.selectClient(client({})); component.onInstrumentChanged(order.instrumento);
    expect(component.titularId).toBe(9); expect(component.orderResponsibleId).toBe(2); expect(component.operationResponsibleId).toBe(0);
    component.modalidadReferencia = 'Manual'; component.submitOrder(order);
    expect(proposals.registrar).not.toHaveBeenCalled();
    component.operationResponsibleId = 3; component.submitOrder(order);
    expect(proposals.registrar.mock.calls[0][0]).toMatchObject({titularRepresentanteId: 9, responsableOrdenRepresentanteId: 2,
      responsableOperacionRepresentanteId: 3, modalidadReferencia: 'Manual', revisionResponsables: 'revision-1'});
  });
  it('blocks read-only portfolios and clears stale responsibility choices when the instrument changes', () => {
    configuration.responsables.mockReturnValue(of({tipoRenta: 'RV', revision: 'revision-1', titulares: [{representanteId: 9, nombre: 'Titular', puedeCrear: false, error: null,
      orden: [{representanteId: 2, nombre: 'Manuel'}], operacion: [{representanteId: 3, nombre: 'Sofía'}]}]}));
    component.configurationEnabled = true; component.selectClient(client({})); component.onInstrumentChanged(order.instrumento);
    component.modalidadReferencia = 'Inmediata'; component.submitOrder(order);
    expect(proposals.registrar).not.toHaveBeenCalled();
    component.onInstrumentChanged('');
    expect(component.responsibleOptions).toBeNull(); expect(component.orderResponsibleId).toBe(0); expect(component.operationResponsibleId).toBe(0);
  });

  it('shows query-only permission as a toast, preserves the resolved holder and blocks submission', () => {
    configuration.responsables.mockReturnValue(of({tipoRenta: 'RV', revision: 'r1', titulares: [{representanteId: 38, nombre: 'Cribillero', puedeCrear: false, error: null,
      orden: [{representanteId: 38, nombre: 'Cribillero'}], operacion: [{representanteId: 2, nombre: 'Operador 1'}, {representanteId: 3, nombre: 'Operador 2'}]}]}));
    component.configurationEnabled = true; component.selectClient(client({})); component.onInstrumentChanged(order.instrumento); fixture.detectChanges();
    const message = 'Tienes permiso para consultar esta cartera. La creación de propuestas requiere permiso operativo.';
    expect(snackBar.open).toHaveBeenLastCalledWith(message, 'Cerrar', expect.objectContaining({duration: 10000}));
    expect(component.titularId).toBe(38); expect(component.orderResponsibleId).toBe(38);
    expect(fixture.nativeElement.querySelector('.responsibles-panel [role="alert"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('.responsibles-panel').textContent).not.toContain(message);
    component.submitOrder(order); expect(proposals.registrar).not.toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenLastCalledWith(message, 'Cerrar', expect.anything());
  });

  it('shows missing executors in a toast and keeps submission blocked', () => {
    const message = 'No hay ejecutores disponibles.';
    configuration.responsables.mockReturnValue(of({tipoRenta: 'RV', revision: 'r1', titulares: [{representanteId: 9, nombre: 'Titular', puedeCrear: true, error: message,
      orden: [{representanteId: 9, nombre: 'Titular'}], operacion: []}]}));
    component.configurationEnabled = true; component.selectClient(client({})); component.onInstrumentChanged(order.instrumento); fixture.detectChanges();
    expect(snackBar.open).toHaveBeenLastCalledWith(message, 'Cerrar', expect.anything());
    expect(fixture.nativeElement.querySelector('.responsibles-panel').textContent).not.toContain(message);
    component.submitOrder(order); expect(proposals.registrar).not.toHaveBeenCalled(); expect(component.operationResponsibleId).toBe(0);
  });

  it('shows the resolution error in a toast, clears stale identities and can retry', () => {
    const message = 'El cliente no tiene un titular configurado.';
    configuration.responsables.mockReturnValue(throwError(() => ({status: 409, error: {title: 'Conflicto', detail: message}})));
    component.configurationEnabled = true; component.selectClient(client({})); component.onInstrumentChanged(order.instrumento); fixture.detectChanges();
    expect(snackBar.open).toHaveBeenLastCalledWith(message, 'Cerrar', expect.anything());
    expect(component.responsibleOptions).toBeNull(); expect(component.titularId).toBe(0); expect(component.orderResponsibleId).toBe(0); expect(component.operationResponsibleId).toBe(0);
    const panel = fixture.nativeElement.querySelector('.responsibles-panel');
    expect(panel.textContent).not.toContain(message); expect(panel.textContent).toContain('Volver a consultar');
    configuration.responsables.mockReturnValue(of({tipoRenta: 'RV', revision: 'r2', titulares: [{representanteId: 34, nombre: 'Fernando', puedeCrear: true, error: null,
      orden: [{representanteId: 34, nombre: 'Fernando'}], operacion: [{representanteId: 34, nombre: 'Fernando'}]}]}));
    component.refreshResponsibles(); expect(component.responsibleError).toBe(''); expect(component.operationResponsibleId).toBe(34);
  });

  it('keeps waiting beyond eight seconds and ignores a second click while submission is pending', () => {
    vi.useFakeTimers();
    try {
      const pending = new Subject<any>(); proposals.registrar.mockReturnValue(pending);
      component.selectClient(client({})); component.submitOrder(order); component.submitOrder(order);
      expect(proposals.registrar).toHaveBeenCalledOnce();
      vi.advanceTimersByTime(9000); expect(component.submitting).toBe(true); expect(component.submissionError).toBe('');
      pending.next({success: true, propuestaId: 1638, docuSignEnviado: true}); pending.complete();
      expect(component.submitting).toBe(false);
      expect(snackBar.open).toHaveBeenLastCalledWith('Propuesta #1638 creada y envío aceptado para firma.', 'Cerrar', expect.anything());
    } finally {vi.useRealTimers();}
  });

  it('distinguishes a saved proposal with unconfirmed signing from successful sending', () => {
    proposals.registrar.mockReturnValue(of({success: true, propuestaId: 1638, docuSignEnviado: false, warning: 'El envío no pudo confirmarse.'}));
    component.selectClient(client({})); component.submitOrder(order);
    expect(snackBar.open).toHaveBeenLastCalledWith('Propuesta #1638 guardada. El envío no pudo confirmarse.', 'Cerrar', expect.objectContaining({duration: 10000}));
    expect(component.submissionError).toBe('');
  });

  it('keeps an absent holder visible in both roles, displays the reason and disables sending with a toast', () => {
    const absent = {representanteId: 34, nombre: 'Fernando Murgueytio', disponible: false, motivoNoDisponible: 'Descanso médico'};
    const message = 'Fernando Murgueytio no está disponible: Descanso médico. No se puede enviar la orden.';
    configuration.responsables.mockReturnValue(of({tipoRenta: 'RV', revision: 'r1', titulares: [{representanteId: 34, nombre: 'Fernando Murgueytio', puedeCrear: true,
      error: message, orden: [absent], operacion: [absent]}]}));
    component.configurationEnabled = true; component.selectClient(client({})); component.onInstrumentChanged(order.instrumento); fixture.detectChanges();
    const child = fixture.debugElement.query(By.directive(OrderFormComponent)).componentInstance as OrderFormComponent;
    child.marketHours.refresh();
    const http = TestBed.inject(HttpTestingController);
    for (const request of http.match(() => true)) {
      if (request.request.url.includes('Valor')) request.flush([{cosabval: 1, mnemo: order.instrumento, comon: '01', estado: '0'}]);
      else request.flush({serverNow:'2026-11-16T09:30:00-05:00',today:'2026-11-16',opensAt:'2026-11-16T06:00:00-05:00',closesAt:'2026-11-16T15:00:00-05:00',isOpen:true,nextOpenAt:'2026-11-17T06:00:00-05:00',validForDate:'2026-11-16',nextTransitionAt:'2026-11-16T15:00:00-05:00',applyToAllMarkets:true});
    }
    fixture.detectChanges(); expect(child.controlsDisabled).toBe(false);
    expect((fixture.nativeElement.querySelector('.titular-field input') as HTMLInputElement).value).toBe('Fernando Murgueytio');
    for (const selector of ['.order-responsible-field', '.operation-responsible-field']) {
      const field = fixture.nativeElement.querySelector(selector); const input = field.querySelector('input') as HTMLInputElement;
      expect(input.value).toBe('Fernando Murgueytio'); expect(input.disabled).toBe(true); expect(field.textContent).toContain('No disponible — Descanso médico');
    }
    expect(component.orderResponsibleId).toBe(0); expect(component.operationResponsibleId).toBe(0);
    expect(fixture.nativeElement.querySelector('.submit-button').disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('.responsibles-panel [role="alert"]')).toBeNull();
    expect(snackBar.open).toHaveBeenLastCalledWith(message, 'Cerrar', expect.anything());
    component.submitOrder(order); expect(proposals.registrar).not.toHaveBeenCalled();
    // Al cancelar la ausencia y volver a consultar, se recuperan los valores por defecto.
    const available = {...absent, disponible: true, motivoNoDisponible: null};
    configuration.responsables.mockReturnValue(of({tipoRenta: 'RV', revision: 'r2', titulares: [{representanteId: 34, nombre: 'Fernando Murgueytio', puedeCrear: true,
      error: null, orden: [available], operacion: [available]}]}));
    component.refreshResponsibles(); fixture.detectChanges();
    expect(component.orderResponsibleId).toBe(34); expect(component.operationResponsibleId).toBe(34);
    expect(fixture.nativeElement.querySelector('.submit-button').disabled).toBe(false);
    expect((fixture.nativeElement.querySelector('.operation-responsible-field input') as HTMLInputElement).disabled).toBe(false);
  });

  it('disables absent dropdown options and blocks a forged unavailable choice while allowing the available executor', () => {
    configuration.responsables.mockReturnValue(of({tipoRenta: 'RV', revision: 'r1', titulares: [{representanteId: 34, nombre: 'Fernando', puedeCrear: true, error: null,
      orden: [{representanteId: 34, nombre: 'Fernando', disponible: true}], operacion: [
        {representanteId: 34, nombre: 'Fernando', disponible: false, motivoNoDisponible: 'Descanso médico'},
        {representanteId: 5, nombre: 'Miguel', disponible: true}]}]}));
    component.configurationEnabled = true; component.selectClient(client({})); component.onInstrumentChanged(order.instrumento); fixture.detectChanges();
    expect(component.operationResponsibleId).toBe(5);
    const select = fixture.debugElement.query(By.css('.operation-responsible-field mat-select')).componentInstance as MatSelect;
    const unavailable = select.options.find(option => option.value === 34)!;
    expect(unavailable.disabled).toBe(true); expect(unavailable.viewValue).toContain('No disponible — Descanso médico');
    component.operationResponsibleId = 34; expect(component.responsibleSubmissionBlocked).toBe(true);
    component.submitOrder(order); expect(proposals.registrar).not.toHaveBeenCalled();
    component.operationResponsibleId = 5; expect(component.responsibleSubmissionBlocked).toBe(false);
    component.submitOrder(order); expect(proposals.registrar).toHaveBeenCalledOnce();
  });

  it('shows the active group requirement in a toast and prevents submission even when both responsible people are available', () => {
    const message = 'Para enviar una propuesta debes pertenecer al menos a un grupo activo y habilitado.';
    const person = {representanteId: 34, nombre: 'Fernando', disponible: true};
    configuration.responsables.mockReturnValue(of({tipoRenta: 'RV', revision: 'r1', titulares: [{representanteId: 34, nombre: 'Fernando', puedeCrear: false, error: message, orden: [person], operacion: [person]}]}));
    component.configurationEnabled = true; component.selectClient(client({})); component.onInstrumentChanged(order.instrumento); fixture.detectChanges();
    expect(component.responsibleSubmissionBlocked).toBe(true);
    expect(fixture.nativeElement.querySelector('.submit-button').disabled).toBe(true);
    expect(snackBar.open).toHaveBeenLastCalledWith(message, 'Cerrar', expect.objectContaining({duration: 10000}));
    expect(fixture.nativeElement.querySelector('.responsibles-panel [role="alert"]')).toBeNull();
    component.submitOrder(order); expect(proposals.registrar).not.toHaveBeenCalled();
  });

  it('shows one phone as plain text and only offers a menu for multiple phones', () => {
    component.selectClient(client({ nucel: ['999888777'] }));
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.single-phone').textContent).toContain('999888777');
    expect(fixture.nativeElement.querySelector('.client-phone-dropdown button')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Correo electrónico');

    component.selectClient(client({ nucel: ['999888777', '988777666'] }));
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.single-phone')).toBeNull();
    const phoneMenu = fixture.nativeElement.querySelector('.client-phone-dropdown button') as HTMLButtonElement;
    expect(phoneMenu.textContent).toContain('2 números registrados');
    phoneMenu.click();
    fixture.detectChanges();
    const phonePanel = document.getElementById(phoneMenu.getAttribute('aria-controls')!)!;
    expect(Array.from(phonePanel.querySelectorAll('li'), item => item.textContent?.trim()))
      .toEqual(['999888777', '988777666']);

    component.selectClient(client({ nucel: [] }));
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.client-phone-dropdown button')).toBeNull();
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
    expect(snackBar.open).toHaveBeenLastCalledWith(detail, 'Cerrar', expect.anything());
    expect(fixture.nativeElement.querySelector('.submission-error')).toBeNull();
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
