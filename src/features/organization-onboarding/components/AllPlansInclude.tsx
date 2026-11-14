import { Check } from "lucide-react";

const INCLUDED = [
    "Sites, buildings, units and rooms",
    "People, households and roles",
    "Gates, check-in and guest passes",
    "Charges, invoices and receipts",
    "Announcements and audit history",
    "Email and mobile notifications",
];

/** The capability floor every plan shares, so plan choice never feels like a trap. */
export function AllPlansInclude() {
    return (
        <section
            aria-labelledby="all-plans-include-title"
            className="rounded-[var(--vms-radius-surface)] border border-[var(--vms-line)] bg-[var(--vms-surface)] p-5"
        >
            <h2
                id="all-plans-include-title"
                className="text-sm font-semibold text-[var(--vms-ink)]"
            >
                Every plan includes
            </h2>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {INCLUDED.map((item) => (
                    <li
                        key={item}
                        className="flex items-start gap-2 text-xs leading-5 text-[var(--vms-ink-muted)]"
                    >
                        <Check
                            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--vms-success)]"
                            aria-hidden="true"
                        />
                        {item}
                    </li>
                ))}
            </ul>
        </section>
    );
}
