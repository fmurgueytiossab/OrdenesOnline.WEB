import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';

import { PORTAL_ROUTES } from '../../../shared/portal-routes';
import { ClientPortalLayoutComponent } from './client-portal-layout';

describe('ClientPortalLayoutComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClientPortalLayoutComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  afterEach(() => localStorage.removeItem('token'));

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
