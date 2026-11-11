import { ChangeDetectorRef, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RepresentantesConfiguracionService } from '../../../services/representantes-configuracion.service';
import { ActivatedRoute, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { normalizePortal, PORTAL_ROUTES, PortalType } from '../../../shared/portal-routes';

@Component({
  selector: 'app-client-portal-layout',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './client-portal-layout.html',
  styleUrl: './client-portal-layout.css',
})
export class ClientPortalLayoutComponent implements OnInit {
  portal: PortalType = 'clientes';
  accountEmail = 'usuario@correo.com';
  menuOpen = false;
  esAdmin = false;
  private readonly configuration = inject(RepresentantesConfiguracionService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly cdr = inject(ChangeDetectorRef);

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  get ordersRoute(): string {
    return PORTAL_ROUTES[this.portal].orders;
  }

  get loginRoute(): string {
    return PORTAL_ROUTES[this.portal].login;
  }

  get accountPasswordRoute(): string {
    return PORTAL_ROUTES[this.portal].accountPassword;
  }

  get trackingRoute(): string | null {
    return this.portal === 'clientes' ? PORTAL_ROUTES.clientes.tracking : null;
  }

  get portalLabel(): string {
    return this.portal === 'clientes' ? 'Portal de clientes' : 'Portal de representantes';
  }

  get accountLabel(): string {
    return this.portal === 'clientes' ? 'Cliente' : 'Representante';
  }

  get accountInitial(): string {
    return this.portal === 'clientes' ? 'C' : 'R';
  }

  ngOnInit(): void {
    this.configuration.sesion().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({next: s => {this.esAdmin = s.esAdmin; this.cdr.markForCheck();}, error: () => {this.esAdmin = false;}});
    const portalData = this.route.snapshot.data['portal'];
    if (portalData) this.portal = normalizePortal(portalData);

    if (typeof localStorage !== 'undefined') {
      this.accountEmail = localStorage.getItem('correo') || this.accountEmail;
    }
  }

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  logout(): void {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('token');
    }
    this.closeMenu();
    void this.router.navigateByUrl(this.loginRoute);
  }
}
