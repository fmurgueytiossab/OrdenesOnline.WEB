import { ChangeDetectorRef, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { EmailService } from '../services/EmailService';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';


@Component({
  selector: 'ForgotPassword',
  standalone: true,
  templateUrl: './ForgotPassword.html',
  styleUrls: ['./ForgotPassword.css'],
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
export class ForgotPasswordComponent {

  correo = '';

  enviando = false;        // mientras llama al servicio
  enviadoExitoso = false;

  constructor(
    private emailService: EmailService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef
  ) {}

enviar() {

  if (this.enviando || this.enviadoExitoso) return;

  if (!this.correo) {
    this.snackBar.open('⚠️ Debe ingresar un correo electrónico', 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
    return;
  }

  const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.correo);
  if (!correoValido) {
    this.snackBar.open('⚠️ Ingrese un correo válido', 'Cerrar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
    return;
  }

  this.enviando = true;

  this.emailService.sendPasswordReset(this.correo).subscribe({
    next: (res: any) => {
      this.enviando = false;
      this.enviadoExitoso = true;

      this.snackBar.open(res.mensaje, 'Cerrar', {
        duration: 4000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
      });
    },
    error: (err) => {
      this.enviando = false;

      this.snackBar.open(err?.error?.mensaje ?? 'Error interno', 'Cerrar', {
        duration: 4000,
        horizontalPosition: 'right',
        verticalPosition: 'top',
      });
    }
  });
}

  volverLogin() {
    this.router.navigate(['/']);
  }
}

