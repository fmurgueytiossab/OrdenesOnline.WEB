import { Component } from '@angular/core';
import { RepresentanteService } from '../services/RepresentanteService';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

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
    MatButtonModule
  ]
})
export class LoginComponent {

  correo = '';
  password = '';
  error = '';

  constructor(
    private representanteService: RepresentanteService,
    private router: Router
  ) {}

  ngOnInit() {
  this.correo = localStorage.getItem('correo') ?? '';
  this.password = localStorage.getItem('password') ?? '';
}

  login() {
    this.representanteService.validatePassword(this.correo, this.password)
      .subscribe({
        next: (response) => {
          if (response.isValid) {
            // ⚠️ debe llamarse userId (como lo devuelve el backend)
            localStorage.setItem('userId', response.userId.toString());
            localStorage.setItem('correo', this.correo);
            localStorage.setItem('password', this.password);
            
            this.router.navigate(['/formulario']);
          } else {
            this.error = 'Credenciales inválidas';
          }
        },
        error: () => {
          this.error = 'Error al conectar con el servidor';
        }
      });
  }
}
