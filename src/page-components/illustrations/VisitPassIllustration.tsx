import { useEffect, useState } from "react";

/* ─── Data ───────────────────────────────────────────────────────────────── */

type PassStatus = "approved" | "pending" | "expired";

type Pass = {
    id: string;
    guestName: string;
    initials: string;
    purpose: string;
    unit: string;
    date: string;
    timeWindow: string;
    status: PassStatus;
    avatarGradient: string;
    ref: string;
};

const PASSES: Pass[] = [
    {
        id: "a",
        guestName: "Marcus Reid",
        initials: "MR",
        purpose: "Delivery",
        unit: "Unit 7A",
        date: "Mon, 9 Mar",
        timeWindow: "10:00 – 12:00",
        status: "expired",
        avatarGradient: "linear-gradient(135deg, #3b5bdb, #6741d9)",
        ref: "VE-00839",
    },
    {
        id: "b",
        guestName: "A. Johnson",
        initials: "AJ",
        purpose: "Visitor",
        unit: "Unit 14B",
        date: "Today",
        timeWindow: "09:00 – 17:00",
        status: "approved",
        avatarGradient: "linear-gradient(135deg, #5484ff, #9b7cff)",
        ref: "VE-00841",
    },
    {
        id: "c",
        guestName: "Priya Nair",
        initials: "PN",
        purpose: "Contractor",
        unit: "Unit 3C",
        date: "Tue, 10 Mar",
        timeWindow: "08:00 – 16:00",
        status: "pending",
        avatarGradient: "linear-gradient(135deg, #0ea5a0, #48d8c8)",
        ref: "VE-00842",
    },
];

const STATUS_META: Record<PassStatus, { label: string; color: string; bg: string; border: string }> = {
    approved: {
        label: "Approved",
        color: "#3dd68c",
        bg: "rgba(61,214,140,0.1)",
        border: "rgba(61,214,140,0.28)",
    },
    pending: {
        label: "Pending",
        color: "#fbbf24",
        bg: "rgba(251,191,36,0.1)",
        border: "rgba(251,191,36,0.28)",
    },
    expired: {
        label: "Expired",
        color: "rgba(255,255,255,0.3)",
        bg: "rgba(255,255,255,0.04)",
        border: "rgba(255,255,255,0.1)",
    },
};

/* ─── QR code mock ────────────────────────────────────────────────────────── */

function QrMock({ color }: { color: string }) {
    const cells: [number, number][] = [
        [0, 0], [1, 0], [2, 0], [0, 1], [2, 1], [0, 2], [1, 2], [2, 2],
        [4, 0], [5, 0], [6, 0], [4, 1], [6, 1], [4, 2], [5, 2], [6, 2],
        [0, 4], [1, 4], [2, 4], [0, 5], [2, 5], [0, 6], [1, 6], [2, 6],
        [4, 3], [5, 4], [3, 5], [6, 5], [4, 6], [3, 4],
    ];
    return (
        <svg width="36" height="36" viewBox="0 0 7 7" style={{ flexShrink: 0 }}>
            {cells.map(([x, y]) => (
                <rect key={`${x}-${y}`} x={x} y={y} width="0.85" height="0.85" rx="0.15" fill={color} opacity="0.7" />
            ))}
        </svg>
    );
}

/* ─── Single pass card ───────────────────────────────────────────────────── */

