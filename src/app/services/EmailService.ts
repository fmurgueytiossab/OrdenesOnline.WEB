import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmailService {

   private apiUrl = environment.apiUrl;

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
