import { TestBed } from '@angular/core/testing';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor portal redirects', () => {
  afterEach(() => {
    TestBed.inject(HttpTestingController).verify();
    localStorage.removeItem('token');
  });

  for (const [url, loginUrl] of [
    ['/clientes', '/Clientes'],
    ['/CLIENTES', '/Clientes'],
    ['/Representantes', '/Representantes'],
  ]) {
    it('keeps an unauthorized request in the portal for ' + url, () => {
      const router = { url, navigateByUrl: vi.fn().mockResolvedValue(true) };
      TestBed.configureTestingModule({ providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        { provide: Router, useValue: router },
      ] });
      localStorage.setItem('token', 'expired-token');
      const failure = vi.fn();
      TestBed.inject(HttpClient).get('/api/diagnostic').subscribe({ error: failure });
      TestBed.inject(HttpTestingController).expectOne('/api/diagnostic')
        .flush({}, { status: 401, statusText: 'Unauthorized' });
      expect(router.navigateByUrl).toHaveBeenCalledWith(loginUrl);
      expect(localStorage.getItem('token')).toBeNull();
      expect(failure).toHaveBeenCalledOnce();
    });
  }
});
