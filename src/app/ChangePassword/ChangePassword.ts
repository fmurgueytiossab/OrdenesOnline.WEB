import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { RepresentanteService } from '../services/RepresentanteService';
import { EmailService } from '../services/EmailService';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

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
export class ChangePasswordComponent {

  token = '';
  tokenInvalido = false;

  correo = '';
  password = '';
  confirmPassword = '';

  loading = true; // evitar mostrar formulario hasta validar
  cambioExitoso = false;

  mensaje = ''; // mensaje de éxito para el div
  error = '';   // mensaje de error para Snackbar

  constructor(
    private representanteService: RepresentanteService,
    private emailService : EmailService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';

    if (!this.token) {
      this.tokenInvalido = true;
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    this.emailService.validatePasswordToken(this.token).subscribe({
      next: (res) => {
        this.correo = res.email;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.tokenInvalido = true;
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  cambiarPassword() {
    if (!this.password || !this.confirmPassword) {
      this.snackBar.open('Debe completar todos los campos', 'Cerrar', {
        duration: 4000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
      });
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.snackBar.open('Las contraseñas no coinciden', 'Cerrar', {
        duration: 4000,
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
            this.mensaje = 'La contraseña se actualizó correctamente';
            this.cdr.detectChanges(); // ⬅ actualizar la vista
          } else {
            this.snackBar.open('No se pudo cambiar la contraseña', 'Cerrar', {
              duration: 4000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
            });
          }
        },
        error: () => {
          this.snackBar.open('Ocurrió un error al actualizar la contraseña', 'Cerrar', {
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          });
        }
      });
  }

  volverLogin() {
    this.router.navigate(['/']);
  }
}
