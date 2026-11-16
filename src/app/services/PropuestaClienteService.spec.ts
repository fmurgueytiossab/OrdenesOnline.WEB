import { HttpClient, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { PropuestaClienteService } from './PropuestaClienteService';
import { PropuestaCliente } from '../Model/PropuestaCliente';

describe('PropuestaClienteService retry identity', () => {
  const order: PropuestaCliente = {cosabcli: '027137', tipo: 'Compra', tipoOrden: 'Limite', cantidad: 10,
    instrumento: 'AAPL', precio: 11, monto: 110, mercado: '01', moneda: 'soles', vigencia: 'Hoy'};
  let http: HttpTestingController;
  let service: PropuestaClienteService;
  const failure = () => {};
  function token(actor: string) {return btoa('{}') + '.' + btoa(JSON.stringify({sub: actor})) + '.firma';}
  function post() {return http.expectOne(request => request.method === 'POST' && request.url.endsWith('/PropuestaCliente'));}
  beforeEach(() => {
    sessionStorage.clear(); localStorage.setItem('token', token('34'));
    TestBed.configureTestingModule({providers: [provideHttpClient(), provideHttpClientTesting()]});
    http = TestBed.inject(HttpTestingController); service = TestBed.inject(PropuestaClienteService);
  });
  afterEach(() => {http.verify(); sessionStorage.clear(); localStorage.clear();});

  it('retains the same identity after an ambiguous error and recreating the service, ignoring changed revision', () => {
    service.registrar({...order, revisionResponsables: 'r1'}).subscribe({error: failure});
    const first = post(); const id = first.request.body.solicitudId;
    expect(id).toMatch(/^[0-9a-f-]{36}$/);
    first.flush({title: 'Error'}, {status: 500, statusText: 'Error'});
    const reloaded = new PropuestaClienteService(TestBed.inject(HttpClient));
    reloaded.registrar({...order, revisionResponsables: 'r2'}).subscribe();
    const second = post(); expect(second.request.body.solicitudId).toBe(id);
    second.flush({success: true, propuestaId: 1638, reutilizada: true, docuSignEnviado: true});
    // Una nueva orden intencional tras confirmar la anterior obtiene otra identidad.
    reloaded.registrar(order).subscribe(); const third = post();
    expect(third.request.body.solicitudId).not.toBe(id); third.flush({success: true, propuestaId: 1640});
  });

  it('keeps disconnected attempts pending without automatic retries and isolates accounts and changed orders', () => {
    service.registrar(order).subscribe({error: failure}); const first = post(); const id = first.request.body.solicitudId;
    first.error(new ProgressEvent('error'));
    localStorage.setItem('token', token('7'));
    service.registrar(order).subscribe(); const otherActor = post(); expect(otherActor.request.body.solicitudId).not.toBe(id); otherActor.flush({success: true});
    localStorage.setItem('token', token('34'));
    service.registrar({...order, cantidad: 11}).subscribe(); const changed = post(); expect(changed.request.body.solicitudId).not.toBe(id); changed.flush({success: true});
    service.registrar(order).subscribe(); const retry = post(); expect(retry.request.body.solicitudId).toBe(id); retry.flush({success: true});
  });

  it('does not start a request when its identity cannot be persisted', () => {
    const set = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {throw new Error('Storage unavailable');});
    const error = vi.fn(); service.registrar(order).subscribe({error});
    expect(error).toHaveBeenCalledOnce(); http.expectNone(request => request.method === 'POST');
    set.mockRestore();
  });
});
