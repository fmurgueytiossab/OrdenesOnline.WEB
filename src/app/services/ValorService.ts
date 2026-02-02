import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Valor } from '../Model/Valor';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class ValorService {

  private apiUrl = 'https://10.80.1.15/api';
  //private apiUrl = 'https://localhost:7213/api/valor';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Valor[]> {
    return this.http.get<Valor[]>(this.apiUrl);
  }

}
