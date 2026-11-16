import { TablePagination } from './portal-table';

describe('Shared table pagination', () => {
  it('handles empty, last and shrinking result sets without an invalid range', () => {
    const p = new TablePagination(); const rows = Array.from({length: 23}, (_, i) => i + 1);
    expect(p.rows(rows)).toEqual([1, 2, 3, 4, 5]); p.next(rows.length); expect(p.start(rows.length)).toBe(6);
    p.changeSize(10); expect(p.page).toBe(1); p.page = 3; expect(p.rows(rows)).toEqual([21, 22, 23]); p.next(rows.length); expect(p.page).toBe(3);
    expect(p.rows([9])).toEqual([9]); expect(p.start(1)).toBe(1); expect(p.end(1)).toBe(1);
    expect(p.rows([])).toEqual([]); expect(p.start(0)).toBe(0); expect(p.end(0)).toBe(0); p.previous(0); expect(p.page).toBe(1);
  });
});
