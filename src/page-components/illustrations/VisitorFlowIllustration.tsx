"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";

// ── Phase data ──────────────────────────────────────────────────────

const PHASES = [
    { id: "arrival", step: "01", label: "Arrival Detected", sub: "Main Gate \u00b7 Visitor queue", status: "Scanning...", color: "#5484ff", glow: "rgba(84,132,255,0.35)" },
    { id: "scan", step: "02", label: "QR Code Scanned", sub: "Ref #VIS-04821 \u00b7 Phone camera", status: "Verifying...", color: "#9b7cff", glow: "rgba(155,124,255,0.35)" },
    { id: "approve", step: "03", label: "Access Approved", sub: "Matched resident guest list", status: "Approved", color: "#3dd68c", glow: "rgba(61,214,140,0.35)" },
    { id: "entry", step: "04", label: "Gate Barrier Lifted", sub: "Entry granted \u00b7 Duration 12s", status: "Entry Granted", color: "#48d8c8", glow: "rgba(72,216,200,0.35)" },
] as const;

type PhaseEntry = typeof PHASES[number];

const PHASE_ICONS: Record<string, JSX.Element> = {
    arrival: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-2.7-3.4A1 1 0 0 0 14.5 6h-5a1 1 0 0 0-.8.4L6 10l-2.5 1.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2" />
            <circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" />
        </svg>
    ),
    scan: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <path d="M14 14h3v3M17 17h3v3M14 20h3" />
        </svg>
    ),
    approve: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
        </svg>
    ),
    entry: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="10" rx="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            <circle cx="12" cy="16" r="1.5" fill="currentColor" />
        </svg>
    ),
};

// ── Spinner ─────────────────────────────────────────────────────────

function Spinner({ color }: { color: string }) {
    return (
        <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            style={{ width: "12px", height: "12px", borderRadius: "50%", border: `2px solid ${color}30`, borderTop: `2px solid ${color}` }}
        />
    );
}

// ── Phase row ───────────────────────────────────────────────────────

function PhaseRow({ phase, done, active, index }: { phase: PhaseEntry; done: boolean; active: boolean; index: number }) {
    const icon = PHASE_ICONS[phase.id];
    return (
        <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: done || active ? 1 : 0.28, x: 0 }}
            transition={{ duration: 0.5, delay: index * 0.06 }}
            style={{
                display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px", borderRadius: "10px",
                background: active ? `linear-gradient(135deg, ${phase.color}12, ${phase.color}06)` : done ? `${phase.color}06` : "transparent",
                border: `1px solid ${active ? phase.color + "33" : done ? phase.color + "18" : "rgba(255,255,255,0.04)"}`,
                transition: "all 0.4s ease", position: "relative", overflow: "hidden",
                height: "60px", flexShrink: 0,
            }}
        >
            {active && (
                <motion.div
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.5 }}
                    style={{ position: "absolute", inset: 0, background: `linear-gradient(90deg, transparent, ${phase.color}18, transparent)`, pointerEvents: "none" }}
                />
            )}
            <div style={{
                flexShrink: 0, width: "28px", height: "28px", borderRadius: "8px",
                border: `1px solid ${done || active ? phase.color + "44" : "rgba(255,255,255,0.07)"}`,
                background: done ? `${phase.color}20` : active ? `${phase.color}14` : "rgba(255,255,255,0.03)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: done || active ? phase.color : "rgba(255,255,255,0.2)", transition: "all 0.4s ease",
            }}>
                {done ? (
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                        <path d="M2.5 7L5.5 10L11.5 4" stroke={phase.color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                ) : <div style={{ color: active ? phase.color : "rgba(255,255,255,0.2)" }}>{icon}</div>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 600, color: done || active ? "rgba(255,255,255,0.9)" : "rgba(255,255,255,0.28)", letterSpacing: "-0.01em", transition: "color 0.4s ease", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {phase.label}
                </div>
                <div style={{ fontSize: "0.67rem", color: done || active ? "rgba(255,255,255,0.35)" : "rgba(255,255,255,0.14)", marginTop: "1px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", transition: "color 0.4s ease" }}>
                    {phase.sub}
                </div>
            </div>
            <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "6px" }}>
                {active && <Spinner color={phase.color} />}
                <span style={{ fontSize: "0.65rem", fontWeight: 600, color: done ? phase.color : active ? phase.color + "cc" : "rgba(255,255,255,0.18)", letterSpacing: "0.04em", textTransform: "uppercase" as const, transition: "color 0.4s ease" }}>
                    {done ? "Done" : active ? phase.status : "Waiting"}
                </span>
            </div>
        </motion.div>
    );
}

