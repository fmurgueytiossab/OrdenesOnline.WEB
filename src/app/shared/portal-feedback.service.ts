import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({providedIn: 'root'})
export class PortalFeedbackService {
  private readonly snackBar = inject(MatSnackBar);
  dismiss() {this.snackBar.dismiss();}
  error(message: string) {this.snackBar.open(message, 'Cerrar', {duration: 10000, horizontalPosition: 'center', verticalPosition: 'top'});}
  success(message: string) {this.snackBar.open(message, 'Cerrar', {duration: 6000, horizontalPosition: 'center', verticalPosition: 'top'});}
}
