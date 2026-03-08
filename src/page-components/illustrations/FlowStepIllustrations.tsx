"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

// ── Card 01 ── Invite Form Illustration
export function InviteFormIllustration() {
    const [phase, setPhase] = useState<0 | 1 | 2>(0);
    // 0 = idle/filling, 1 = ready, 2 = sent

    useEffect(() => {
        let t1: ReturnType<typeof setTimeout>;
        let t2: ReturnType<typeof setTimeout>;
        let t3: ReturnType<typeof setTimeout>;
        const cycle = () => {
            setPhase(0);
            t1 = setTimeout(() => setPhase(1), 1300);
            t2 = setTimeout(() => setPhase(2), 2700);
            t3 = setTimeout(cycle, 4600);
        };
        cycle();
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }, []);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
            {/* Guest row */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.03)",
                    padding: "7px 10px",
                }}
            >
                <div
                    style={{
                        width: "22px",
                        height: "22px",
                        borderRadius: "50%",
                        background: "linear-gradient(135deg, rgba(84,132,255,0.3), rgba(56,189,248,0.15))",
                        border: "1px solid rgba(84,132,255,0.35)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.58rem",
                        color: "#5484ff",
                        fontWeight: 700,
                        flexShrink: 0,
                    }}
                >
                    SC
                </div>
                <span style={{ fontSize: "0.78rem", color: "var(--text-primary)", flex: 1 }}>
                    Sarah Chen
                </span>
                <span
                    style={{
                        padding: "2px 7px",
                        borderRadius: "999px",
                        background: "rgba(56,189,248,0.1)",
                        border: "1px solid rgba(56,189,248,0.2)",
                        color: "#38bdf8",
                        fontSize: "0.64rem",
                        fontWeight: 500,
                    }}
                >
                    Contractor
                </span>
            </div>

            {/* Time row */}
            <div
                style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    borderRadius: "10px",
                    border: "1px solid rgba(255,255,255,0.06)",
                    background: "rgba(255,255,255,0.02)",
                    padding: "7px 10px",
                }}
            >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
                    <circle cx="6" cy="6" r="5" stroke="rgba(255,255,255,0.28)" strokeWidth="1" />
                    <path
                        d="M6 3v3l2 1.5"
                        stroke="rgba(255,255,255,0.4)"
                        strokeWidth="1"
                        strokeLinecap="round"
                    />
                </svg>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)", flex: 1 }}>
                    Jan 15 &middot; 9am – 5pm
                </span>
                <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.28)" }}>Unit 204</span>
            </div>

            {/* Send button */}
            <motion.div
                animate={
                    phase === 2
                        ? { background: "rgba(84,132,255,0.18)", borderColor: "rgba(84,132,255,0.45)" }
                        : { background: "rgba(84,132,255,0.06)", borderColor: "rgba(84,132,255,0.18)" }
                }
                transition={{ duration: 0.45 }}
                style={{
                    borderRadius: "10px",
                    border: "1px solid",
                    padding: "8px 12px",
                    textAlign: "center",
                    cursor: "default",
                }}
            >
                <AnimatePresence mode="wait">
                    <motion.span
                        key={phase}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.22 }}
                        style={{
                            fontSize: "0.78rem",
                            fontWeight: 600,
                            color: phase === 2 ? "#5484ff" : "rgba(84,132,255,0.6)",
                        }}
                    >
                        {phase === 2 ? "\u2713 Invite Sent" : "Send Invite"}
                    </motion.span>
                </AnimatePresence>
            </motion.div>
        </div>
    );
}

// ── Card 02 ── Check-in Panel Illustration
// Phase 0: waiting for scan/code  |  1: visitor matched  |  2: gates approved  |  3: notifications sent
const GATES = ["Main Entrance", "North Block"];

