"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";

// ─────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────
const NAV_ITEMS = [
    "Admin Dashboard",
    "Visitor Queue",
    "Gate Control",
    "Access Audit",
    "Resident Requests",
    "Announcements",
];

type Status = "Approved" | "Pending" | "Scheduled" | "Denied";

interface VisitorRow {
    initials: string;
    name: string;
    sub: string;
    type: string;
    status: Status;
}

const STATUS_META: Record<Status, { bg: string; color: string; dot: string }> = {
    Approved: { bg: "rgba(84,132,255,0.15)", color: "#7aa3ff", dot: "#5484ff" },
    Pending: { bg: "rgba(251,191,36,0.1)", color: "#fbbf24", dot: "#fbbf24" },
    Scheduled: { bg: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.45)", dot: "rgba(255,255,255,0.3)" },
    Denied: { bg: "rgba(248,113,113,0.1)", color: "#f87171", dot: "#f87171" },
};

const GATE_NODES = ["Main Gate", "Lobby Checkpoint", "Service Entry"];

const VISITOR_SETS: VisitorRow[][] = [
    [
        { initials: "AJ", name: "A. Johnson", sub: "Access request", type: "Delivery guest", status: "Approved" },
        { initials: "GV", name: "Greenfield Vendor", sub: "Access request", type: "Maintenance team", status: "Pending" },
        { initials: "RF", name: "Resident Family", sub: "Access request", type: "Personal visit", status: "Scheduled" },
    ],
    [
        { initials: "SC", name: "S. Chen", sub: "Access request", type: "Contractor", status: "Approved" },
        { initials: "MK", name: "M. Kim", sub: "Access request", type: "Delivery guest", status: "Pending" },
        { initials: "TD", name: "T. Davis", sub: "Access request", type: "Personal visit", status: "Denied" },
    ],
    [
        { initials: "PM", name: "P. Martinez", sub: "Access request", type: "Maintenance team", status: "Scheduled" },
        { initials: "JO", name: "J. Okafor", sub: "Access request", type: "Delivery guest", status: "Approved" },
        { initials: "NW", name: "N. Walsh", sub: "Access request", type: "Personal visit", status: "Pending" },
    ],
];

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────
function Sidebar({ activeItem }: { activeItem: string }) {
    return (
        <div
            style={{
                width: "180px",
                flexShrink: 0,
                borderRight: "1px solid rgba(255,255,255,0.06)",
                padding: "18px 0",
                display: "flex",
                flexDirection: "column",
                gap: "2px",
            }}
        >
            <div
                style={{
                    fontSize: "0.6rem",
                    letterSpacing: "0.16em",
                    color: "rgba(255,255,255,0.22)",
                    textTransform: "uppercase",
                    padding: "0 16px 10px",
                }}
            >
                Admin Portal
            </div>
            {NAV_ITEMS.map((item) => {
                const active = item === activeItem;
                return (
                    <div
                        key={item}
                        style={{
                            padding: "9px 14px",
                            borderRadius: "8px",
                            margin: "0 8px",
                            background: active ? "rgba(84,132,255,0.18)" : "transparent",
                            border: active ? "1px solid rgba(84,132,255,0.28)" : "1px solid transparent",
                            fontSize: "0.82rem",
                            fontWeight: active ? 600 : 400,
                            color: active ? "#93b4ff" : "rgba(255,255,255,0.42)",
                            cursor: "default",
                            transition: "all 0.25s",
                        }}
                    >
                        {item}
                    </div>
                );
            })}
        </div>
    );
}

function StatusBadge({ status }: { status: Status }) {
    const meta = STATUS_META[status];
    return (
        <span
            style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "4px 12px",
                borderRadius: "999px",
                background: meta.bg,
                fontSize: "0.72rem",
                fontWeight: 600,
                color: meta.color,
                whiteSpace: "nowrap",
                letterSpacing: "0.02em",
                flexShrink: 0,
            }}
        >
            <span
                style={{
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    background: meta.dot,
                    flexShrink: 0,
                }}
            />
            {status}
        </span>
    );
}

function VisitorCard({ row, delay }: { row: VisitorRow; delay: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.3, delay }}
            style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "14px 16px",
                borderRadius: "10px",
                border: "1px solid rgba(255,255,255,0.07)",
                background: "rgba(255,255,255,0.025)",
            }}
        >
            {/* Name + sub */}
            <div style={{ flex: "0 0 180px", minWidth: 0 }}>
                <div
                    style={{
                        fontSize: "0.9rem",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        marginBottom: "2px",
                    }}
                >
                    {row.name}
                </div>
                <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)" }}>
                    {row.sub}
                </div>
            </div>

            {/* Type label */}
            <div style={{ flex: 1, fontSize: "0.82rem", color: "rgba(255,255,255,0.38)" }}>
                {row.type}
            </div>

            <StatusBadge status={row.status} />
        </motion.div>
    );
}

