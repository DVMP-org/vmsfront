import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    ManagerMockup,
    ResidentMockup,
    SecurityMockup,
} from "./illustrations/PersonaMockups";
const appName = process.env.NEXT_PUBLIC_APP_NAME;
/* ─── Data ─────────────────────────────────────────────────────────────── */

type Persona = {
    id: string;
    label: string;
    headline: string;
    description: string;
    features: { icon: string; title: string; detail: string }[];
    accentColor: string;
    mockup: "manager" | "resident" | "security";
};

const PERSONAS: Persona[] = [
    {
        id: "manager",
        label: "Community Manager",
        headline: "Full visibility across your entire property.",
        description:
            "Manage access policies, review audit trails, and coordinate across staff — all from one dashboard.",
        features: [
            {
                icon: "grid",
                title: "Multi-Segment Dashboard",
                detail: "One view across all gates, residents, and vehicles with live status.",
            },
            {
                icon: "shield",
                title: "Transparency & Security",
                detail: "Full read/write audit trail on every gate event, rule change, and access decision.",
            },
            {
                icon: "chart",
                title: "Data-Driven Insights",
                detail: "Spot patterns in peak hours, unauthorized attempts, and resident activity.",
            },
            {
                icon: "users",
                title: "Role-Based Permissions",
                detail: "Staff, security guards, and admins each see only what they need to.",
            },
        ],
        accentColor: "#7ca9ff",
        mockup: "manager",
    },
    {
        id: "resident",
        label: "Community Resident",
        headline: "Seamless access for you and your guests.",
        description:
            "Invite visitors, track deliveries, and manage gate access from your phone — no front desk required.",
        features: [
            {
                icon: "phone",
                title: "Improved Resident Experience",
                detail: "One-tap guest invites with QR codes, PINs, or license plate recognition.",
            },
            {
                icon: "bell",
                title: "Inclusive Communication",
                detail: "Instant notifications when a visitor arrives, is denied, or presents an issue.",
            },
            {
                icon: "clock",
                title: "Time-Limited Access",
                detail: "Grant one-time, recurring, or time-window access to contractors and aides.",
            },
            {
                icon: "lock",
                title: "Remote Gate Control",
                detail: "Let in a trusted visitor remotely with a single tap from anywhere.",
            },
        ],
        accentColor: "#48d8c8",
        mockup: "resident",
    },
    {
        id: "security",
        label: "Community Security",
        headline: "Instant decisions at the gate — every time.",
        description:
            "Verify identity, check access rules, and log every event in real time. No guesswork, no paper lists.",
        features: [
            {
                icon: "eye",
                title: "Real-Time Access Control",
                detail: "Live gate panel shows approved visitors, flagged vehicles, and override history.",
            },
            {
                icon: "id",
                title: "Instant Visitor Verification",
                detail: "Scan QR code or license plate — access decision appears in under a second.",
            },
            {
                icon: "file",
                title: "Complete Audit Trail",
                detail: "Every grant, denial, and manual override is permanently logged with timestamp.",
            },
            {
                icon: "alert",
                title: "Incident Flagging",
                detail: "Flag an event, attach notes, and notify the manager — all from the gate panel.",
            },
        ],
        accentColor: "#3dd68c",
        mockup: "security",
    },
];

/* ─── Icon paths ─────────────────────────────────────────────────────────── */

const ICONS: Record<string, string> = {
    grid: "M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 0h7v7h-7z",
    shield: "M12 2L3 6v6c0 5.25 3.75 10.17 9 11.33C17.25 22.17 21 17.25 21 12V6l-9-4z",
    chart: "M3 21V9l6-6 5 8 3-3 4 4v9H3z",
    users: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75",
    phone: "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8 19.79 19.79 0 01.08 2.18 2 2 0 012.06 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z",
    bell: "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0",
    clock: "M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10zM12 6v6l4 2",
    lock: "M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2zM7 11V7a5 5 0 0110 0v4",
    eye: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8zM12 9a3 3 0 100 6 3 3 0 000-6z",
    id: "M20 7H4a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM8 15a3 3 0 110-6 3 3 0 010 6zm6-1h4m-4-3h4",
    file: "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zM14 2v6h6M16 13H8m8 4H8m2-8H8",
    alert: "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4m0 4h.01",
};

function FeatureIcon({ name, color }: { name: string; color: string }) {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ flexShrink: 0, marginTop: "2px" }}
        >
            <path d={ICONS[name] ?? ICONS.file} />
        </svg>
    );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */

