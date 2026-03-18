import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";

// ── tiny reusable atoms ─────────────────────────────────────────────────────

function Dot({ color = "var(--accent-primary)", pulse = false }: { color?: string; pulse?: boolean }) {
    return (
        <span
            style={{
                display: "inline-block",
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: color,
                flexShrink: 0,
                animation: pulse ? "pulse-green 1.8s ease-out infinite" : undefined,
                boxShadow: pulse ? `0 0 0 0 ${color}` : undefined,
            }}
        />
    );
}

function StepBadge({
    label,
    done,
    active,
    color = "var(--accent-primary)",
}: {
    label: string;
    done: boolean;
    active: boolean;
    color?: string;
}) {
    return (
        <div
            style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
                opacity: done || active ? 1 : 0.28,
                transition: "opacity 0.4s ease",
            }}
        >
            <motion.div
                animate={
                    active
                        ? { boxShadow: [`0 0 0 0 ${color}55`, `0 0 0 8px ${color}00`, `0 0 0 0 ${color}55`] }
                        : {}
                }
                transition={{ duration: 1.4, repeat: Infinity }}
                style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    border: `2px solid ${done ? color : active ? color : "rgba(255,255,255,0.14)"}`,
                    background: done
                        ? `${color}22`
                        : active
                            ? `${color}18`
                            : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.4s ease",
                }}
            >
                {done ? (
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2.5 7L5.5 10L11.5 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                ) : active ? (
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                        style={{
                            width: "12px",
                            height: "12px",
                            borderRadius: "50%",
                            borderTop: `2px solid ${color}`,
                            borderRight: `2px solid transparent`,
                            borderBottom: `2px solid ${color}44`,
                            borderLeft: `2px solid ${color}44`,
                        }}
                    />
                ) : (
                    <div
                        style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: "rgba(255,255,255,0.14)",
                        }}
                    />
                )}
            </motion.div>
            <span
                style={{
                    fontSize: "0.68rem",
                    color: done || active ? "var(--text-secondary)" : "var(--text-tertiary)",
                    letterSpacing: "0.03em",
                    whiteSpace: "nowrap",
                    fontWeight: active ? 600 : 400,
                }}
            >
                {label}
            </span>
        </div>
    );
}

// ── main illustration ───────────────────────────────────────────────────────

const STEPS = ["QR Scan", "ID Verify", "Approved", "Gate Open"];
const STEP_COLORS = [
    "var(--accent-secondary)",
    "var(--accent-violet)",
    "var(--accent-green)",
    "var(--accent-cyan)",
];

const LOG_EVENTS = [
    { time: "09:41:02", icon: "scan", label: "QR code scanned", detail: "Main Gate · Entry", color: "var(--accent-secondary)" },
    { time: "09:41:04", icon: "verify", label: "Identity verified", detail: "Resident guest list matched", color: "var(--accent-violet)" },
    { time: "09:41:05", icon: "approve", label: "Access approved", detail: "Approved by Admin Portal", color: "var(--accent-green)" },
    { time: "09:41:06", icon: "gate", label: "Gate barrier lifted", detail: "Duration: 12 sec", color: "var(--accent-cyan)" },
    { time: "09:41:18", icon: "log", label: "Event written to audit log", "detail": "Ref #VE-00841", color: "var(--text-secondary)" },
];

