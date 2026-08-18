// Pure money-math helpers — no I/O. `computeNetProfit` mirrors the exact
// formula in the `net_profit` generated column in schema.sql, so the
// add-booking form can show a live preview before the row is even saved.
// Kept in one place (this comment + the SQL comment on the generated
// column) so the two don't drift.

export type BookingCosts = {
  gross_payout: number;
  platform_fee_pct: number;
  cleaning_fee: number;
  other_costs: number;
};

export function computeNetProfit(booking: BookingCosts): number {
  const feeAmount = (booking.gross_payout * booking.platform_fee_pct) / 100;
  const net = booking.gross_payout - feeAmount - booking.cleaning_fee - booking.other_costs;
  return Math.round(net * 100) / 100;
}

export function formatMoney(amount: number): string {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(amount);
}
