import { describe, expect, it } from "vitest";

import type { LeaseChargeLine } from "./api";
import {
    groupPlanByCadence,
    leaseAttentionReasons,
    leaseDaysRemaining,
    leaseExpiryCopy,
    leaseIsLive,
    monthlyEquivalent,
    oneOffTotal,
} from "./lib";

function line(overrides: Partial<LeaseChargeLine>): LeaseChargeLine {
    return {
        id: Math.random().toString(36),
        name: "Rent",
        amount: "100000.00",
        currency: "NGN",
        recurrence: "monthly",
        first_due_date: null,
        create_definition: false,
        charge_definition_id: null,
        charge_assignment_id: null,
        status: "planned",
        created_at: "2026-01-01T00:00:00Z",
        ...overrides,
    };
}

describe("lease term helpers", () => {
    it("counts the days left from the end date", () => {
        const now = new Date("2026-06-01T00:00:00Z");
        expect(leaseDaysRemaining({ ends_at: "2026-06-11T00:00:00Z" }, now)).toBe(10);
        expect(leaseDaysRemaining({ ends_at: null }, now)).toBeNull();
    });

    it("only treats open and running terms as live", () => {
        expect(leaseIsLive("draft")).toBe(true);
        expect(leaseIsLive("active")).toBe(true);
        expect(leaseIsLive("expiring")).toBe(true);
        expect(leaseIsLive("terminated")).toBe(false);
        expect(leaseIsLive("cancelled")).toBe(false);
        expect(leaseIsLive("expired")).toBe(false);
    });

    it("warns inside the renewal window and fails once the term has run out", () => {
        const now = new Date("2026-06-01T00:00:00Z");
        expect(
            leaseExpiryCopy({ status: "active", ends_at: "2026-07-01T00:00:00Z" }, now),
        ).toEqual({ label: "30 days left", tone: "warning" });
        expect(
            leaseExpiryCopy({ status: "active", ends_at: "2026-05-30T00:00:00Z" }, now),
        ).toEqual({ label: "Ended 2 days ago", tone: "danger" });
        expect(
            leaseExpiryCopy({ status: "active", ends_at: "2027-06-01T00:00:00Z" }, now),
        ).toEqual({ label: "365 days left", tone: "success" });
    });

    it("does not count down a term that was never signed or already ended", () => {
        const now = new Date("2026-06-01T00:00:00Z");
        expect(
            leaseExpiryCopy({ status: "cancelled", ends_at: "2026-06-02T00:00:00Z" }, now),
        ).toEqual({ label: "Cancelled before it started", tone: "neutral" });
        expect(
            leaseExpiryCopy({ status: "terminated", ends_at: "2026-06-02T00:00:00Z" }, now),
        ).toEqual({ label: "Ended early", tone: "danger" });
    });
});

describe("charge plan totals", () => {
    it("normalises mixed cadences onto a monthly figure", () => {
        const lines = [
            line({ name: "Rent", amount: "120000.00", recurrence: "monthly" }),
            line({ name: "Insurance", amount: "120000.00", recurrence: "yearly" }),
            line({ name: "Parking", amount: "30000.00", recurrence: "quarterly" }),
        ];
        // 120,000 monthly + 120,000/year (10,000) + 30,000/quarter (10,000)
        expect(monthlyEquivalent(lines)).toBe(140000);
    });

    it("keeps one-off charges out of the recurring total", () => {
        const lines = [
            line({ name: "Rent", amount: "100000.00", recurrence: "monthly" }),
            line({ name: "Deposit", amount: "300000.00", recurrence: "one_time" }),
        ];
        expect(monthlyEquivalent(lines)).toBe(100000);
        expect(oneOffTotal(lines)).toBe(300000);
    });

    it("ignores cancelled lines so a replaced plan does not double count", () => {
        const lines = [
            line({ name: "Rent", amount: "100000.00" }),
            line({ name: "Rent", amount: "900000.00", status: "cancelled" }),
        ];
        expect(monthlyEquivalent(lines)).toBe(100000);
    });

    it("groups the plan by cadence in a stable order", () => {
        const lines = [
            line({ name: "Deposit", amount: "200000.00", recurrence: "one_time" }),
            line({ name: "Rent", amount: "100000.00", recurrence: "monthly" }),
            line({ name: "Service charge", amount: "20000.00", recurrence: "monthly" }),
            line({ name: "Insurance", amount: "60000.00", recurrence: "yearly" }),
        ];
        expect(groupPlanByCadence(lines)).toEqual([
            { cadence: "monthly", total: 120000, names: ["Rent", "Service charge"] },
            { cadence: "yearly", total: 60000, names: ["Insurance"] },
            { cadence: "one_time", total: 200000, names: ["Deposit"] },
        ]);
    });
});

describe("lease attention", () => {
    const now = new Date("2026-06-01T00:00:00Z");

    it("flags an active lease that is about to expire", () => {
        const reasons = leaseAttentionReasons(
            {
                status: "active",
                ends_at: "2026-06-20T00:00:00Z",
                signed_at: "2026-01-01T00:00:00Z",
                charge_lines: [line({ status: "applied" })],
            },
            now,
        );
        expect(reasons.map((reason) => reason.id)).toEqual(["expiring"]);
    });

    it("flags an unsigned draft with no charges planned", () => {
        const reasons = leaseAttentionReasons(
            {
                status: "draft",
                ends_at: "2027-01-01T00:00:00Z",
                signed_at: null,
                charge_lines: [],
            },
            now,
        );
        expect(reasons.map((reason) => reason.id)).toEqual(["unsigned", "no_plan"]);
    });

    it("stays quiet on a healthy running lease", () => {
        const reasons = leaseAttentionReasons(
            {
                status: "active",
                ends_at: "2027-06-01T00:00:00Z",
                signed_at: "2026-01-01T00:00:00Z",
                charge_lines: [line({ status: "applied" })],
            },
            now,
        );
        expect(reasons).toEqual([]);
    });
});
