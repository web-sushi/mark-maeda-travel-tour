// TODO: Add money formatting and calculation utilities

export function formatCurrency(amount: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}

export function calculateDeposit(total: number, percentage: number): number {
  return Math.round(total * (percentage / 100) * 100) / 100;
}

export function calculateBalance(total: number, paid: number): number {
  return Math.max(0, total - paid);
}
