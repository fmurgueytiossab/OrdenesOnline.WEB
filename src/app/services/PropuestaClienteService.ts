import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { PropuestaCliente } from '../Model/PropuestaCliente';

@Injectable({
  providedIn: 'root',
})
export class PropuestaClienteService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  registrar(propuesta: PropuestaCliente): Observable<unknown> {
    return this.http.post(`${this.apiUrl}/PropuestaCliente`, propuesta);
  }
}
