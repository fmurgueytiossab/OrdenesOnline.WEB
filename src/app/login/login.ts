import { ChangeDetectorRef, Component } from '@angular/core';
import { RepresentanteService } from '../services/RepresentanteService';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.html',
  styleUrls: ['./login.css'],
  imports: [
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    CommonModule,
     MatSnackBarModule,
  ]
})
export class LoginComponent {

  correo = '';
  password = '';
  error = '';

  constructor(
    private representanteService: RepresentanteService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
  const correoGuardado = localStorage.getItem('correo');
  if (correoGuardado) {
    this.correo = correoGuardado;
  }
}

login() {
  this.representanteService
    .validatePassword(this.correo, this.password)
    .subscribe({
      next: (response) => {
        if (response.isValid) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('correo', this.correo);
          this.router.navigate(['/formulario']);
        } else {
          this.snackBar.open('⚠️ Correo o contraseña inválidos', '', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['snack-error'] // puedes definir estilos personalizados en CSS
          });
        }
      },
      error: () => {
        this.snackBar.open('❌ Error al conectar con el servidor', '', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['snack-error']
        });
      }
    });
}

goToForgotPassword() {
  this.router.navigate(['/forgot-password']);
}

}
