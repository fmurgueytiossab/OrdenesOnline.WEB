import { Component } from '@angular/core';

@Component({
  selector: 'app-prueba',
  templateUrl: './prueba.html'
})
export class PruebaComponent {
  titulo = 'Componente de prueba';
  contador = 0;

  incrementar() {
    this.contador++;
  }
}