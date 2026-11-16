import { of } from 'rxjs';
import { RepresentantesAdminComponent } from './orders/pages/representantes-admin/representantes-admin';
import { RepresentantesConfiguracionService } from './services/representantes-configuracion.service';
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
  for (const url of ['/Clientes', '/clientes', '/CLIENTES', '/cLiEnTeS', '/Clientes?source=direct', '/clientes?source=direct', '/Representantes']) {
    it('preserves the intended login portal for ' + url, async () => {
      const harness = await RouterTestingHarness.create();
      const login = await harness.navigateByUrl(url, LoginComponent);
      expect(TestBed.inject(Router).url).toBe(url);
      expect(login.portal).toBe(url === '/Representantes' ? 'representantes' : 'clientes');
    });
  }
  for (const url of ['/Clientes/ausencias', '/Clientes/ausencias/registro', '/Representantes/ausencias', '/Representantes/ausencias/registro', '/Clientes/grupos', '/Representantes/grupos', '/Clientes/reglas-responsables', '/Representantes/reglas-responsables']) {
    it('protects the absence modules from anonymous visits to ' + url, async () => {
      const harness = await RouterTestingHarness.create(); await harness.navigateByUrl(url, LoginComponent);
      expect(TestBed.inject(Router).url).toBe(url.startsWith('/Clientes') ? '/Clientes' : '/Representantes');
    });
  }
  it('keeps an anonymous client order visit in the client portal', async () => {
    const harness = await RouterTestingHarness.create();
    const login = await harness.navigateByUrl('/Clientes/ordenes', LoginComponent);
    expect(TestBed.inject(Router).url).toBe('/Clientes');
    expect(login.portal).toBe('clientes');
  });
  it('replaces both register pages with redirects to the absence summary', () => {
    const parents = routes.filter(r => r.children);
    for (const parent of parents) {
      const legacy = parent.children?.find(r => r.path === 'ausencias/registro');
      expect(legacy?.component).toBeUndefined(); expect(legacy?.redirectTo).toBe(`/${parent.path}/administracion?tab=ausencias`);
    }
  });

  for (const portal of ['Clientes', 'Representantes']) {
    it('opens the absence tab from the legacy register URL for an authenticated admin in ' + portal, async () => {
      const config = {revision: 'r1', usuarios: [], gestores: [], grupos: [], miembros: [], reglas: [], opciones: [], motivos: [], ausencias: [], perfiles: []};
      TestBed.overrideProvider(RepresentantesConfiguracionService, {useValue: {sesion: () => of({enabled: true, esAdmin: true}), configuracion: () => of(config), auditoria: () => of([])}});
      TestBed.overrideComponent(RepresentantesAdminComponent, {set: {template: '', imports: []}});
      localStorage.setItem('token', 'demo.' + btoa(JSON.stringify({exp: 4102444800})) + '.demo');
      const harness = await RouterTestingHarness.create(); await harness.navigateByUrl(`/${portal}/ausencias/registro`);
      expect(TestBed.inject(Router).url).toBe(`/${portal}/administracion?tab=ausencias`);
      // The routed summary receives the redirected query parameter.
      const route = TestBed.inject(Router).routerState.snapshot.root.firstChild?.firstChild;
      expect(route?.queryParamMap.get('tab')).toBe('ausencias');
      localStorage.removeItem('token');
    });
  }

});
