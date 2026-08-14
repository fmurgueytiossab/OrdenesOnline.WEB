import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

type ReviewDecision = 'PENDING' | 'ACCEPTED' | 'REJECTED';
type ConfirmationMode = 'accept' | 'reject' | null;

interface ProposalReview {
  proposalNumber: number;
  operation: string;
  instrument: string;
  market: string;
  orderType: string;
  quantity: number;
  price: number;
  amount: number;
  currency: string;
  validity: string;
  clientCode: string;
  receivedAt: Date;
}

@Component({
  selector: 'app-proposal-review',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './proposal-review.html',
  styleUrl: './proposal-review.css',
})
export class ProposalReviewComponent {
  readonly reviewToken: string | null;
  readonly proposal: ProposalReview = {
    proposalNumber: 2,
    operation: 'Compra',
    instrument: 'VOLCABC1',
    market: 'BVL',
    orderType: 'Límite',
    quantity: 1000,
    price: 2,
    amount: 2000,
    currency: 'soles',
    validity: 'Por hoy : 13/8/2026',
    clientCode: '026775',
    receivedAt: new Date(2026, 7, 13, 10, 35),
  };

  decision: ReviewDecision = 'PENDING';
  confirmationMode: ConfirmationMode = null;
  rejectionReason = '';

  constructor(route: ActivatedRoute) {
    this.reviewToken = route.snapshot.queryParamMap.get('token');
  }

  get hasReviewAccess(): boolean {
    return Boolean(this.reviewToken?.trim());
  }

  get canReject(): boolean {
    return this.rejectionReason.trim().length >= 5;
  }

  openAcceptConfirmation(): void {
    if (this.decision !== 'PENDING') return;
    this.confirmationMode = 'accept';
  }

  openRejectConfirmation(): void {
    if (this.decision !== 'PENDING') return;
    this.rejectionReason = '';
    this.confirmationMode = 'reject';
  }

  closeConfirmation(): void {
    this.confirmationMode = null;
    this.rejectionReason = '';
  }

  confirmAccept(): void {
    this.decision = 'ACCEPTED';
    this.confirmationMode = null;
  }

  confirmReject(): void {
    if (!this.canReject) return;
    this.decision = 'REJECTED';
    this.confirmationMode = null;
  }
}
