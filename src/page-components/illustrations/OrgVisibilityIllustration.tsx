"use client";
import { useEffect, useState } from "react";

/* ─── Data ─────────────────────────────────────────────────────────────── */

const PROPERTIES = [
    {
        id: "maple",
        name: "Maple Grove",
        tag: "HOA",
        gates: 3,
        residents: 142,
        visitors: 8,
        color: "#7ca9ff",
        events: [
            { label: "Main Gate", status: "OPEN", ok: true },
            { label: "East Exit", status: "CLOSED", ok: false },
            { label: "Visitor Bay", status: "OPEN", ok: true },
        ],
    },
    {
        id: "cedar",
        name: "Cedar Heights",
        tag: "Gated",
        gates: 2,
        residents: 89,
        visitors: 3,
        color: "#48d8c8",
        events: [
            { label: "Front Gate", status: "OPEN", ok: true },
            { label: "Service Ent.", status: "OPEN", ok: true },
        ],
    },
] as const;

/* ─── Mini stat cell ─────────────────────────────────────────────────────── */
function Stat({ label, value, color }: { label: string; value: number | string; color: string }) {
    return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
            <span style={{ fontSize: "1rem", fontWeight: 700, color, lineHeight: 1 }}>{value}</span>
            <span style={{ fontSize: "0.64rem", color: "rgba(255,255,255,0.38)", letterSpacing: "0.03em", textTransform: "uppercase" }}>{label}</span>
        </div>
    );
}

/* ─── Gate status row ────────────────────────────────────────────────────── */
function GateRow({ label, status, ok, color }: { label: string; status: string; ok: boolean; color: string }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "5px 0" }}>
            <div style={{
                width: "6px", height: "6px", borderRadius: "50%",
                background: ok ? color : "rgba(255,255,255,0.15)",
                boxShadow: ok ? `0 0 5px ${color}` : "none",
                flexShrink: 0,
            }} />
            <span style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.55)", flex: 1 }}>{label}</span>
            <span style={{
                fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.06em",
                color: ok ? color : "rgba(255,255,255,0.25)",
                padding: "2px 6px", borderRadius: "4px",
                background: ok ? `${color}14` : "rgba(255,255,255,0.04)",
                border: `1px solid ${ok ? `${color}30` : "rgba(255,255,255,0.06)"}`,
            }}>{status}</span>
        </div>
    );
}

