import { Component, Input } from '@angular/core';
import { OverlayModule } from '@angular/cdk/overlay';
import { MatButtonModule } from '@angular/material/button';

let listId = 0;
@Component({selector: 'app-responsible-list', standalone: true, imports: [OverlayModule, MatButtonModule],
  template: `@if (names.length > 1) {
    <button mat-stroked-button type="button" class="responsibles-trigger" cdkOverlayOrigin #origin="cdkOverlayOrigin" (click)="open = !open" [attr.aria-expanded]="open" [attr.aria-controls]="open ? id : null">{{names.length}} responsables <span aria-hidden="true">⌄</span></button>
    <ng-template cdkConnectedOverlay [cdkConnectedOverlayOrigin]="origin" [cdkConnectedOverlayOpen]="open" [cdkConnectedOverlayHasBackdrop]="true" cdkConnectedOverlayBackdropClass="cdk-overlay-transparent-backdrop" (backdropClick)="open = false" (detach)="open = false" (overlayKeydown)="key($event)">
      <ul class="responsibles-panel" [id]="id" aria-label="Responsables permitidos">@for (name of names; track $index) {<li>{{name}}</li>}</ul>
    </ng-template>
  } @else {<span>{{names[0] || '—'}}</span>}`,
  styles: [`.responsibles-trigger{font-size:13px;white-space:nowrap;border-radius:8px}.responsibles-trigger span{margin-left:10px}.responsibles-panel{box-sizing:border-box;list-style:none;margin:6px 0;padding:8px;background:white;border:1px solid #e4e7ec;border-radius:10px;box-shadow:0 12px 28px #10182826;min-width:220px;max-width:min(380px,calc(100vw - 32px));max-height:280px;overflow:auto;color:#344054;font:14px Roboto,Arial,sans-serif}.responsibles-panel li{padding:10px 12px;line-height:1.4;overflow-wrap:anywhere}.responsibles-panel li+li{border-top:1px solid #f2f4f7}`]})
export class ResponsibleListComponent {
  @Input() names: string[] = [];
  open = false; readonly id = `responsibles-${++listId}`;
  key(event: KeyboardEvent) { if (event.key === 'Escape' || event.key === 'Tab') {this.open = false; event.stopPropagation();} }
}