export function CheckInPanelIllustration() {
    // 0=awaiting, 1=matched, 2=gates approved, 3=notified — then loops
    const [phase, setPhase] = useState<0 | 1 | 2 | 3>(0);
    const [codeInput, setCodeInput] = useState("");
    const [gatesApproved, setGatesApproved] = useState<boolean[]>([false, false]);

    useEffect(() => {
        let timers: ReturnType<typeof setTimeout>[] = [];
        const cycle = () => {
            setPhase(0);
            setCodeInput("");
            setGatesApproved([false, false]);

            // type in code  
            const chars = "VMS-4821";
            chars.split("").forEach((_, i) => {
                timers.push(setTimeout(() => setCodeInput(chars.slice(0, i + 1)), 300 + i * 90));
            });

            // matched
            timers.push(setTimeout(() => setPhase(1), 1200));

            // approve gate 1
            timers.push(setTimeout(() => {
                setPhase(2);
                setGatesApproved([true, false]);
            }, 2000));

            // approve gate 2
            timers.push(setTimeout(() => setGatesApproved([true, true]), 2600));

            // notified
            timers.push(setTimeout(() => setPhase(3), 3200));

            // restart
            timers.push(setTimeout(cycle, 5400));
        };
        cycle();
        return () => timers.forEach(clearTimeout);
    }, []);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>

            {/* Scan / code row */}
            <div
                style={{
                    borderRadius: "10px",
                    border: `1px solid ${phase >= 1 ? "rgba(74,222,128,0.28)" : "rgba(255,255,255,0.08)"}`,
                    background: phase >= 1 ? "rgba(74,222,128,0.05)" : "rgba(255,255,255,0.03)",
                    padding: "8px 10px",
                    display: "flex",
                    alignItems: "center",
                    gap: "9px",
                    transition: "border-color 0.35s, background 0.35s",
                    minHeight: "44px",
                }}
            >
                {/* QR icon */}
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0, opacity: phase === 0 ? 0.5 : 0.9 }}>
                    <rect x="3" y="3" width="7" height="7" rx="1" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" fill="none" />
                    <rect x="5" y="5" width="3" height="3" fill="rgba(255,255,255,0.5)" />
                    <rect x="14" y="3" width="7" height="7" rx="1" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" fill="none" />
                    <rect x="16" y="5" width="3" height="3" fill="rgba(255,255,255,0.5)" />
                    <rect x="3" y="14" width="7" height="7" rx="1" stroke="rgba(255,255,255,0.5)" strokeWidth="1.2" fill="none" />
                    <rect x="5" y="16" width="3" height="3" fill="rgba(255,255,255,0.5)" />
                    <path d="M14 14h2v2h-2zM16 16h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z" fill="rgba(255,255,255,0.4)" />
                </svg>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <AnimatePresence mode="wait">
                        {phase === 0 ? (
                            <motion.div
                                key="input"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                style={{ display: "flex", alignItems: "center", gap: "6px" }}
                            >
                                <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.6)", fontFamily: "monospace", letterSpacing: "0.06em" }}>
                                    {codeInput || <span style={{ opacity: 0.3 }}>Pass code or QR scan</span>}
                                    {codeInput && codeInput.length < 8 && (
                                        <span style={{ opacity: 0.6, animation: "blink 0.8s step-end infinite" }}>|</span>
                                    )}
                                </span>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="visitor"
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.25 }}
                                style={{ display: "flex", alignItems: "center", gap: "7px" }}
                            >
                                <div style={{
                                    width: "22px", height: "22px", borderRadius: "50%", flexShrink: 0,
                                    background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.35)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: "0.55rem", fontWeight: 700, color: "#4ade80",
                                }}>
                                    JO
                                </div>
                                <div>
                                    <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "#4ade80" }}>James Okafor</div>
                                    <div style={{ fontSize: "0.65rem", color: "var(--text-tertiary)" }}>VMS-4821 &middot; Pre-approved</div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* status dot */}
                <div style={{
                    width: "7px", height: "7px", borderRadius: "50%", flexShrink: 0,
                    background: phase === 0 ? "rgba(255,255,255,0.2)" : "#4ade80",
                    boxShadow: phase >= 1 ? "0 0 0 3px rgba(74,222,128,0.15)" : "none",
                    transition: "all 0.35s",
                }} />
            </div>

            {/* Gates row */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "7px" }}>
                {GATES.map((gate, i) => {
                    const approved = gatesApproved[i];
                    return (
                        <motion.div
                            key={gate}
                            animate={
                                approved
                                    ? { background: "rgba(74,222,128,0.08)", borderColor: "rgba(74,222,128,0.3)" }
                                    : { background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.07)" }
                            }
                            transition={{ duration: 0.35 }}
                            style={{
                                borderRadius: "9px",
                                border: "1px solid",
                                padding: "6px 8px",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                            }}
                        >
                            <motion.div
                                animate={approved ? { background: "#4ade80", borderColor: "transparent", scale: 1 } : { background: "transparent", borderColor: "rgba(255,255,255,0.2)", scale: 1 }}
                                transition={{ duration: 0.3 }}
                                style={{
                                    width: "12px", height: "12px", borderRadius: "50%", flexShrink: 0,
                                    border: "1px solid", display: "flex", alignItems: "center", justifyContent: "center",
                                }}
                            >
                                {approved && (
                                    <svg width="7" height="7" viewBox="0 0 7 7" fill="none">
                                        <path d="M1.5 3.5l1.5 1.5 2.5-3" stroke="#000" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                            </motion.div>
                            <span style={{
                                fontSize: "0.69rem",
                                fontWeight: approved ? 600 : 400,
                                color: approved ? "#4ade80" : "var(--text-tertiary)",
                                whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                            }}>
                                {gate}
                            </span>
                        </motion.div>
                    );
                })}
            </div>

            {/* Notification strip */}
            <AnimatePresence>
                {phase === 3 && (
                    <motion.div
                        key="notif"
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: "auto", marginTop: 0 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        style={{
                            borderRadius: "9px",
                            border: "1px solid rgba(84,132,255,0.28)",
                            background: "rgba(84,132,255,0.08)",
                            padding: "6px 10px",
                            display: "flex",
                            alignItems: "center",
                            gap: "7px",
                            overflow: "hidden",
                        }}
                    >
                        <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ flexShrink: 0 }}>
                            <path d="M5.5 1a4.5 4.5 0 100 9 4.5 4.5 0 000-9zM5.5 4v3M5.5 7.5v.5" stroke="#5484ff" strokeWidth="1.1" strokeLinecap="round" />
                        </svg>
                        <span style={{ fontSize: "0.69rem", color: "#5484ff", fontWeight: 500 }}>
                            Host &amp; security notified &middot; 10:47am
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ── Card 03 ── Visit History Illustration
const VISITS = [
    {
        initials: "SC",
        name: "S. Chen",
        time: "9:12am",
        gate: "Main",
        status: "EXIT",
        statusColor: "rgba(255,255,255,0.45)",
        statusBg: "rgba(255,255,255,0.05)",
    },
    {
        initials: "JO",
        name: "J. Okafor",
        time: "10:47am",
        gate: "North",
        status: "ACTIVE",
        statusColor: "#4ade80",
        statusBg: "rgba(74,222,128,0.1)",
    },
    {
        initials: "PN",
        name: "P. Nair",
        time: "11:30am",
        gate: "East",
        status: "ENTRY",
        statusColor: "#5484ff",
        statusBg: "rgba(84,132,255,0.1)",
    },
];

export function VisitHistoryIllustration() {
    const [highlight, setHighlight] = useState(1);

    useEffect(() => {
        const interval = setInterval(
            () => setHighlight((h) => (h + 1) % VISITS.length),
            2100,
        );
        return () => clearInterval(interval);
    }, []);

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            {/* Column headers */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 52px 50px",
                    padding: "0 8px 3px",
                    gap: "6px",
                }}
            >
                {["Guest", "Time", "Status"].map((h) => (
                    <span
                        key={h}
                        style={{
                            fontSize: "0.62rem",
                            color: "rgba(255,255,255,0.24)",
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                        }}
                    >
                        {h}
                    </span>
                ))}
            </div>

            {/* Rows */}
            {VISITS.map((v, i) => (
                <motion.div
                    key={v.name}
                    animate={
                        i === highlight
                            ? { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)" }
                            : { background: "rgba(255,255,255,0.015)", borderColor: "rgba(255,255,255,0.05)" }
                    }
                    transition={{ duration: 0.3 }}
                    style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 52px 50px",
                        padding: "6px 8px",
                        borderRadius: "8px",
                        border: "1px solid",
                        gap: "6px",
                        alignItems: "center",
                    }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                        <div
                            style={{
                                width: "18px",
                                height: "18px",
                                borderRadius: "50%",
                                flexShrink: 0,
                                background: "rgba(255,255,255,0.06)",
                                border: "1px solid rgba(255,255,255,0.1)",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "0.5rem",
                                color: "rgba(255,255,255,0.4)",
                                fontWeight: 700,
                            }}
                        >
                            {v.initials}
                        </div>
                        <span
                            style={{
                                fontSize: "0.75rem",
                                color: "var(--text-secondary)",
                                whiteSpace: "nowrap",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                            }}
                        >
                            {v.name}
                        </span>
                    </div>
                    <span style={{ fontSize: "0.71rem", color: "rgba(255,255,255,0.32)" }}>{v.time}</span>
                    <span
                        style={{
                            fontSize: "0.62rem",
                            fontWeight: 600,
                            color: v.statusColor,
                            padding: "2px 5px",
                            borderRadius: "5px",
                            background: v.statusBg,
                            whiteSpace: "nowrap",
                        }}
                    >
                        {v.status}
                    </span>
                </motion.div>
            ))}
        </div>
    );
}
