import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';
import { ClienteSearchResult } from '../Model/ClienteSearchResult';

@Injectable({ providedIn: 'root' })
export class ClienteService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  buscar(query: string, limit = 20): Observable<ClienteSearchResult[]> {
    const params = new HttpParams()
      .set('q', query.trim())
      .set('limit', limit.toString());

    return this.http.get<ClienteSearchResult[]>(`${this.apiUrl}/Cliente/buscar`, { params });
  }
}
