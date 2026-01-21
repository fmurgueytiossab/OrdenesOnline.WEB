import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Valor } from '../Model/Valor';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class ValorService {

  private url = 'https://localhost:7213/api/valor';

  constructor(private http: HttpClient) {}

  getAll(): Observable<Valor[]> {
    return this.http.get<Valor[]>(this.url);
  }

}
