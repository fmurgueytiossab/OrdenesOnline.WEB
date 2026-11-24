import { Component, Input } from '@angular/core';
import { PortalDropdownComponent } from './portal-dropdown';

@Component({
  selector: 'app-responsible-list',
  standalone: true,
  imports: [PortalDropdownComponent],
  template: `
    @if (names.length > 1) {
      <app-portal-dropdown [label]="names.length + ' responsables'">
        <ul class="portal-dropdown-list" aria-label="Responsables permitidos">
          @for (name of names; track $index) { <li>{{ name }}</li> }
        </ul>
      </app-portal-dropdown>
    } @else {
      <span>{{ names[0] || '—' }}</span>
    }
  `,
})
export class ResponsibleListComponent {
  @Input() names: string[] = [];
}
