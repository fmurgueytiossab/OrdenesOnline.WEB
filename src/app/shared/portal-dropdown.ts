import { DOCUMENT } from '@angular/common';
import { ConnectedPosition, Overlay, OverlayModule } from '@angular/cdk/overlay';
import { Component, Input, inject, signal } from '@angular/core';

let nextPanelId = 0;

@Component({
  selector: 'app-portal-dropdown',
  standalone: true,
  imports: [OverlayModule],
  template: `
    <button type="button" class="portal-dropdown-trigger" #trigger cdkOverlayOrigin #origin="cdkOverlayOrigin"
      [disabled]="disabled" [attr.aria-label]="accessibleLabel || null"
      [attr.aria-describedby]="describedBy || null" [attr.aria-expanded]="open()"
      [attr.aria-controls]="open() ? panelId : null" (click)="toggle()">
      <span>{{ label }}</span>
      <svg viewBox="0 0 20 20" aria-hidden="true"><path d="m5.5 8 4.5 4.5L14.5 8" /></svg>
    </button>

    <ng-template cdkConnectedOverlay [cdkConnectedOverlayOrigin]="origin" [cdkConnectedOverlayOpen]="open() && !disabled"
      [cdkConnectedOverlayPositions]="positions" [cdkConnectedOverlayPush]="true"
      [cdkConnectedOverlayViewportMargin]="12" [cdkConnectedOverlayScrollStrategy]="scrollStrategy"
      [cdkConnectedOverlayDisableClose]="true" (attach)="focusPanel(trigger)" (detach)="open.set(false)"
      (overlayOutsideClick)="closeOutside($event, origin.elementRef.nativeElement)"
      (overlayKeydown)="handleKey($event)">
      <div class="portal-dropdown-panel" [id]="panelId" role="group" [attr.aria-label]="accessibleLabel || label"
        tabindex="-1" (focusout)="closeOnFocusOut($event, panel)" #panel>
        <ng-content />
      </div>
    </ng-template>
  `,
  styles: [`
    :host { display: inline-block; max-width: 100%; }
    .portal-dropdown-trigger {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: .5rem;
      width: var(--portal-dropdown-trigger-width, auto);
      min-height: 2.2rem;
      max-width: 100%;
      padding: .35rem .65rem;
      border: 1px solid #d0d5dd;
      border-radius: .65rem;
      background: #fff;
      color: #172033;
      font: inherit;
      font-size: .8rem;
      font-weight: 700;
      line-height: 1.3;
      text-align: left;
      white-space: nowrap;
      cursor: pointer;
    }
    .portal-dropdown-trigger span { overflow: hidden; text-overflow: ellipsis; }
    .portal-dropdown-trigger svg {
      flex: 0 0 1rem;
      width: 1rem;
      height: 1rem;
      fill: none;
      stroke: currentColor;
      stroke-width: 1.65;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .portal-dropdown-trigger:hover:not(:disabled) { background: #f7f9fc; }
    .portal-dropdown-trigger[aria-expanded="true"] {
      color: #1747c9;
      background: #eef4ff;
      border-color: #c7d7fe;
    }
    .portal-dropdown-trigger[aria-expanded="true"] svg { transform: rotate(180deg); }
    .portal-dropdown-trigger:focus-visible { outline: 2px solid #1f5eff; outline-offset: 2px; }
    .portal-dropdown-trigger:disabled { opacity: .6; cursor: not-allowed; }
  `],
})
export class PortalDropdownComponent {
  @Input({ required: true }) label = '';
  @Input() accessibleLabel = '';
  @Input() describedBy = '';
  @Input() disabled = false;

  private readonly document = inject(DOCUMENT);
  readonly open = signal(false);
  readonly panelId = `portal-dropdown-${++nextPanelId}`;
  readonly scrollStrategy = inject(Overlay).scrollStrategies.close();
  readonly positions: ConnectedPosition[] = [
    { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 6 },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -6 },
  ];
  private trigger: HTMLButtonElement | null = null;

  toggle(): void {
    if (this.open()) this.close();
    else if (!this.disabled) this.open.set(true);
  }

  close(restoreFocus = true): void {
    this.open.set(false);
    if (restoreFocus) this.trigger?.focus({ preventScroll: true });
  }

  closeOutside(event: MouseEvent, origin: HTMLElement): void {
    if (!origin.contains(event.target as Node | null)) this.close(false);
  }

  closeOnFocusOut(event: FocusEvent, panel: HTMLElement): void {
    const next = event.relatedTarget as Node | null;
    if (next && next !== this.trigger && !panel.contains(next)) this.close(false);
  }

  focusPanel(trigger: HTMLButtonElement): void {
    this.trigger = trigger;
    const panel = this.document.getElementById(this.panelId);
    (panel?.querySelector<HTMLElement>('button:not(:disabled)') ?? panel)?.focus({ preventScroll: true });
  }

  handleKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.close();
      return;
    }
    if (!['Tab', 'ArrowDown', 'ArrowUp'].includes(event.key)) return;

    const panel = this.document.getElementById(this.panelId);
    const options = [...(panel?.querySelectorAll<HTMLElement>('button:not(:disabled)') ?? [])];
    const current = options.findIndex(option => option === this.document.activeElement);
    if (event.key === 'Tab') {
      if (!options.length || (event.shiftKey ? current <= 0 : current === options.length - 1)) this.close();
      return;
    }
    if (!options.length) return;

    event.preventDefault();
    const next = current < 0 ? (event.key === 'ArrowDown' ? 0 : options.length - 1)
      : (current + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length;
    options[next].focus();
  }
}