function PassCard({
    pass,
    isSelected,
    onClick,
}: {
    pass: Pass;
    isSelected: boolean;
    onClick: () => void;
}) {
    const s = STATUS_META[pass.status];

    return (
        <div
            onClick={onClick}
            style={{
                borderRadius: "12px",
                border: isSelected ? "1px solid rgba(124,169,255,0.45)" : "1px solid var(--illus-border)",
                background: isSelected
                    ? "rgba(124,169,255,0.07)"
                    : "var(--illus-bg-card)",
                padding: "14px",
                cursor: "pointer",
                transition: "all 0.25s ease",
                boxShadow: isSelected ? "0 0 24px rgba(124,169,255,0.12)" : "none",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                opacity: pass.status === "expired" && !isSelected ? 0.55 : 1,
                flex: 1,
                minWidth: 0,
            }}
        >
            {/* Top: avatar + name + status */}
            <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                <div
                    style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: pass.avatarGradient,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.65rem",
                        fontWeight: 700,
                        color: "#fff",
                        flexShrink: 0,
                    }}
                >
                    {pass.initials}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--illus-text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {pass.guestName}
                    </div>
                    <div style={{ fontSize: "0.65rem", color: "var(--illus-text-tertiary)", marginTop: "1px" }}>
                        {pass.purpose} · {pass.unit}
                    </div>
                </div>
                <span
                    style={{
                        fontSize: "0.58rem",
                        fontWeight: 600,
                        letterSpacing: "0.04em",
                        color: s.color,
                        background: s.bg,
                        border: `1px solid ${s.border}`,
                        padding: "2px 6px",
                        borderRadius: "4px",
                        flexShrink: 0,
                    }}
                >
                    {s.label}
                </span>
            </div>

            {/* Time window */}
            <div style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                padding: "6px 8px",
                borderRadius: "7px",
                background: "var(--illus-bg-card)",
                border: "1px solid var(--illus-border)",
            }}>
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6.5" stroke="var(--illus-text-tertiary)" strokeWidth="1.4" />
                    <path d="M8 5v3.5l2 1.5" stroke="var(--illus-text-tertiary)" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                <span style={{ fontSize: "0.65rem", color: "var(--illus-text-secondary)" }}>{pass.date}</span>
                <span style={{ fontSize: "0.6rem", color: "var(--illus-text-muted)" }}>·</span>
                <span style={{ fontSize: "0.65rem", color: "var(--illus-text-secondary)" }}>{pass.timeWindow}</span>
            </div>

            {/* QR + ref — only show when selected */}
            {isSelected && (
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
                    <QrMock color="#7ca9ff" />
                    <div style={{ flex: 1, textAlign: "right" }}>
                        <div style={{ fontSize: "0.6rem", color: "var(--illus-text-muted)", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: "2px" }}>
                            Pass Ref
                        </div>
                        <div style={{ fontSize: "0.72rem", fontWeight: 600, color: "#7ca9ff", letterSpacing: "0.04em" }}>
                            #{pass.ref}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─── Main illustration ──────────────────────────────────────────────────── */

export function VisitPassIllustration() {
    const [selectedIdx, setSelectedIdx] = useState(1); // start with middle card

    // Auto-cycle selection
    useEffect(() => {
        const id = setInterval(() => {
            setSelectedIdx((i) => (i + 1) % PASSES.length);
        }, 2800);
        return () => clearInterval(id);
    }, []);

    const selected = PASSES[selectedIdx];
    const s = STATUS_META[selected.status];

    return (
        <div
            style={{
                width: "100%",
                borderRadius: "12px",
                background: "var(--illus-bg)",
                border: "1px solid var(--illus-border)",
                overflow: "hidden",
                fontFamily: "var(--font-sans, sans-serif)",
                display: "flex",
                flexDirection: "column",
            }}
        >
            {/* Header bar */}
            <div style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                borderBottom: "1px solid var(--illus-border)",
                background: "var(--illus-bg-elevated)",
                flexShrink: 0,
            }}>
                <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                        <rect x="1" y="3" width="14" height="10" rx="2" stroke="var(--illus-text-secondary)" strokeWidth="1.4" />
                        <path d="M4 7h4m-4 3h6" stroke="var(--illus-text-secondary)" strokeWidth="1.4" strokeLinecap="round" />
                        <circle cx="12" cy="7" r="1.5" fill="#7ca9ff" />
                    </svg>
                    <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "var(--illus-text-secondary)", letterSpacing: "0.01em" }}>
                        Guest Passes
                    </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{
                        fontSize: "0.58rem", fontWeight: 600, color: "#3dd68c",
                        padding: "2px 7px", borderRadius: "4px",
                        background: "rgba(61,214,140,0.1)", border: "1px solid rgba(61,214,140,0.22)",
                    }}>
                        {PASSES.filter(p => p.status !== "expired").length} active
                    </span>
                    <span style={{
                        fontSize: "0.62rem", color: "var(--illus-text-muted)",
                        padding: "2px 7px", borderRadius: "4px",
                        background: "var(--illus-bg-card)", border: "1px solid var(--illus-border)",
                    }}>
                        + New pass
                    </span>
                </div>
            </div>

            {/* Tab strip */}
            <div style={{ display: "flex", gap: "6px", padding: "12px 14px 0" }}>
                {PASSES.map((pass, i) => {
                    const isActive = i === selectedIdx;
                    const ts = STATUS_META[pass.status];
                    return (
                        <button
                            key={pass.id}
                            onClick={() => setSelectedIdx(i)}
                            style={{
                                flex: 1,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: "5px",
                                padding: "8px 6px",
                                borderRadius: "10px",
                                border: isActive
                                    ? "1px solid rgba(124,169,255,0.4)"
                                    : "1px solid var(--illus-border)",
                                background: isActive
                                    ? "rgba(124,169,255,0.08)"
                                    : "var(--illus-bg-card)",
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                opacity: pass.status === "expired" && !isActive ? 0.5 : 1,
                                outline: "none",
                            }}
                        >
                            <div
                                style={{
                                    width: "28px",
                                    height: "28px",
                                    borderRadius: "50%",
                                    background: pass.avatarGradient,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "0.58rem",
                                    fontWeight: 700,
                                    color: "#fff",
                                    flexShrink: 0,
                                }}
                            >
                                {pass.initials}
                            </div>
                            <span
                                style={{
                                    fontSize: "0.58rem",
                                    fontWeight: 600,
                                    letterSpacing: "0.03em",
                                    color: isActive ? ts.color : "var(--illus-text-tertiary)",
                                    background: isActive ? ts.bg : "transparent",
                                    border: `1px solid ${isActive ? ts.border : "transparent"}`,
                                    padding: "1px 5px",
                                    borderRadius: "4px",
                                }}
                            >
                                {ts.label}
                            </span>
                        </button>
                    );
                })}
            </div>

            {/* Selected pass full card */}
            <div style={{ padding: "10px 14px" }}>
                <PassCard
                    pass={selected}
                    isSelected
                    onClick={() => { }}
                />
            </div>

            {/* Detail strip */}
            <div style={{
                margin: "0 14px 14px",
                padding: "10px 12px",
                borderRadius: "9px",
                background: "var(--illus-bg-card)",
                border: "1px solid var(--illus-border)",
                display: "grid",
                gridTemplateColumns: "1fr 1px 1fr 1px 1fr",
                gap: "0",
                alignItems: "center",
                flexShrink: 0,
            }}>
                {[
                    { label: "Approved by", value: "Admin Portal" },
                    null,
                    { label: "Access type", value: selected.purpose },
                    null,
                    { label: "Status", value: s.label, color: s.color },
                ].map((item, i) =>
                    item === null ? (
                        <div key={i} style={{ width: "1px", height: "28px", background: "var(--illus-border)", margin: "0 auto" }} />
                    ) : (
                        <div key={i} style={{ textAlign: "center" }}>
                                <div style={{ fontSize: "0.58rem", color: "var(--illus-text-muted)", letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: "3px" }}>
                                {item.label}
                            </div>
                                <div style={{ fontSize: "0.72rem", fontWeight: 600, color: (item as { label: string; value: string; color?: string }).color ?? "var(--illus-text)" }}>
                                {item.value}
                            </div>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
