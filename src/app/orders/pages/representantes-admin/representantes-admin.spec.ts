import { TestBed } from '@angular/core/testing';
import { provideRouter, UrlTree } from '@angular/router';
import { firstValueFrom, of } from 'rxjs';
import { RepresentantesAdminComponent, representantesAdminGuard } from './representantes-admin';
import { RepresentantesConfiguracionService } from '../../../services/representantes-configuracion.service';

describe('Representantes administration', () => {
  const config = {revision: 'r1', usuarios: [], gestores: [], grupos: [], miembros: [], reglas: [], opciones: [], motivos: [], ausencias: [], perfiles: []};
  const api = {sesion: vi.fn(), configuracion: () => of(config), catalogo: () => of([]), auditoria: () => of([]), guardar: vi.fn()};
  beforeEach(() => {api.sesion.mockReturnValue(of({enabled: true, esAdmin: false})); api.guardar.mockReturnValue(of({...config, revision: 'r2'})); TestBed.configureTestingModule({imports: [RepresentantesAdminComponent], providers: [provideRouter([]), {provide: RepresentantesConfiguracionService, useValue: api}]});});
  it('redirects users without explicit administrative permission', async () => {
    const result = TestBed.runInInjectionContext(() => representantesAdminGuard({} as never, {} as never));
    expect(await firstValueFrom(result as ReturnType<typeof of>)).toBeInstanceOf(UrlTree);
  });
  it('uses the loaded revision and sends only membership scope with the loaded revision', () => {
    const fixture = TestBed.createComponent(RepresentantesAdminComponent); fixture.detectChanges();
    fixture.componentInstance.save({tipo: 'miembro', id: 2, representanteId: 3});
    expect(api.guardar).toHaveBeenCalledWith(expect.objectContaining({revision: 'r1', tipo: 'miembro', id: 2, representanteId: 3})); fixture.destroy();
  });
  it('preserves global consultation when editing Master without adding operation permissions', () => {
    const fixture = TestBed.createComponent(RepresentantesAdminComponent); fixture.detectChanges();
    fixture.componentInstance.editGroup({grupoId: 1, nombre: 'Master', grupoPadreId: null, activo: true, puedeConsultarTodosClientes: true});
    fixture.componentInstance.saveGroup();
    expect(api.guardar).toHaveBeenCalledWith(expect.objectContaining({tipo: 'grupo', id: 1, revision: 'r1', puedeConsultarTodosClientes: true}));
    expect(api.guardar.mock.lastCall?.[0].puedeCrearPropuesta).toBeUndefined(); fixture.destroy();
  });
});