/* ─── Main ───────────────────────────────────────────────────────────────── */
export function OrgVisibilityIllustration() {
    const [active, setActive] = useState<"maple" | "cedar">("maple");
    const [tick, setTick] = useState(0);

    // Auto-cycle properties every 3s
    useEffect(() => {
        const id = setInterval(() => {
            setActive((a) => (a === "maple" ? "cedar" : "maple"));
            setTick((t) => t + 1);
        }, 3000);
        return () => clearInterval(id);
    }, []);

    const prop = PROPERTIES.find((p) => p.id === active)!;

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                background: "#080810",
                borderRadius: "10px",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
                fontFamily: "var(--font-sans, sans-serif)",
                position: "relative",
            }}
        >
            {/* Ambient glow behind active card */}
            <div style={{
                position: "absolute",
                width: "220px", height: "140px",
                borderRadius: "50%",
                background: `radial-gradient(ellipse, ${prop.color}1a 0%, transparent 70%)`,
                top: "55%", left: active === "maple" ? "20%" : "55%",
                transform: "translate(-50%, -50%)",
                transition: "left 0.6s cubic-bezier(0.22,1,0.36,1), background 0.4s",
                pointerEvents: "none",
            }} />

            {/* Org header bar */}
            <div style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: "10px 16px",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                background: "rgba(255,255,255,0.02)",
                flexShrink: 0,
            }}>
                {/* logo mark */}
                <div style={{
                    width: "22px", height: "22px", borderRadius: "6px",
                    background: "linear-gradient(135deg, #7ca9ff, #9b7cff)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        <path d="M2 10V5l4-3 4 3v5H8V8H4v2H2z" fill="white" />
                    </svg>
                </div>
                <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "rgba(255,255,255,0.8)", letterSpacing: "0.01em" }}>
                    ACME Communities
                </span>
                <span style={{
                    marginLeft: "4px", fontSize: "0.6rem", color: "rgba(255,255,255,0.3)",
                    padding: "1px 6px", borderRadius: "4px",
                    border: "1px solid rgba(255,255,255,0.1)",
                }}>ORG</span>
                {/* right side */}
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px" }}>
                    <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#3dd68c", boxShadow: "0 0 5px #3dd68c" }} />
                    <span style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.35)" }}>2 properties</span>
                </div>
            </div>

            {/* Property tab strip */}
            <div style={{
                display: "flex", gap: "6px", padding: "10px 16px 6px",
                borderBottom: "1px solid rgba(255,255,255,0.06)",
                flexShrink: 0,
            }}>
                {PROPERTIES.map((p) => {
                    const isActive = p.id === active;
                    return (
                        <button
                            key={p.id}
                            onClick={() => setActive(p.id as "maple" | "cedar")}
                            style={{
                                padding: "5px 14px",
                                borderRadius: "7px",
                                border: isActive ? `1px solid ${p.color}40` : "1px solid rgba(255,255,255,0.08)",
                                background: isActive ? `${p.color}14` : "transparent",
                                color: isActive ? p.color : "rgba(255,255,255,0.38)",
                                fontSize: "0.75rem",
                                fontWeight: isActive ? 600 : 400,
                                cursor: "pointer",
                                transition: "all 0.2s",
                                outline: "none",
                                letterSpacing: "0.01em",
                            }}
                        >
                            {p.name}
                        </button>
                    );
                })}
            </div>

            {/* Property panel — animated swap */}
            <div
                key={`${active}-${tick}`}
                style={{
                    flex: 1,
                    padding: "14px 16px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                    animation: "fadeSlideIn 0.35s cubic-bezier(0.22,1,0.36,1) forwards",
                }}
            >
                {/* Property header */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{
                        width: "28px", height: "28px", borderRadius: "8px",
                        background: `${prop.color}20`,
                        border: `1px solid ${prop.color}40`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                            <path d="M2 14V7l6-5 6 5v7H10V10H6v4H2z" fill={prop.color} opacity="0.8" />
                        </svg>
                    </div>
                    <div>
                        <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "rgba(255,255,255,0.9)" }}>
                            {prop.name}
                        </div>
                        <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.35)", letterSpacing: "0.04em" }}>
                            {prop.tag} · {prop.gates} gates
                        </div>
                    </div>
                    {/* live dot */}
                    <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "5px" }}>
                        <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: prop.color, boxShadow: `0 0 4px ${prop.color}` }} />
                        <span style={{ fontSize: "0.6rem", color: "rgba(255,255,255,0.3)" }}>LIVE</span>
                    </div>
                </div>

                {/* Stats row */}
                <div style={{
                    display: "flex",
                    justifyContent: "space-around",
                    padding: "10px 0",
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                    borderBottom: "1px solid rgba(255,255,255,0.06)",
                }}>
                    <Stat label="Residents" value={prop.residents} color={prop.color} />
                    <div style={{ width: "1px", background: "rgba(255,255,255,0.07)" }} />
                    <Stat label="Visitors today" value={prop.visitors} color={prop.color} />
                    <div style={{ width: "1px", background: "rgba(255,255,255,0.07)" }} />
                    <Stat label="Gates" value={prop.gates} color={prop.color} />
                </div>

                {/* Gate rows */}
                <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.63rem", color: "rgba(255,255,255,0.28)", letterSpacing: "0.07em", marginBottom: "6px", textTransform: "uppercase" }}>
                        Gate Status
                    </div>
                    {prop.events.map((ev) => (
                        <GateRow key={ev.label} label={ev.label} status={ev.status} ok={ev.ok} color={prop.color} />
                    ))}
                </div>

                {/* Isolation badge */}
                <div style={{
                    padding: "7px 12px",
                    borderRadius: "8px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    display: "flex", alignItems: "center", gap: "8px",
                }}>
                    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                        <rect x="2" y="7" width="12" height="8" rx="2" stroke="rgba(255,255,255,0.3)" strokeWidth="1.4" />
                        <path d="M5 7V5a3 3 0 016 0v2" stroke="rgba(255,255,255,0.3)" strokeWidth="1.4" strokeLinecap="round" />
                    </svg>
                    <span style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.35)" }}>
                        Operationally isolated from other properties
                    </span>
                </div>
            </div>

            <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
        </div>
    );
}
