import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EmailService {

  private apiUrl = 'https://10.80.1.15/api';

  constructor(private http: HttpClient) {}

  sendPasswordReset(correo: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/Email/send-validation`,
      {  email: correo }
    );
  }

  validatePasswordToken(token: string): Observable<{ email: string }> {
    return this.http.get<{ email: string }>(
      `${this.apiUrl}/Email/validate`,
      { params: { token } }
    );
  }
}
