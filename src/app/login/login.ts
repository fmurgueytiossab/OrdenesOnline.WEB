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
  isBlocked = false;

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

  if (this.isBlocked) {
    return;
  }

  this.isBlocked = true;

  this.representanteService
    .validatePassword(this.correo, this.password)
    .subscribe({
      next: (response) => {
        if (response.isValid) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('correo', this.correo);
          this.router.navigate(['/formulario']);
        } else {
          this.showError('⚠️ Correo o contraseña inválidos');
        }
        this.unblockAfterDelay();
      },
      error: () => {
        this.showError('❌ Error al conectar con el servidor');
        this.unblockAfterDelay();
      }
    });
}

private unblockAfterDelay() {
  setTimeout(() => {
    this.isBlocked = false;
    this.cdr.detectChanges(); // ← aquí
  }, 3000);
}

private showError(message: string) {
  this.snackBar.open(message, '', {
    duration: 3000,
    horizontalPosition: 'center',
    verticalPosition: 'top',
    panelClass: ['snack-error']
  });
}



goToForgotPassword() {
  this.router.navigate(['/forgot-password']);
}

}
