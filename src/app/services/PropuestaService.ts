import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Propuesta } from '../Model/Propuesta';


@Injectable({
  providedIn: 'root'
})
export class PropuestaService {

  private url = 'https://localhost:7213/api/propuesta';

  constructor(private http: HttpClient) {}

  registrar(propuesta: Propuesta) {
    return this.http.post(this.url, propuesta);
  }

}