function QueuePanel({ visitors, tick }: { visitors: VisitorRow[]; tick: number }) {
    return (
        <div style={{ flex: 1, minWidth: 0, padding: "20px 20px 24px" }}>
            {/* Queue card */}
            <div
                style={{
                    borderRadius: "14px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(255,255,255,0.02)",
                    padding: "18px 20px",
                    marginBottom: "12px",
                }}
            >
                {/* Panel header */}
                <div
                    style={{
                        display: "flex",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: "12px",
                        marginBottom: "14px",
                    }}
                >
                    <div>
                        <div
                            style={{
                                fontSize: "1rem",
                                fontWeight: 700,
                                color: "var(--text-primary)",
                                marginBottom: "4px",
                            }}
                        >
                            Today's operations queue
                        </div>
                        <div style={{ fontSize: "0.76rem", color: "rgba(255,255,255,0.35)", lineHeight: 1.5, maxWidth: "380px" }}>
                            Visit requests, expected arrivals, gate dependencies, and pending approvals in one view.
                        </div>
                    </div>
                    <motion.div
                        key={tick}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                            fontSize: "0.68rem",
                            color: "rgba(255,255,255,0.3)",
                            whiteSpace: "nowrap",
                            flexShrink: 0,
                            marginTop: "2px",
                        }}
                    >
                        Updated {tick % 3 === 0 ? "just now" : tick % 3 === 1 ? "1m ago" : "2m ago"}
                    </motion.div>
                </div>

                {/* Visitor rows */}
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <AnimatePresence mode="wait">
                        {visitors.map((v, i) => (
                            <VisitorCard key={`${v.name}-${tick}`} row={v} delay={i * 0.08} />
                        ))}
                    </AnimatePresence>
                </div>
            </div>

            {/* Feature panels */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div
                    style={{
                        borderRadius: "14px",
                        border: "1px solid rgba(255,255,255,0.07)",
                        background: "linear-gradient(160deg, rgba(84,132,255,0.08), rgba(255,255,255,0.015))",
                        padding: "16px 18px",
                    }}
                >
                    <div
                        style={{
                            fontSize: "0.58rem",
                            letterSpacing: "0.14em",
                            color: "rgba(255,255,255,0.22)",
                            textTransform: "uppercase",
                            marginBottom: "6px",
                        }}
                    >
                        Resident Experience
                    </div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
                        Fewer handoffs
                    </div>
                    <div style={{ fontSize: "0.74rem", color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>
                        Residents can manage guests, visit requests, dues, and updates without switching tools.
                    </div>
                </div>
                <div
                    style={{
                        borderRadius: "14px",
                        border: "1px solid rgba(84,132,255,0.15)",
                        background: "linear-gradient(160deg, rgba(84,132,255,0.12), rgba(255,255,255,0.02))",
                        padding: "16px 18px",
                    }}
                >
                    <div
                        style={{
                            fontSize: "0.58rem",
                            letterSpacing: "0.14em",
                            color: "rgba(84,132,255,0.5)",
                            textTransform: "uppercase",
                            marginBottom: "6px",
                        }}
                    >
                        Admin Operations
                    </div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "8px" }}>
                        Cleaner control
                    </div>
                    <div style={{ fontSize: "0.74rem", color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>
                        Teams get one place for residencies, visitors, gate events, forums, plugins, and reporting.
                    </div>
                </div>
            </div>

            {/* Gate map */}
            <GateMap />
        </div>
    );
}

function GateMap() {
    const [activeNode, setActiveNode] = useState(0);

    useEffect(() => {
        const id = setInterval(() => setActiveNode((n) => (n + 1) % GATE_NODES.length), 1200);
        return () => clearInterval(id);
    }, []);

    return (
        <div
            style={{
                borderRadius: "14px",
                border: "1px solid rgba(255,255,255,0.07)",
                background: "rgba(255,255,255,0.02)",
                padding: "16px 18px",
            }}
        >
            <div
                style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "12px",
                    gap: "12px",
                }}
            >
                <div>
                    <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "var(--text-primary)", marginBottom: "4px" }}>
                        Gate dependency map
                    </div>
                    <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", lineHeight: 1.5 }}>
                        Model how visitors move through main gates, inner checkpoints, and dependent access points.
                    </div>
                </div>
                <span
                    style={{
                        flexShrink: 0,
                        padding: "4px 10px",
                        borderRadius: "999px",
                        background: "rgba(84,132,255,0.14)",
                        border: "1px solid rgba(84,132,255,0.28)",
                        fontSize: "0.68rem",
                        fontWeight: 600,
                        color: "#93b4ff",
                        marginTop: "2px",
                    }}
                >
                    Tree view
                </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                {GATE_NODES.map((node, i) => (
                    <div key={node} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <motion.div
                            animate={
                                i === activeNode
                                    ? { background: "rgba(84,132,255,0.18)", borderColor: "rgba(84,132,255,0.45)", color: "#93b4ff" }
                                    : { background: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }
                            }
                            transition={{ duration: 0.35 }}
                            style={{
                                padding: "6px 14px",
                                borderRadius: "8px",
                                border: "1px solid",
                                fontSize: "0.76rem",
                                fontWeight: 500,
                                whiteSpace: "nowrap",
                            }}
                        >
                            {node}
                        </motion.div>
                        {i < GATE_NODES.length - 1 && (
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0, opacity: 0.35 }}>
                                <path d="M2 7h10M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────
const DESIGN_WIDTH = 900;
const DESIGN_HEIGHT = 560;

export function CommunityDashboardIllustration() {
    const [tick, setTick] = useState(0);
    const [setIndex, setSetIndex] = useState(0);
    const [liveFlash, setLiveFlash] = useState(true);
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    // Scale transform: render at DESIGN_WIDTH, shrink on narrow containers
    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        const obs = new ResizeObserver(([entry]) => {
            const w = entry.contentRect.width;
            setScale(Math.min(1, w / DESIGN_WIDTH));
        });
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    useEffect(() => {
        // Rotate visitor set every ~4.5 seconds
        const visitorId = setInterval(() => {
            setTick((t) => t + 1);
            setSetIndex((s) => (s + 1) % VISITOR_SETS.length);
        }, 4500);

        // Pulse the live dot
        const flashId = setInterval(() => setLiveFlash((v) => !v), 1800);

        return () => {
            clearInterval(visitorId);
            clearInterval(flashId);
        };
    }, []);

    const visitors = VISITOR_SETS[setIndex];

    return (
        <div
            ref={containerRef}
            style={{
                width: "100%",
                overflow: "hidden",
                borderRadius: "20px",
                height: `${Math.round(scale * DESIGN_HEIGHT)}px`,
                transition: "height 0.15s ease",
            }}
        >
            <div
                style={{
                    width: `${DESIGN_WIDTH}px`,
                    height: `${DESIGN_HEIGHT}px`,
                    transformOrigin: "top left",
                    transform: `scale(${scale})`,
                    borderRadius: "20px",
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(8, 9, 11, 0.96)",
                    overflow: "hidden",
                    fontSize: "1rem",
                    display: "flex",
                    flexDirection: "column",
                }}
            >
                {/* Top bar */}
                <div
                    style={{
                        padding: "16px 24px",
                        borderBottom: "1px solid rgba(255,255,255,0.06)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "12px",
                        background: "rgba(255,255,255,0.02)",
                        flexShrink: 0,
                    }}
                >
                    <div>
                        <div
                            style={{
                                fontSize: "0.6rem",
                                letterSpacing: "0.18em",
                                color: "rgba(255,255,255,0.22)",
                                textTransform: "uppercase",
                                marginBottom: "3px",
                            }}
                        >
                            Live Operations Surface
                        </div>
                        <div
                            style={{
                                fontSize: "1.1rem",
                                fontWeight: 700,
                                color: "var(--text-primary)",
                                letterSpacing: "-0.02em",
                            }}
                        >
                            Community operations dashboard
                        </div>
                    </div>
                    <motion.div
                        animate={{ opacity: liveFlash ? 1 : 0.5 }}
                        transition={{ duration: 0.6 }}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "6px 14px",
                            borderRadius: "999px",
                            background: "rgba(74,222,128,0.12)",
                            border: "1px solid rgba(74,222,128,0.28)",
                        }}
                    >
                        <span
                            style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                background: "#4ade80",
                                flexShrink: 0,
                            }}
                        />
                        <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "#4ade80" }}>Live</span>
                    </motion.div>
                </div>

                {/* Body: sidebar + content */}
                <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
                    <Sidebar activeItem="Visitor Queue" />
                    <QueuePanel visitors={visitors} tick={tick} />
                </div>
            </div>
        </div>
    );
}
