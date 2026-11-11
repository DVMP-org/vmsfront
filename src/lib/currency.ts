/**
 * Money formatting.
 *
 * Amounts arrive from the API as decimal strings, so the helpers accept
 * `string | number`, never throw on bad input, and drop the decimals when the
 * amount is a whole number.
 */

export type AmountInput = string | number | null | undefined;

function toAmount(value: AmountInput): number | null {
    if (value === null || value === undefined || value === "") return null;
    const amount = Number(value);
    return Number.isFinite(amount) ? amount : null;
}

/** `₦15,000` for a whole amount, `₦15,000.50` otherwise. */
export function formatMoney(amount: AmountInput, currency?: string): string {
    const value = toAmount(amount);
    if (value === null) return "—";
    if (currency) {
        try {
            return new Intl.NumberFormat(undefined, {
                style: "currency",
                currency,
                maximumFractionDigits: value % 1 === 0 ? 0 : 2,
            }).format(value);
        } catch {
            /* Unknown currency code: fall through to a plain decimal. */
        }
    }
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

/** Plain decimal without a currency symbol, for inputs and totals. */
export function formatAmount(amount: AmountInput): string {
    const value = toAmount(amount);
    if (value === null) return "—";
    return value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export function sumAmounts(values: AmountInput[]): number {
    return values.reduce<number>((total, value) => total + (toAmount(value) ?? 0), 0);
}

export { toAmount };
