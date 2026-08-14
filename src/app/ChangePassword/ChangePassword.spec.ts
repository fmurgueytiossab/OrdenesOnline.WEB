import { ChangePasswordComponent } from './ChangePassword';

describe('ChangePasswordComponent validation', () => {
  const createComponent = () => {
    const service = { updatePassword: vi.fn() };
    const snackBar = { open: vi.fn() };
    const component = new ChangePasswordComponent(
      service as never,
      {} as never,
      {} as never,
      { detectChanges: vi.fn() } as never,
      snackBar as never,
    );

    component.token = 'token';
    return { component, service, snackBar };
  };

  it('rejects passwords shorter than eight characters', () => {
    const { component, service, snackBar } = createComponent();
    component.password = 'abc123';
    component.confirmPassword = 'abc123';

    component.cambiarPassword();

    expect(service.updatePassword).not.toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith(
      'La contraseña debe tener al menos 8 caracteres',
      'Cerrar',
      expect.objectContaining({ panelClass: ['snack-error'] }),
    );
  });

  it('requires a combination of letters and numbers', () => {
    const { component, service, snackBar } = createComponent();
    component.password = 'sololetras';
    component.confirmPassword = 'sololetras';

    component.cambiarPassword();

    expect(service.updatePassword).not.toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith(
      'La contraseña debe combinar letras y números',
      'Cerrar',
      expect.objectContaining({ panelClass: ['snack-error'] }),
    );
  });

  it('requires at least one special character', () => {
    const { component, service, snackBar } = createComponent();
    component.password = 'clave1234';
    component.confirmPassword = 'clave1234';

    component.cambiarPassword();

    expect(service.updatePassword).not.toHaveBeenCalled();
    expect(snackBar.open).toHaveBeenCalledWith(
      'La contraseña debe incluir al menos un carácter especial',
      'Cerrar',
      expect.objectContaining({ panelClass: ['snack-error'] }),
    );
  });
});
