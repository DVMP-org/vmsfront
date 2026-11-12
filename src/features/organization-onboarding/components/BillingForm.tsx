"use client";

import { useId, useState } from "react";
import {
    ChevronDown,
    ChevronUp,
    FileText,
    Globe,
    Mail,
    MapPin,
    Receipt,
} from "lucide-react";

import { Field, fieldControlClassName } from "@/components/ui/form/Field";

import {
    BILLING_COUNTRIES,
    validateBillingForm,
    type BillingFormState,
} from "../lib";

/**
 * Invoice details for a paid plan. Collapsible so a free plan never shows a
 * form that is not needed, and every field keeps its label and error text.
 */
export function BillingForm({
    billing,
    onChange,
    errors,
}: {
    billing: BillingFormState;
    onChange: (field: keyof BillingFormState, value: string) => void;
    errors: Partial<Record<keyof BillingFormState, string>>;
}) {
    const [expanded, setExpanded] = useState(true);
    const bodyId = useId();
    const complete = Object.keys(validateBillingForm(billing)).length === 0;

    return (
        <section
            aria-labelledby="billing-form-title"
            className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)]"
        >
            <button
                type="button"
                onClick={() => setExpanded((current) => !current)}
                aria-expanded={expanded}
                aria-controls={bodyId}
                className="flex w-full items-center justify-between gap-3 rounded-[var(--vms-radius-surface)] p-5 text-left transition hover:bg-[var(--vms-surface-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--vms-focus)] focus-visible:ring-offset-2"
            >
                <span className="flex items-center gap-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-[var(--vms-radius-control)] bg-[var(--vms-surface-subtle)] text-[var(--vms-action)]">
                        <FileText className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span>
                        <span
                            id="billing-form-title"
                            className="block text-sm font-semibold text-[var(--vms-ink)]"
                        >
                            Billing information
                        </span>
                        <span className="mt-0.5 block text-xs text-[var(--vms-ink-muted)]">
                            {complete
                                ? "Complete — this is what appears on your invoices."
                                : "Required to generate invoices for this plan."}
                        </span>
                    </span>
                </span>
                {expanded ? (
                    <ChevronUp
                        className="h-4 w-4 shrink-0 text-[var(--vms-ink-muted)]"
                        aria-hidden="true"
                    />
                ) : (
                    <ChevronDown
                        className="h-4 w-4 shrink-0 text-[var(--vms-ink-muted)]"
                        aria-hidden="true"
                    />
                )}
            </button>

            {expanded ? (
                <div
                    id={bodyId}
                    className="space-y-5 border-t border-[var(--vms-line)] p-5"
                >
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field
                            id="billing-email"
                            label="Billing email"
                            required
                            error={errors.billing_email}
                            icon={Mail}
                        >
                            {(control) => (
                                <input
                                    {...control}
                                    type="email"
                                    inputMode="email"
                                    autoComplete="email"
                                    className={fieldControlClassName}
                                    placeholder="billing@company.com"
                                    value={billing.billing_email}
                                    onChange={(event) =>
                                        onChange("billing_email", event.target.value)
                                    }
                                />
                            )}
                        </Field>
                        <Field
                            id="billing-name"
                            label="Company or full name"
                            required
                            error={errors.billing_name}
                        >
                            {(control) => (
                                <input
                                    {...control}
                                    autoComplete="organization"
                                    className={fieldControlClassName}
                                    placeholder="Acme Corporation"
                                    value={billing.billing_name}
                                    onChange={(event) =>
                                        onChange("billing_name", event.target.value)
                                    }
                                />
                            )}
                        </Field>
                    </div>

                    <div className="space-y-4 border-t border-[var(--vms-line)] pt-4">
                        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
                            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                            Billing address
                        </p>

                        <Field
                            id="billing-address-1"
                            label="Street address"
                            required
                            error={errors.address_line1}
                        >
                            {(control) => (
                                <input
                                    {...control}
                                    autoComplete="address-line1"
                                    className={fieldControlClassName}
                                    placeholder="123 Business Avenue"
                                    value={billing.address_line1}
                                    onChange={(event) =>
                                        onChange("address_line1", event.target.value)
                                    }
                                />
                            )}
                        </Field>

                        <Field id="billing-address-2" label="Apartment, suite, etc. (optional)">
                            {(control) => (
                                <input
                                    {...control}
                                    autoComplete="address-line2"
                                    className={fieldControlClassName}
                                    placeholder="Suite 400"
                                    value={billing.address_line2}
                                    onChange={(event) =>
                                        onChange("address_line2", event.target.value)
                                    }
                                />
                            )}
                        </Field>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field id="billing-city" label="City" required error={errors.city}>
                                {(control) => (
                                    <input
                                        {...control}
                                        autoComplete="address-level2"
                                        className={fieldControlClassName}
                                        placeholder="San Francisco"
                                        value={billing.city}
                                        onChange={(event) => onChange("city", event.target.value)}
                                    />
                                )}
                            </Field>
                            <Field id="billing-state" label="State or province">
                                {(control) => (
                                    <input
                                        {...control}
                                        autoComplete="address-level1"
                                        className={fieldControlClassName}
                                        placeholder="California"
                                        value={billing.state}
                                        onChange={(event) => onChange("state", event.target.value)}
                                    />
                                )}
                            </Field>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <Field id="billing-postal-code" label="Postal or ZIP code">
                                {(control) => (
                                    <input
                                        {...control}
                                        autoComplete="postal-code"
                                        className={fieldControlClassName}
                                        placeholder="94102"
                                        value={billing.postal_code}
                                        onChange={(event) =>
                                            onChange("postal_code", event.target.value)
                                        }
                                    />
                                )}
                            </Field>
                            <Field
                                id="billing-country"
                                label="Country"
                                required
                                error={errors.country}
                                icon={Globe}
                            >
                                {(control) => (
                                    <select
                                        {...control}
                                        autoComplete="country"
                                        className={fieldControlClassName}
                                        value={billing.country}
                                        onChange={(event) =>
                                            onChange("country", event.target.value)
                                        }
                                    >
                                        <option value="">Select country…</option>
                                        {BILLING_COUNTRIES.map((country) => (
                                            <option key={country.code} value={country.code}>
                                                {country.name}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </Field>
                        </div>
                    </div>

                    <div className="space-y-3 border-t border-[var(--vms-line)] pt-4">
                        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--vms-ink-muted)]">
                            <Receipt className="h-3.5 w-3.5" aria-hidden="true" />
                            Tax information (optional)
                        </p>
                        <Field
                            id="billing-tax-id"
                            label="Tax ID or VAT number"
                            description="Used for business tax exemption and invoice compliance."
                        >
                            {(control) => (
                                <input
                                    {...control}
                                    className={`${fieldControlClassName} font-mono`}
                                    placeholder="US 12-3456789 or GB 123456789"
                                    value={billing.tax_id}
                                    onChange={(event) => onChange("tax_id", event.target.value)}
                                />
                            )}
                        </Field>
                    </div>
                </div>
            ) : null}
        </section>
    );
}
