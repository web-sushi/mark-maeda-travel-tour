// TODO: Add Stripe helper functions
// - Create checkout session
// - Handle webhook events
// - Generate payment links
// - Calculate fees

export function formatStripeAmount(amount: number): number {
  // Convert dollars to cents
  return Math.round(amount * 100);
}

export function formatStripeAmountFromCents(cents: number): number {
  // Convert cents to dollars
  return cents / 100;
}
