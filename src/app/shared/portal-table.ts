import { CdkScrollable } from '@angular/cdk/scrolling';
import { Component, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';

export class TablePagination {
  page = 1;
  size = 5;
  readonly sizes = [5, 10, 20];
  pages(total: number) { return Math.max(1, Math.ceil(total / this.size)); }
  current(total: number) { return Math.max(1, Math.min(this.page, this.pages(total))); }
  start(total: number) { return total ? (this.current(total) - 1) * this.size + 1 : 0; }
  end(total: number) { return Math.min(this.current(total) * this.size, total); }
  rows<T>(rows: readonly T[]): readonly T[] { const start = (this.current(rows.length) - 1) * this.size; return rows.slice(start, start + this.size); }
  changeSize(size: number) { this.size = size; this.reset(); }
  reset() { this.page = 1; }
  previous(total: number) { this.page = Math.max(1, this.current(total) - 1); }
  next(total: number) { this.page = Math.min(this.pages(total), this.current(total) + 1); }
}

@Component({selector: 'app-portal-table', standalone: true, imports: [CdkScrollable, FormsModule, MatButtonModule, MatFormFieldModule, MatSelectModule],
  template: `<div class="portal-table">
    <div class="portal-table-scroll" cdkScrollable [class.extended-page]="pagination.size > 5" role="region" [attr.aria-label]="'Tabla de ' + label" tabindex="0"><ng-content /></div>
    <div class="portal-table-pagination"><span role="status">Mostrando {{pagination.start(total)}} – {{pagination.end(total)}} / {{total}}</span>
      <div class="pagination-controls"><mat-form-field class="pagination-size" appearance="outline" subscriptSizing="dynamic"><mat-label>Filas por página</mat-label><mat-select [ngModel]="pagination.size" (ngModelChange)="pagination.changeSize($event)" panelClass="tracking-select-panel">@for (size of pagination.sizes; track size) {<mat-option [value]="size">{{size}}</mat-option>}</mat-select></mat-form-field>
        <nav [attr.aria-label]="'Paginación de ' + label"><button mat-stroked-button type="button" (click)="pagination.previous(total)" [disabled]="pagination.current(total) <= 1">Anterior</button><button mat-stroked-button type="button" (click)="pagination.next(total)" [disabled]="pagination.current(total) >= pagination.pages(total)">Siguiente</button></nav>
      </div>
    </div>
  </div>`,
  styles: [`:host{display:block;min-width:0;max-width:100%}.portal-table{border:1px solid #e4e7ec;border-radius:10px;overflow:hidden;background:#fff}.portal-table-scroll{overflow:auto;max-width:100%;overscroll-behavior:contain}.portal-table-scroll.extended-page{max-height:22rem}.portal-table-scroll:focus-visible{outline:2px solid #84adff;outline-offset:-2px}.portal-table-pagination{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap;padding:16px;font-size:13px;color:#667085;border-top:1px solid #e4e7ec}.pagination-controls{display:flex;align-items:center;gap:16px;flex-wrap:wrap;max-width:100%}.pagination-controls .pagination-size{flex:none;width:min(10.5rem,100%);--mat-form-field-container-height:2.55rem;--mat-form-field-container-vertical-padding:.6rem;--mat-select-trigger-text-size:.875rem}.pagination-controls nav{display:flex;gap:10px;flex-wrap:wrap}.pagination-controls button{font:inherit;border:1px solid #d0d5dd;border-radius:9px;min-height:2.55rem;padding:8px 13px;background:#fff;color:#344054;cursor:pointer;transition:background-color .15s,border-color .15s}.pagination-controls button:not(:disabled):hover{background:#eef4ff;border-color:#84adff;color:#1849a9}.pagination-controls button:disabled{opacity:.5;cursor:default}.pagination-controls button:focus-visible{outline:3px solid #84adff;outline-offset:2px}@media(max-width:650px){.portal-table-pagination{align-items:flex-start}.pagination-controls{gap:12px}}`]})
export class PortalTableComponent {
  @Input({required: true}) pagination!: TablePagination;
  @Input() total = 0;
  @Input() label = 'registros';
}
