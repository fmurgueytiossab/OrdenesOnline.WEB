import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { environment } from '../../../environments/environment';
import { MarketHoursService, MarketHoursSnapshot } from './market-hours.service';

describe('MarketHoursService server clock', () => {
  let service: MarketHoursService;
  let http: HttpTestingController;
  let monotonic: number;
  const url = `${environment.apiUrl}/MarketHours`;
  const open: MarketHoursSnapshot = {
    serverNow: '2026-09-07T14:59:59-05:00', today: '2026-09-07',
    opensAt: '2026-09-07T06:00:00-05:00', closesAt: '2026-09-07T15:00:00-05:00',
    isOpen: true, nextOpenAt: '2026-09-08T06:00:00-05:00', validForDate: '2026-09-07',
    nextTransitionAt: '2026-09-07T15:00:00-05:00', applyToAllMarkets: true,
  };

  beforeEach(() => {
    vi.useFakeTimers();
    monotonic = 0;
    vi.spyOn(performance, 'now').mockImplementation(() => monotonic);
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(MarketHoursService);
    http = TestBed.inject(HttpTestingController);
    vi.advanceTimersByTime(0);
  });

  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('expires the open state at the cutoff and retrieves the next-session validity', () => {
    http.expectOne(url).flush(open);
    expect(service.current()?.isOpen).toBe(true);
    monotonic = 1000;
    vi.advanceTimersByTime(1000);
    expect(service.current()).toBeNull();
    http.expectOne(url).flush({
      ...open, serverNow: '2026-09-07T15:00:00-05:00', isOpen: false,
      validForDate: '2026-09-08', nextTransitionAt: open.nextOpenAt,
    });
    expect(service.current()?.isOpen).toBe(false);
    expect(service.current()?.validForDate).toBe('2026-09-08');
  });

  it('uses elapsed server time even when the computer date is changed', () => {
    http.expectOne(url).flush({ ...open, serverNow: '2026-09-07T12:00:00-05:00' });
    vi.setSystemTime(new Date('2040-01-01T00:00:00Z'));
    monotonic = 1000;
    vi.advanceTimersByTime(1000);
    expect(service.current()?.today).toBe('2026-09-07');
    expect(service.current()?.isOpen).toBe(true);
  });

  it('clears stale state on failure and permits an explicit retry', () => {
    http.expectOne(url).flush(open);
    service.refresh();
    http.expectOne(url).flush({}, { status: 503, statusText: 'Unavailable' });
    expect(service.current()).toBeNull();
    expect(service.failed()).toBe(true);
    service.refresh();
    http.expectOne(url).flush(open);
    expect(service.failed()).toBe(false);
    expect(service.current()?.isOpen).toBe(true);
  });
});
