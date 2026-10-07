import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { routes } from './app.routes';
import { LoginComponent } from './login/login';
import { RepresentanteService } from './services/RepresentanteService';

describe('Portal entry routes', () => {
  beforeEach(() => {
    localStorage.removeItem('token');
    TestBed.configureTestingModule({
      providers: [provideRouter(routes),
        {provide: RepresentanteService, useValue: {}},
        {provide: MatSnackBar, useValue: {open: vi.fn()}},
      ],
    });
    TestBed.overrideComponent(LoginComponent, {set: {template: '', imports: []}});
  });
  for (const url of ['/Clientes', '/Clientes?source=direct', '/Representantes']) {
    it('preserves the intended login portal for ' + url, async () => {
      const harness = await RouterTestingHarness.create();
      const login = await harness.navigateByUrl(url, LoginComponent);
      expect(TestBed.inject(Router).url).toBe(url);
      expect(login.portal).toBe(url === '/Representantes' ? 'representantes' : 'clientes');
    });
  }
  it('keeps an anonymous client order visit in the client portal', async () => {
    const harness = await RouterTestingHarness.create();
    const login = await harness.navigateByUrl('/Clientes/ordenes', LoginComponent);
    expect(TestBed.inject(Router).url).toBe('/Clientes');
    expect(login.portal).toBe('clientes');
  });
});