// ── Live status display ─────────────────────────────────────────────

function LiveStatus({ phase: phaseIndex }: { phase: number }) {
    const phaseData = PHASES[phaseIndex];
    const icon = PHASE_ICONS[phaseData.id];
    return (
        <div style={{ padding: "14px 16px", borderRadius: "12px", border: `1px solid ${phaseData.color}30`, background: `linear-gradient(135deg, ${phaseData.color}0e, rgba(0,0,0,0.3))`, display: "flex", alignItems: "center", gap: "14px", marginBottom: "12px", transition: "all 0.5s ease", position: "relative", overflow: "hidden" }}>
            <motion.div
                animate={{ opacity: [0.5, 1, 0.5], scale: [0.96, 1.02, 0.96] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at 20% 50%, ${phaseData.glow}, transparent 70%)`, pointerEvents: "none" }}
            />
            <motion.div
                key={phaseIndex}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
                style={{ width: "38px", height: "38px", borderRadius: "11px", background: `${phaseData.color}22`, border: `1px solid ${phaseData.color}44`, display: "flex", alignItems: "center", justifyContent: "center", color: phaseData.color, flexShrink: 0, boxShadow: `0 0 18px -4px ${phaseData.glow}` }}
            >
                {icon}
            </motion.div>
            <div style={{ flex: 1, minWidth: 0, position: "relative" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "2px" }}>
                    <motion.div animate={{ opacity: [0.6, 1, 0.6] }} transition={{ duration: 1.4, repeat: Infinity }}
                        style={{ width: "6px", height: "6px", borderRadius: "50%", background: phaseData.color, boxShadow: `0 0 8px ${phaseData.color}`, flexShrink: 0 }}
                    />
                    <span style={{ fontSize: "0.63rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" as const, color: phaseData.color }}>
                        {phaseIndex < 3 ? "Processing" : "Complete"}
                    </span>
                </div>
                <AnimatePresence mode="wait">
                    <motion.p key={phaseIndex} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.3 }}
                        style={{ margin: 0, fontSize: "0.82rem", fontWeight: 600, color: "rgba(255,255,255,0.88)", letterSpacing: "-0.01em" }}
                    >
                        {phaseData.label}
                    </motion.p>
                </AnimatePresence>
            </div>
            <div style={{ flexShrink: 0, textAlign: "right" as const }}>
                <div style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em" }}>STEP</div>
                <div style={{ fontSize: "1.1rem", fontWeight: 800, color: phaseData.color, letterSpacing: "-0.03em" }}>
                    {phaseData.step}<span style={{ fontSize: "0.65rem", fontWeight: 500, color: "rgba(255,255,255,0.25)", marginLeft: "1px" }}>/04</span>
                </div>
            </div>
        </div>
    );
}

// ── Main export ─────────────────────────────────────────────────────

export function VisitorFlowIllustration() {
    const [phase, setPhase] = useState(0);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timings = [2400, 2100, 1900, 2800];
        let timeout: ReturnType<typeof setTimeout>;
        const cycle = (cur: number) => {
            setPhase(cur);
            timeout = setTimeout(() => cycle((cur + 1) % 4), timings[cur]);
        };
        cycle(0);
        return () => clearTimeout(timeout);
    }, []);

    // Auto-scroll the active row into view as the phase advances
    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;
        const activeRow = container.children[phase] as HTMLElement | undefined;
        if (activeRow) {
            activeRow.scrollIntoView({ behavior: "smooth", block: "nearest" });
        }
    }, [phase]);

    return (
        <div style={{ width: "100%", padding: "1px", borderRadius: "18px", background: "linear-gradient(145deg, rgba(84,132,255,0.22), rgba(255,255,255,0.04) 40%, rgba(155,124,255,0.15))" }}>
            <div style={{
                borderRadius: "17px",
                background: "linear-gradient(160deg, #07090f 0%, #050710 50%, #07060e 100%)",
                padding: "16px",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04), 0 40px 80px -30px rgba(0,0,0,0.9)",
                overflow: "hidden",
                position: "relative",
                height: "340px",
                display: "flex",
                flexDirection: "column",
            }}>
                {/* Background grid */}
                <div aria-hidden="true" style={{ position: "absolute", inset: 0, pointerEvents: "none", backgroundImage: "linear-gradient(rgba(84,132,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(84,132,255,0.025) 1px, transparent 1px)", backgroundSize: "28px 28px", maskImage: "radial-gradient(ellipse 90% 80% at 50% 20%, black, transparent)" }} />

                {/* Header */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", padding: "0 2px", flexShrink: 0, position: "relative" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "5px", padding: "4px 10px", borderRadius: "999px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                        <motion.div animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.6, repeat: Infinity }}
                            style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#3dd68c", boxShadow: "0 0 6px #3dd68c" }}
                        />
                        <span style={{ fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.14em", color: "rgba(255,255,255,0.45)", textTransform: "uppercase" as const }}>GATE TERMINAL</span>
                    </div>
                    <div style={{ display: "flex", gap: "5px" }}>
                        {(["rgba(255,90,90,0.5)", "rgba(255,190,50,0.5)", "rgba(50,210,100,0.5)"] as const).map((c, i) => (
                            <div key={i} style={{ width: "7px", height: "7px", borderRadius: "50%", background: c }} />
                        ))}
                    </div>
                </div>

                {/* Live status card */}
                <div style={{ flexShrink: 0, position: "relative" }}>
                    <LiveStatus phase={phase} />
                </div>

                {/* Divider */}
                <div style={{ height: "1px", background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.06), transparent)", margin: "0 0 10px", flexShrink: 0 }} />

                {/* Phase rows — scrollable */}
                <div
                    ref={scrollRef}
                    className="vf-phase-scroll"
                    style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "6px",
                        flex: 1,
                        overflowY: "auto",
                        minHeight: 0,
                        position: "relative",
                        maskImage: "linear-gradient(to bottom, black calc(100% - 24px), transparent 100%)",
                        paddingBottom: "4px",

                    }}
                >
                    {PHASES.map((p, i) => (
                        <PhaseRow key={p.id} phase={p} done={phase > i} active={phase === i} index={i} />
                    ))}
                </div>

                {/* Footer */}
                <div style={{ paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.04)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, position: "relative" }}>
                    <span style={{ fontSize: "0.62rem", color: "rgba(255,255,255,0.2)", letterSpacing: "0.04em" }}>EVENT LOG · REAL-TIME</span>
                    <div style={{ display: "flex", gap: "3px" }}>
                        {PHASES.map((p, i) => (
                            <motion.div key={i} animate={{ opacity: phase >= i ? 1 : 0.2 }} transition={{ duration: 0.3 }}
                                style={{ width: phase === i ? "16px" : "5px", height: "5px", borderRadius: "999px", background: phase >= i ? p.color : "rgba(255,255,255,0.12)", transition: "all 0.4s ease" }}
                            />
                        ))}
                    </div>
                </div>

                <style>{`
                    .vf-phase-scroll::-webkit-scrollbar { display: none; }
                    .vf-phase-scroll { scrollbar-width: none; -ms-overflow-style: none; }
                `}</style>
            </div>
        </div>
    );
}

export default VisitorFlowIllustration;
