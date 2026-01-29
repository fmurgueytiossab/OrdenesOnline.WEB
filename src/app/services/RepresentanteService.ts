import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Representante } from '../Model/Representante';
import { LoginResponse } from '../Model/LoginResponse';

@Injectable({
  providedIn: 'root'
})
export class RepresentanteService {

  private apiUrl = 'https://localhost:7213/api';

  constructor(private http: HttpClient) {}

validatePassword(correo: string, password: string): Observable<LoginResponse> {
  return this.http.post<LoginResponse>(
    `${this.apiUrl}/Representante/validate-password`,
    { correo, password }
  );
}

  getMe(): Observable<Representante> {
    return this.http.get<Representante>(`${this.apiUrl}/Representante/me`);
  }

  updatePassword(token: string, password: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/Representante/update-password`,
      { token, password }
    );
  }
}
