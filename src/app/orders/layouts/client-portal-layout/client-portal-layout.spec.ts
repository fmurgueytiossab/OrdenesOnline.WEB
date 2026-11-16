import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { RepresentantesConfiguracionService } from '../../../services/representantes-configuracion.service';
import { provideRouter, Router } from '@angular/router';

import { PORTAL_ROUTES } from '../../../shared/portal-routes';
import { ClientPortalLayoutComponent } from './client-portal-layout';

describe('ClientPortalLayoutComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientPortalLayoutComponent],
      providers: [provideRouter([]), {provide: RepresentantesConfiguracionService, useValue: {sesion: () => of({enabled: false, esAdmin: false})}}],
    }).compileComponents();
  });

  afterEach(() => localStorage.removeItem('token'));

  it('keeps Nueva orden and Mis órdenes before all new modules even for admins', () => {
    vi.spyOn(TestBed.inject(RepresentantesConfiguracionService), 'sesion').mockReturnValue(of({enabled: true, esAdmin: true}));
    const fixture = TestBed.createComponent(ClientPortalLayoutComponent); fixture.detectChanges();
    const links = [...fixture.nativeElement.querySelectorAll('nav a')].map((a: HTMLElement) => a.textContent?.trim());
    expect(links.slice(0, 2)).toEqual(['Nueva orden', 'Mis órdenes']); expect(links).toContain('Resumen de representantes'); fixture.destroy();
  });
  it('renders the main client navigation', () => {
    const fixture = TestBed.createComponent(ClientPortalLayoutComponent);
    fixture.detectChanges();

    const links = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('nav a'),
    ).map((link) => link.textContent?.trim());

    expect(links).toContain('Nueva orden');
    expect(links).toContain('Mis órdenes');
  });

  it('adapts the navigation for representatives', () => {
    const fixture = TestBed.createComponent(ClientPortalLayoutComponent);
    fixture.componentInstance.portal = 'representantes';
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const links = Array.from(element.querySelectorAll('nav a')).map((link) =>
      link.textContent?.trim(),
    );

    expect(element.textContent).toContain('Portal de representantes');
    expect(links).toContain('Nueva orden');
    expect(links).not.toContain('Mis órdenes');
  });

  it('shows self-service to representatives and hides the administrative register', () => {
    const fixture = TestBed.createComponent(ClientPortalLayoutComponent); fixture.componentInstance.portal = 'representantes'; fixture.detectChanges();
    const nav = fixture.nativeElement.querySelector('nav') as HTMLElement;
    expect(nav.textContent).toContain('Mi disponibilidad'); expect(nav.textContent).not.toContain('Registro de ausencias'); expect(nav.textContent).not.toContain('Grupos de representantes'); expect(nav.textContent).not.toContain('Reglas de responsables');
    expect(nav.querySelector('a[href="/Representantes/ausencias"]')).not.toBeNull(); fixture.destroy();
  });

  it('shows admin modules without the separate absence register', () => {
    vi.spyOn(TestBed.inject(RepresentantesConfiguracionService), 'sesion').mockReturnValue(of({enabled: true, esAdmin: true}));
    const fixture = TestBed.createComponent(ClientPortalLayoutComponent); fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('a[href="/Clientes/ausencias/registro"]')).toBeNull(); expect(fixture.nativeElement.querySelector('a[href="/Clientes/grupos"]')).not.toBeNull(); expect(fixture.nativeElement.querySelector('a[href="/Clientes/reglas-responsables"]')).not.toBeNull(); fixture.destroy();
  });

  it('removes the token when logging out', () => {
    const router = TestBed.inject(Router);
    const navigateSpy = vi.spyOn(router, 'navigateByUrl').mockResolvedValue(true);
    localStorage.setItem('token', 'temporary-token');

    const fixture = TestBed.createComponent(ClientPortalLayoutComponent);
    fixture.componentInstance.logout();

    expect(localStorage.getItem('token')).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(PORTAL_ROUTES.clientes.login);
  });
});
