import { ChangeDetectorRef, Component } from '@angular/core';
import { RepresentanteService } from '../services/RepresentanteService';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

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
    CommonModule
  ]
})
export class LoginComponent {

  correo = '';
  password = '';
  error = '';

  constructor(
    private representanteService: RepresentanteService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
  const correoGuardado = localStorage.getItem('correo');
  if (correoGuardado) {
    this.correo = correoGuardado;
  }
}

login() {
  this.error = '';

  this.representanteService
    .validatePassword(this.correo, this.password)
    .subscribe({
      next: (response) => {
        if (response.isValid) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('correo', this.correo);
          this.router.navigate(['/formulario']);
        } else {
          this.error = 'Correo o contraseña inválidos';
          this.cdr.detectChanges(); // 👈 CLAVE
        }
      },
      error: () => {
        this.error = 'Error al conectar con el servidor';
        this.cdr.detectChanges(); // 👈 TAMBIÉN
      }
    });
}
}
