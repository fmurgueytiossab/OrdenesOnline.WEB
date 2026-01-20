import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Representante } from '../Model/Representante';
import { LoginResponse } from '../Model/LoginResponse';

@Injectable({
  providedIn: 'root'
})
export class RepresentanteService {

  private url = 'https://localhost:7213/api/Representante';

  constructor(private http: HttpClient) {}

validatePassword(correo: string, password: string): Observable<LoginResponse> {
  return this.http.post<LoginResponse>(
    `${this.url}/validate-password`,
    {
      correo,
      password
    }
  );
}


  getById(id: number) {
  return this.http.get<Representante>(
    `${this.url}/${id}`
  );
}

}
