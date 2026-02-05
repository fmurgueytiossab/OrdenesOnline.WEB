import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Propuesta } from '../Model/Propuesta';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class PropuestaService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  registrar(propuesta: Propuesta) {
  return this.http.post(`${this.apiUrl}/Propuesta`, propuesta);
}

}