const ICON_PATHS: Record<string, JSX.Element> = {
    scan: (
        <path d="M3 7V4a1 1 0 011-1h3M17 3h3a1 1 0 011 1v3M21 17v3a1 1 0 01-1 1h-3M7 21H4a1 1 0 01-1-1v-3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    ),
    verify: (
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    ),
    approve: (
        <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    ),
    gate: (
        <>
            <rect x="3" y="11" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
            <path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="12" cy="16" r="1.5" fill="currentColor" />
        </>
    ),
    log: (
        <>
            <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="8" y1="13" x2="16" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            <line x1="8" y1="17" x2="13" y2="17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
        </>
    ),
};

const GATE_DESIGN_WIDTH = 560;
const GATE_DESIGN_HEIGHT = 460;

export function GateEventIllustration() {
    const [activeStep, setActiveStep] = useState(0);
    const [visibleLogs, setVisibleLogs] = useState(0);
    const logScrollRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    // Scale to fit container width on mobile
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const obs = new ResizeObserver(([entry]) => {
            const w = entry.contentRect.width;
            setScale(Math.min(1, w / GATE_DESIGN_WIDTH));
        });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    // Cycle through steps automatically
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveStep((s) => {
                const next = (s + 1) % (STEPS.length + 1); // +1 for "done/hold" state
                return next;
            });
        }, 1800);
        return () => clearInterval(interval);
    }, []);

    // Reveal log lines as steps advance
    useEffect(() => {
        if (activeStep === 0) {
            setVisibleLogs(0);
        } else {
            const target = Math.min(activeStep + 1, LOG_EVENTS.length);
            setVisibleLogs(target);
        }
    }, [activeStep]);

    // Auto-scroll log to bottom when new entries appear
    useEffect(() => {
        const el = logScrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [visibleLogs]);

    const doneStep = activeStep >= STEPS.length ? STEPS.length : activeStep;

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                overflow: "hidden",
                borderRadius: "18px",
                height: `${Math.round(scale * GATE_DESIGN_HEIGHT)}px`,
                transition: "height 0.15s ease",
            }}
        >
            <div
                style={{
                    width: `${GATE_DESIGN_WIDTH}px`,
                    height: `${GATE_DESIGN_HEIGHT}px`,
                    transformOrigin: "top left",
                    transform: `scale(${scale})`,
                    borderRadius: "18px",
                    border: "1px solid rgba(255,255,255,0.07)",
                    background: "#080810",
                    overflow: "hidden",
                    fontFamily: "var(--font-sans), system-ui, sans-serif",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {/* ── header bar ── */}
                <div
                    style={{
                        padding: "12px 18px",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                        background: "#080810",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Dot color="var(--accent-green)" pulse />
                        <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)", letterSpacing: "0.01em" }}>
                            Main Gate · Live Access Event
                        </span>
                    </div>
                    <span
                        style={{
                            fontSize: "0.7rem",
                            color: "var(--text-tertiary)",
                            background: "rgba(255,255,255,0.04)",
                            padding: "3px 8px",
                            borderRadius: "999px",
                            border: "1px solid rgba(255,255,255,0.07)",
                        }}
                    >
                        Ref #VE-00841
                    </span>
                </div>

                <div style={{ padding: "20px 18px", display: "flex", flexDirection: "column", gap: "20px", flex: 1, overflow: "hidden" }}>
                    {/* ── visitor card ── */}
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "14px",
                            padding: "14px 16px",
                            borderRadius: "12px",
                            background: "#080810",
                            border: "1px solid rgba(255,255,255,0.07)",
                        }}
                    >
                        {/* avatar */}
                        <div
                            style={{
                                width: "42px",
                                height: "42px",
                                borderRadius: "50%",
                                background: "linear-gradient(135deg, #5484ff, #9b7cff)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 700,
                                fontSize: "0.88rem",
                                color: "#fff",
                                flexShrink: 0,
                            }}
                        >
                            AJ
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--text-primary)", marginBottom: "2px" }}>
                                A. Johnson
                            </div>
                            <div style={{ fontSize: "0.76rem", color: "var(--text-tertiary)" }}>
                                Delivery guest · Pre-registered by Res. Unit 14B
                            </div>
                        </div>
                        <motion.div
                            key={doneStep >= 3 ? "approved" : "pending"}
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={{
                                padding: "5px 10px",
                                borderRadius: "999px",
                                fontSize: "0.72rem",
                                fontWeight: 700,
                                background: doneStep >= 3 ? "rgba(61,214,140,0.12)" : "rgba(255,184,77,0.1)",
                                border: doneStep >= 3
                                    ? "1px solid rgba(61,214,140,0.3)"
                                    : "1px solid rgba(255,184,77,0.25)",
                                color: doneStep >= 3 ? "var(--accent-green)" : "#ffd089",
                                whiteSpace: "nowrap",
                                flexShrink: 0,
                            }}
                        >
                            {doneStep >= 3 ? "Access Granted" : "Processing…"}
                        </motion.div>
                    </div>

                    {/* ── step progress ── */}
                    <div style={{ display: "flex", alignItems: "flex-start" }}>
                        {STEPS.map((label, i) => (
                            <div key={label} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", position: "relative" }}>
                                {/* connector line to the right (skip for last item) */}
                                {i < STEPS.length - 1 && (
                                    <div
                                        style={{
                                            position: "absolute",
                                            top: "16px",
                                            left: "calc(50% + 16px)",
                                            right: "calc(-50% + 16px)",
                                            height: "2px",
                                            background: "rgba(255,255,255,0.07)",
                                            borderRadius: "999px",
                                            overflow: "hidden",
                                        }}
                                    >
                                        <motion.div
                                            animate={{ width: doneStep > i ? "100%" : "0%" }}
                                            transition={{ duration: 0.45, ease: "easeInOut" }}
                                            style={{
                                                height: "100%",
                                                background: `linear-gradient(90deg, ${STEP_COLORS[i]}, ${STEP_COLORS[i + 1]})`,
                                                borderRadius: "999px",
                                            }}
                                        />
                                    </div>
                                )}
                                <StepBadge
                                    label={label}
                                    done={doneStep > i}
                                    active={doneStep === i && activeStep < STEPS.length}
                                    color={STEP_COLORS[i]}
                                />
                            </div>
                        ))}
                    </div>

                    {/* ── audit log ── */}
                    <div
                        style={{
                            borderRadius: "12px",
                            border: "1px solid rgba(255,255,255,0.06)",
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column",
                            flex: 1,
                            minHeight: 0,
                        }}
                    >
                        <div
                            style={{
                                padding: "9px 14px",
                                borderBottom: "1px solid rgba(255,255,255,0.05)",
                                background: "rgba(255,255,255,0.02)",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                            }}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ color: "var(--text-tertiary)", flexShrink: 0 }}>
                                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                <line x1="8" y1="13" x2="16" y2="13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            </svg>
                            <span style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--text-tertiary)", fontWeight: 600 }}>
                                Audit Trail
                            </span>
                        </div>

                        <div ref={logScrollRef} className="gate-log-scroll" style={{ padding: "8px 0", flex: 1, overflowY: "auto", scrollBehavior: "smooth" }}>
                            <AnimatePresence>
                                {LOG_EVENTS.slice(0, visibleLogs).map((ev, i) => (
                                    <motion.div
                                        key={ev.label}
                                        initial={{ opacity: 0, x: -12 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ duration: 0.35, delay: i * 0.06 }}
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "60px 24px 1fr",
                                            alignItems: "center",
                                            gap: "8px",
                                            padding: "7px 14px",
                                            borderBottom: i < visibleLogs - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                                        }}
                                    >
                                        {/* timestamp */}
                                        <span style={{ fontSize: "0.66rem", color: "var(--text-tertiary)", fontVariantNumeric: "tabular-nums", letterSpacing: "0.02em" }}>
                                            {ev.time}
                                        </span>

                                        {/* icon */}
                                        <div
                                            style={{
                                                width: "22px",
                                                height: "22px",
                                                borderRadius: "6px",
                                                background: `${ev.color}18`,
                                                border: `1px solid ${ev.color}33`,
                                                display: "flex",
                                                alignItems: "center",
                                                justifyContent: "center",
                                                color: ev.color,
                                            }}
                                        >
                                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                                {ICON_PATHS[ev.icon]}
                                            </svg>
                                        </div>

                                        {/* content */}
                                        <div>
                                            <span style={{ fontSize: "0.78rem", color: "var(--text-primary)", fontWeight: 500 }}>
                                                {ev.label}
                                            </span>
                                            <span style={{ fontSize: "0.7rem", color: "var(--text-tertiary)", marginLeft: "6px" }}>
                                                {ev.detail}
                                            </span>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {/* blinking cursor when last event not yet shown */}
                            {visibleLogs < LOG_EVENTS.length && (
                                <div style={{ padding: "7px 14px", display: "flex", alignItems: "center", gap: "8px" }}>
                                    <span style={{ display: "inline-block", width: "60px" }} />
                                    <motion.div
                                        animate={{ opacity: [1, 0, 1] }}
                                        transition={{ duration: 0.9, repeat: Infinity }}
                                        style={{
                                            width: "8px",
                                            height: "14px",
                                            borderRadius: "2px",
                                            background: "var(--accent-primary)",
                                            opacity: 0.6,
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <style>{`
                .gate-log-scroll::-webkit-scrollbar { display: none; }
                .gate-log-scroll { scrollbar-width: none; -ms-overflow-style: none; }
            `}</style>
            </div>
        </div>
    );
}
