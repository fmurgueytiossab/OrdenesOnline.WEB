import { DOCUMENT } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

let nextId = 0;
@Component({selector: 'app-portal-modal', standalone: true, imports: [A11yModule, MatButtonModule],
  template: `<div class="dialog-backdrop" (click)="close()"><section class="dialog" [class.compact]="compact" role="dialog" aria-modal="true" [attr.aria-labelledby]="titleId" cdkTrapFocus [cdkTrapFocusAutoCapture]="true" (click)="$event.stopPropagation()" (keydown.escape)="escape($event)"><header><h2 [id]="titleId">{{title}}</h2><button mat-icon-button type="button" aria-label="Cerrar ventana" [disabled]="busy" (click)="close()">×</button></header><div class="dialog-content"><ng-content /></div></section></div>`,
  styles: [`:host{position:relative;z-index:900}.dialog-backdrop{box-sizing:border-box;position:fixed;inset:0;z-index:900;background:#10182888;backdrop-filter:blur(3px);display:flex;align-items:center;justify-content:center;padding:20px}.dialog{box-sizing:border-box;margin:0;flex-shrink:0;background:white;color:#182230;border-radius:18px;width:min(960px,100%);max-height:calc(100dvh - 40px);display:flex;flex-direction:column;box-shadow:0 24px 60px #10182844;overflow:hidden}.dialog.compact{width:min(480px,100%)}.dialog>header{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:18px 24px;border-bottom:1px solid #e4e7ec}.dialog h2{margin:0;font-size:21px}.dialog header button{font-size:28px}.dialog-content{padding:24px;overflow:auto;overscroll-behavior:contain}.dialog header button:hover{background:#f2f4f7}@media(max-width:600px){.dialog-backdrop{padding:10px}.dialog{max-height:calc(100dvh - 20px)}.dialog-content{padding:18px}}`]})
export class PortalModalComponent implements OnInit, OnDestroy {
  @Input() title = ''; @Input() compact = false; @Input() busy = false; @Output() closed = new EventEmitter<void>();
  readonly titleId = `portal-modal-${++nextId}`;
  private readonly document = inject(DOCUMENT); private previousOverflow = '';
  ngOnInit() {this.previousOverflow = this.document.body.style.overflow; this.document.body.style.overflow = 'hidden';}
  ngOnDestroy() {this.document.body.style.overflow = this.previousOverflow;}
  close() {if (!this.busy) this.closed.emit();}
  escape(event: Event) {event.stopPropagation(); this.close();}
}
