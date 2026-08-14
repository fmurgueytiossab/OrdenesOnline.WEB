import { convertToParamMap } from '@angular/router';

import { ProposalReviewComponent } from './proposal-review';

describe('ProposalReviewComponent', () => {
  const createComponent = (token: string | null) => new ProposalReviewComponent({
    snapshot: { queryParamMap: convertToParamMap(token ? { token } : {}) },
  } as never);

  it('requires a review token to display the proposal', () => {
    expect(createComponent(null).hasReviewAccess).toBe(false);
    expect(createComponent('review-token').hasReviewAccess).toBe(true);
  });

  it('accepts a pending proposal in the mock flow', () => {
    const component = createComponent('review-token');

    component.openAcceptConfirmation();
    component.confirmAccept();

    expect(component.decision).toBe('ACCEPTED');
  });

  it('requires a reason before rejecting the proposal', () => {
    const component = createComponent('review-token');
    component.openRejectConfirmation();
    component.rejectionReason = 'No';
    component.confirmReject();
    expect(component.decision).toBe('PENDING');

    component.rejectionReason = 'Cantidad incorrecta';
    component.confirmReject();
    expect(component.decision).toBe('REJECTED');
  });
});
