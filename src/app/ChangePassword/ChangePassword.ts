import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { RepresentanteService } from '../services/RepresentanteService';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { jwtDecode } from 'jwt-decode';

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
    MatCardModule,
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
  cambioExitoso = false;

  fromEmail = false;

  constructor(
    private representanteService: RepresentanteService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
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

  cambiarPassword() {
    if (!this.password || !this.confirmPassword) {
      this.snackBar.open('Debe completar todos los campos', 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
      });
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.snackBar.open('Las contraseñas no coinciden', 'Cerrar', {
        duration: 3000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
      });
      return;
    }

    this.representanteService.updatePassword(this.token, this.password)
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
                this.router.navigate(['/']);
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

  volver() {
    if (this.fromEmail) {
      this.router.navigate(['/']);
    } else {
      this.router.navigate(['/formulario']);
    }
  }
}
