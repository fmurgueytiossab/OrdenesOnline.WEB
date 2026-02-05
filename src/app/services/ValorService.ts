import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Valor } from '../Model/Valor';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';


@Injectable({
  providedIn: 'root'
})
export class ValorService {

  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAll(): Observable<Valor[]> {
    return this.http.get<Valor[]>(`${this.apiUrl}/Valor`);;
  }

}
