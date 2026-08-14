import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { RepresentanteService } from '../services/RepresentanteService';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { jwtDecode } from 'jwt-decode';
import { finalize } from 'rxjs';
import { normalizePortal, PORTAL_ROUTES, PortalType } from '../shared/portal-routes';

type TokenClaims = {
  email: string;
  nameid: string;
  exp: number;
};

@Component({
  selector: 'ChangePassword',
  standalone: true,
  templateUrl: './ChangePassword.html',
  styleUrls: ['./ChangePassword.css'],
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSnackBarModule
  ]
})
export class ChangePasswordComponent implements OnInit {

  token = '';
  tokenInvalido = false;

  correo = '';
  password = '';
  confirmPassword = '';

  loading = true;
  saving = false;
  cambioExitoso = false;
  showPassword = false;
  showConfirmPassword = false;

  fromEmail = false;
  portal: PortalType = 'representantes';

  constructor(
    private representanteService: RepresentanteService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar
  ) {}

  get passwordMismatch(): boolean {
    return this.confirmPassword.length > 0 && this.password !== this.confirmPassword;
  }

  get hasMinimumLength(): boolean {
    return this.password.length >= 8;
  }

  get hasLettersAndNumbers(): boolean {
    return /[A-Za-z]/.test(this.password) && /\d/.test(this.password);
  }

  get hasSpecialCharacter(): boolean {
    return /[^A-Za-z0-9\s]/.test(this.password);
  }

  get accountInitial(): string {
    return this.portal === 'clientes' ? 'C' : 'R';
  }

  ngOnInit(): void {
    this.portal = normalizePortal(this.route.snapshot.data['portal']);
    const tokenUrl = this.route.snapshot.queryParamMap.get('token');
    const tokenLocal = localStorage.getItem('token');

    if (tokenUrl) {
      this.fromEmail = true;
      this.token = tokenUrl;
    } else if (tokenLocal) {
      this.fromEmail = false;
      this.token = tokenLocal;
    } else {
      this.tokenInvalido = true;
      this.loading = false;
      return;
    }

    try {
      const decoded = jwtDecode<TokenClaims>(this.token);

      if (decoded.exp * 1000 < Date.now()) {
        this.tokenInvalido = true;
        this.loading = false;
        return;
      }

      this.correo = decoded.email;
      this.loading = false;

    } catch {
      this.tokenInvalido = true;
      this.loading = false;
    }
  }

  cambiarPassword(): void {
    if (!this.password || !this.confirmPassword) {
      this.showValidationMessage('Debe completar todos los campos');
      return;
    }

    if (!this.hasMinimumLength) {
      this.showValidationMessage('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    if (!this.hasLettersAndNumbers) {
      this.showValidationMessage('La contraseña debe combinar letras y números');
      return;
    }

    if (!this.hasSpecialCharacter) {
      this.showValidationMessage('La contraseña debe incluir al menos un carácter especial');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.showValidationMessage('Las contraseñas no coinciden');
      return;
    }

    this.saving = true;
    this.representanteService.updatePassword(this.token, this.password)
      .pipe(finalize(() => {
        this.saving = false;
        this.cdr.detectChanges();
      }))
      .subscribe({
        next: (res: any) => {

          if (res.isValid) {

            this.cambioExitoso = true;
            this.cdr.detectChanges();

            this.snackBar.open('La contraseña se cambió correctamente', 'Cerrar', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
            });

            // Si vino desde el correo → redirección automática
            if (this.fromEmail) {
              setTimeout(() => {
                this.router.navigateByUrl(PORTAL_ROUTES[this.portal].login);
              }, 3200);
            }

          } else {
            this.snackBar.open('No se pudo cambiar la contraseña', 'Cerrar', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
            });
          }
        },
        error: () => {
          this.snackBar.open('Ocurrió un error al actualizar la contraseña', 'Cerrar', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          });
        }
      });
  }

  private showValidationMessage(message: string): void {
    this.snackBar.open(message, 'Cerrar', {
      duration: 3500,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['snack-error'],
    });
  }

  volver() {
    if (this.fromEmail) {
      this.router.navigateByUrl(PORTAL_ROUTES[this.portal].forgotPassword);
    } else {
      this.router.navigateByUrl(PORTAL_ROUTES[this.portal].orders);
    }
  }
}