export function PersonaTabs() {
    const [activeId, setActiveId] = useState<string>("manager");
    const active = PERSONAS.find((p) => p.id === activeId)!;

    return (
        <section
            className="section persona-section"
            style={{ position: "relative", overflow: "hidden", paddingTop: "100px", paddingBottom: "100px" }}
        >
            {/* Ambient blobs */}
            <div
                className="glow-blob blue"
                style={{ width: "500px", height: "500px", top: "20%", left: "-10%", opacity: 0.35 }}
            />
            <div
                className="glow-blob violet"
                style={{ width: "400px", height: "400px", bottom: "10%", right: "-8%", opacity: 0.3 }}
            />

            <div className="container" style={{ position: "relative", zIndex: 10 }}>
                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: "56px" }}>
                    <span className="section-label" style={{ marginBottom: "16px", display: "inline-block" }}>
                        Built for every role
                    </span>
                    <h2 className="section-headline" style={{ margin: "0 auto 16px auto" }}>
                        One platform. Every stakeholder.
                    </h2>
                    <p className="section-desc" style={{ maxWidth: "520px", margin: "0 auto" }}>
                        {appName} adapts to how each person in your community actually works.
                    </p>
                </div>

                {/* Tab buttons */}
                <div
                    className="persona-tabs-row"
                    style={{
                        display: "flex",
                        justifyContent: "center",
                        gap: "8px",
                        marginBottom: "56px",
                        flexWrap: "wrap",
                    }}
                >
                    {PERSONAS.map((persona) => {
                        const isActive = persona.id === activeId;
                        return (
                            <button
                                key={persona.id}
                                onClick={() => setActiveId(persona.id)}
                                className="persona-tab-btn"
                                style={{
                                    padding: "10px 24px",
                                    borderRadius: "999px",
                                    border: isActive
                                        ? `1px solid ${persona.accentColor}50`
                                        : "1px solid rgba(255,255,255,0.1)",
                                    background: isActive
                                        ? `${persona.accentColor}18`
                                        : "transparent",
                                    color: isActive ? persona.accentColor : "var(--text-secondary)",
                                    fontSize: "0.9rem",
                                    fontWeight: isActive ? 600 : 400,
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    letterSpacing: "0.01em",
                                    outline: "none",
                                }}
                            >
                                {persona.label}
                            </button>
                        );
                    })}
                </div>

                {/* Panel */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeId}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -12 }}
                        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <div
                            className="gradient-border-card"
                            style={{ maxWidth: "980px", margin: "0 auto" }}
                        >
                            <div
                                className="persona-panel-grid"
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "1fr 1fr",
                                    gap: "0",
                                    alignItems: "center",
                                    minHeight: "380px",
                                }}
                            >
                                {/* Left: Device Mockup */}
                                <div
                                    className="persona-panel-mockup"
                                    style={{
                                        padding: "48px 40px 48px 48px",
                                        borderRight: "1px solid rgba(255,255,255,0.06)",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            justifyContent: "center",
                                            width: "100%",
                                            filter: `drop-shadow(0 0 32px ${active.accentColor}30)`,
                                            transition: "filter 0.4s ease",
                                        }}
                                    >
                                        {activeId === "manager" && <ManagerMockup color={active.accentColor} />}
                                        {activeId === "resident" && <ResidentMockup color={active.accentColor} />}
                                        {activeId === "security" && <SecurityMockup color={active.accentColor} />}
                                    </div>
                                </div>

                                {/* Right: Features */}
                                <div className="persona-panel-features" style={{ padding: "48px 48px 48px 40px" }}>
                                    <h3
                                        className="persona-panel-headline font-display"
                                        style={{
                                            fontSize: "clamp(1.05rem, 2.5vw, 1.35rem)",
                                            fontWeight: 700,
                                            color: "var(--text-primary)",
                                            marginBottom: "12px",
                                            lineHeight: 1.3,
                                        }}
                                    >
                                        {active.headline}
                                    </h3>
                                    <p
                                        className="persona-panel-desc"
                                        style={{
                                            color: "var(--text-secondary)",
                                            fontSize: "0.95rem",
                                            lineHeight: 1.65,
                                            marginBottom: "32px",
                                        }}
                                    >
                                        {active.description}
                                    </p>

                                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                                        {active.features.map((feat) => (
                                            <div key={feat.title} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                                                <div
                                                    style={{
                                                        width: "30px",
                                                        height: "30px",
                                                        borderRadius: "8px",
                                                        background: `${active.accentColor}14`,
                                                        border: `1px solid ${active.accentColor}30`,
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent: "center",
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    <FeatureIcon name={feat.icon} color={active.accentColor} />
                                                </div>
                                                <div>
                                                    <div
                                                        className="persona-feature-title"
                                                        style={{
                                                            fontSize: "0.9rem",
                                                            fontWeight: 600,
                                                            color: "var(--text-primary)",
                                                            marginBottom: "4px",
                                                        }}
                                                    >
                                                        {feat.title}
                                                    </div>
                                                    <div
                                                        className="persona-feature-detail"
                                                        style={{
                                                            fontSize: "0.83rem",
                                                            color: "var(--text-tertiary)",
                                                            lineHeight: 1.55,
                                                        }}
                                                    >
                                                        {feat.detail}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>
            </div>
        </section>
    );
}
