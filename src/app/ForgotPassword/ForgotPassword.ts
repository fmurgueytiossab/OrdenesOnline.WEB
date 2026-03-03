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
import { finalize } from 'rxjs/operators';

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
  enviando = false;

  constructor(
    private emailService: EmailService,
    private router: Router,
    private snackBar: MatSnackBar,
    private cdr: ChangeDetectorRef,
  ) {}

enviar() {

  if (this.enviando) return;

  if (!this.correo) {
    this.mostrarMensaje('⚠️ Debe ingresar un correo electrónico');
    return;
  }

  const correoValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.correo);
  if (!correoValido) {
    this.mostrarMensaje('⚠️ Ingrese un correo válido');
    return;
  }

  this.enviando = true;

  this.emailService.sendPasswordReset(this.correo)
    .subscribe({
      next: (res: any) => {

        const snackRef = this.snackBar.open(
          res?.mensaje || 'Correo enviado correctamente',
          'Cerrar',
          {
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          }
        );

        snackRef.afterDismissed().subscribe(() => {
          this.enviando = false;
          this.cdr.markForCheck();
        });

      },
      error: (err) => {

        const snackRef = this.snackBar.open(
          err?.error?.mensaje || 'Error interno',
          'Cerrar',
          {
            duration: 4000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          }
        );

        snackRef.afterDismissed().subscribe(() => {
          this.enviando = false;
          this.cdr.markForCheck();
        });

      }
    });
}

  private mostrarMensaje(mensaje: string) {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  volverLogin() {
    this.router.navigate(['']);
  }
}