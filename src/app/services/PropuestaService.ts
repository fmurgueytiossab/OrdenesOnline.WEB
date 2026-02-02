import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Propuesta } from '../Model/Propuesta';


@Injectable({
  providedIn: 'root'
})
export class PropuestaService {

  private apiUrl = 'https://10.80.1.15/api';
  //private apiUrl = 'https://localhost:7213/api';

  constructor(private http: HttpClient) {}

  registrar(propuesta: Propuesta) {
  return this.http.post(`${this.apiUrl}/Propuesta`, propuesta);
}

}
