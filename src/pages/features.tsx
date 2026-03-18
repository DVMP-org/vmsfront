import Head from "next/head";
import { useState } from "react";
import { Footer } from "@/page-components/Footer";
import { Nav } from "@/page-components/Nav";
import { useAppContext } from "@/lib/app_context";


export default function FeaturesPage() {
    const { appName } = useAppContext();
    const [activeFilter, setActiveFilter] = useState<string | null>(null);

    const overviewCards = [
        {
            label: "Access operations",
            value: "Passes, approvals, gate events",
            body: `The visitor stood at the gate. The approval was in someone’s phone. That’s the last time. Invitations, passes, QR codes, and gate events in one shared view.`,
            icon: "🚪",
        },
        {
            label: "Resident workflows",
            value: "Requests, dues, community",
            body: `${appName} stops residents from calling your front desk for every guest invite, dues question, or announcement. Self-service workflows mean your team handles less repetitive work.`,
            icon: "🏘️",
        },
        {
            label: "Admin control",
            value: "Roles, properties, plugins",
            body: `One admin layer for residencies, teams, gate hierarchies, branding, billing, and reporting. No more stitching five tools together to run one community.`,
            icon: "⚙️",
        },
    ];

    const featureGroups = [
        {
            id: "visitor-access",
            eyebrow: "Visitor access",
            title: "Stop finding out about arrivals after the fact",
            description:
                `The visitor is at the gate. The approval is in a WhatsApp thread from three days ago. Nobody can find it. ${appName} gives every role — resident, gate team, and admin — one clear view of who was invited, what they were approved for, and when they arrived.`,
            bestFor: "Front desks, gate teams, resident services, and property operators",
            features: [
                "Visitor invitations and approval flows",
                "Resident-created guest passes",
                "Pass codes and QR-based access",
                "Visitor records and visit history",
                "Visit request intake for public users",
                "Expected arrivals and pending action visibility",
            ],
            highlights: ["No more 'who approved this?'", "Faster arrivals", "Clean approval records"],
        },
        {
            id: "gate-operations",
            eyebrow: "Gate operations",
            title: "A gate console built for real movement, not just record-keeping",
            description:
                `Gate teams shouldn’t need to check three apps to decide if someone should enter. The gate console gives them one surface for check-in, QR scanning, event history, and pass status — so arrivals flow without back-and-forth.`,
            bestFor: "Security teams, gate operators, checkpoint staff, and operations leads",
            features: [
                "Dedicated gate console for check-in and check-out",
                "QR scanning and manual code entry",
                "Gate event records and scan history",
                "Per-pass scan activity timelines",
                "Multiple gates per property",
                "Gate dependency tree mapping for parent-child checkpoints",
            ],
            highlights: ["One console, zero confusion", "Movement traceability", "Gate hierarchy control"],
        },
        {
            id: "resident-experience",
            eyebrow: "Resident experience",
            title: "Residents stop calling. Staff stop repeating themselves.",
            description:
                "When a resident can invite their own cleaner, check their dues balance, submit a maintenance visit request, and read community announcements from one place — your front desk handles a fraction of the daily interruptions it used to.",
            bestFor: "Residents, community managers, estate coordinators, and service teams",
            features: [
                "Visit requests dashboard",
                "Visitors list and per-visitor detail views",
                "Community forum and announcements",
                "Dues ledger and due detail views",
                "Wallet visibility and actions",
                "Residency selection and profile workflows",
            ],
            highlights: ["Residents self-serve", "Fewer front-desk calls", "Community stays informed"],
        },
        {
            id: "admin-controls",
            eyebrow: "Admin controls",
            title: "Portfolio visibility and property control, from one login",
            description:
                "Stop logging into a different dashboard for every site. Admins get one layer for managing organizations, assigning roles, reviewing metrics, and controlling settings — whether you run one community or twenty.",
            bestFor: "Portfolio operators, community admins, operations managers, and leadership teams",
            features: [
                "Admin dashboard with operational metrics",
                "Residencies and residency group management",
                "Resident and visitor administration",
                "Gates management with dependency filtering and map views",
                "Admins, roles, and permission-aware navigation",
                "Analytics, transactions, and settings management",
            ],
            highlights: ["One login, every property", "Role-aware access", "Operational governance"],
        },
        {
            id: "platform-controls",
            eyebrow: "Platform",
            title: "Commercial readiness without enterprise complexity",
            description:
                `When ${appName} becomes part of your long-term operation, the platform layer covers branding, billing, plugin discovery, and deployment options — so growth doesn’t mean stitching in a new tool every six months.`,
            bestFor: "Commercial teams, platform owners, rollout leads, and multi-property operators",
            features: [
                "Organization selection and onboarding flows",
                "Subscription plans and billing details",
                "Payment gateway configuration",
                "Branding, notifications, and integrations settings",
                "Installed plugins management and marketplace discovery",
                "Deployment options for managed or controlled environments",
            ],
            highlights: ["Commercial readiness", "Configurable platform controls", "Extensible architecture"],
        },
    ];

    const quickIndex = featureGroups.map((group) => ({ id: group.id, label: group.eyebrow, title: group.title }));

    const platformScope = [
        "Visitor invitations and approvals",
        "Gate passes, QR codes, and event history",
        "Multi-gate dependency trees",
        "Resident requests, dues, and wallet views",
        "Forum and announcement workflows",
        "Admins, roles, analytics, plugins, and settings",
    ];

    return (
        <>
            <Head>
                <title>Features | {appName}</title>
                <meta
                    name="description"
                    content={`Explore ${appName} features across visitor access, gate operations, gate dependency mapping, resident workflows, admin controls, plugins, billing, and deployment.`}
                />
            </Head>
            <Nav />
            <main>
                {/* Hero Section */}
                <section className="section features-hero-section" style={{ paddingTop: "140px", paddingBottom: "80px", overflow: "hidden", position: "relative" }}>
                    <div
                        aria-hidden="true"
                        className="bg-glow"
                        style={{ top: "-8%", left: "10%", width: "500px", height: "500px", opacity: 0.35 }}
                    ></div>
                    <div
                        aria-hidden="true"
                        className="bg-glow"
                        style={{ top: "-5%", right: "2%", left: "auto", width: "420px", height: "420px", opacity: 0.22 }}
                    ></div>

                    <div className="container" style={{ position: "relative", zIndex: 1 }}>
                        <div
                            aria-hidden="true"
                            className="bg-glow"
                            style={{ top: "-16%", left: "10%", width: "400px", height: "400px", opacity: 0.42 }}
                        ></div>
                        <div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                right: "18%",
                                top: "20%",
                                color: "rgba(124,169,255,0.6)",
                                fontSize: "1.15rem",
                                opacity: 0.7,
                            }}
                        >
                            ✦
                        </div>
                        <div style={{ maxWidth: "900px", marginBottom: "48px" }}>
                            <div
                                aria-hidden="true"
                                style={{
                                    display: "flex",
                                    gap: "120px",
                                    marginBottom: "18px",
                                    opacity: 0.65,
                                }}
                            >
                                <span style={{ color: "rgba(124,169,255,0.7)", fontSize: "1.4rem" }}>✦</span>
                                <span style={{ color: "rgba(255,255,255,0.38)", fontSize: "0.9rem", marginTop: "10px" }}>✦</span>
                                <span style={{ color: "rgba(124,169,255,0.6)", fontSize: "1.1rem" }}>✦</span>
                            </div>
                            <span className="section-label">Features</span>
                            <h1 className="section-headline features-hero-headline" style={{ marginBottom: "20px", maxWidth: "800px", lineHeight: 1.15 }}>
                                One platform built around the actual workflows of access, resident operations, and property control
                            </h1>
                            <p className="section-desc features-hero-desc" style={{ marginBottom: "32px", maxWidth: "700px", fontSize: "1.05rem" }}>
                                Whether you're opening gates, approving visitors, managing dues, or coordinating across five properties, {appName} brings clarity to operations that usually stay disconnected.
                            </p>
                            <div className="features-hero-cta" style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
                                <a href="/pricing" className="btn-primary" style={{ textDecoration: "none" }}>
                                    View Pricing
                                </a>
                                <a href="/#contact" className="btn-secondary" style={{ textDecoration: "none" }}>
                                    Request Demo
                                </a>
                            </div>
                        </div>

                        {/* Overview Cards Grid */}
                        <div className="features-overview-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px" }}>
                            {overviewCards.map((card) => (
                                <div
                                    key={card.label}
                                    style={{
                                        padding: "24px",
                                        borderRadius: "20px",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        background: "linear-gradient(135deg, rgba(84,132,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
                                        transition: "all 0.3s ease",
                                        cursor: "pointer",
                                        backdropFilter: "blur(10px)",
                                    }}
                                    onMouseEnter={(e) => {
                                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(84,132,255,0.4)";
                                        (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg, rgba(84,132,255,0.1) 0%, rgba(255,255,255,0.04) 100%)";
                                        (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                                    }}
                                    onMouseLeave={(e) => {
                                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)";
                                        (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg, rgba(84,132,255,0.05) 0%, rgba(255,255,255,0.02) 100%)";
                                        (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                                    }}
                                >
                                    <div style={{ fontSize: "2.2rem", marginBottom: "12px" }}>{card.icon}</div>
                                    <div style={{ color: "var(--text-tertiary)", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "10px", fontWeight: 600 }}>
                                        {card.label}
                                    </div>
                                    <div className="features-overview-value" style={{ color: "var(--text-primary)", fontSize: "1.15rem", fontWeight: 700, marginBottom: "10px", lineHeight: 1.3 }}>
                                        {card.value}
                                    </div>
                                    <div className="features-overview-body" style={{ color: "var(--text-secondary)", fontSize: "0.93rem", lineHeight: 1.65 }}>
                                        {card.body}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Quick Navigation Section */}
                <section className="section" style={{ paddingTop: "0px", paddingBottom: "32px", overflow: "hidden" }}>
                    <div className="container">
                        <div className="card" style={{ padding: "24px", background: "linear-gradient(90deg, rgba(255,255,255,0.02), rgba(84,132,255,0.03), rgba(255,255,255,0.02))" }}>
                            <div className="features-quick-nav-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "24px", flexWrap: "wrap" }}>
                                <div>
                                    <div style={{ color: "var(--text-tertiary)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "6px", fontWeight: 600 }}>
                                        Navigate
                                    </div>
                                    <div style={{ color: "var(--text-secondary)", fontSize: "0.96rem" }}>
                                        Jump to feature areas
                                    </div>
                                </div>
                                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                                    {quickIndex.map((item) => (
                                        <a
                                            key={item.id}
                                            href={`#${item.id}`}
                                            className="btn-secondary"
                                            style={{
                                                textDecoration: "none",
                                                padding: "8px 14px",
                                                fontSize: "0.84rem",
                                                borderRadius: "18px",
                                                transition: "all 0.2s ease",
                                            }}
                                            onMouseEnter={(e) => {
                                                (e.currentTarget as HTMLElement).style.borderColor = "rgba(84,132,255,0.6)";
                                                (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                                            }}
                                            onMouseLeave={(e) => {
                                                (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)";
                                                (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                                            }}
                                        >
                                            {item.label}
                                        </a>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Grid Section */}
                <section className="section" style={{ paddingTop: "12px", paddingBottom: "60px", overflow: "hidden", position: "relative" }}>
                    <div
                        aria-hidden="true"
                        style={{
                            position: "absolute",
                            top: "0%",
                            left: "50%",
                            transform: "translateX(-50%)",
                            width: "70%",
                            height: "1px",
                            background: "linear-gradient(90deg, transparent, rgba(84,132,255,0.2), transparent)",
                            pointerEvents: "none",
                        }}
                    ></div>

                    <div className="container" style={{ display: "grid", gap: "24px", position: "relative", zIndex: 1 }}>
                        {featureGroups.map((group, index) => (
                            <div
                                id={group.id}
                                key={group.title}
                                className="card features-group-card"
                                style={{
                                    padding: "40px",
                                    background:
                                        index === 1
                                            ? "linear-gradient(135deg, rgba(84,132,255,0.08) 0%, rgba(84,132,255,0.03) 50%, rgba(255,255,255,0.02) 100%)"
                                            : index % 2 === 0
                                                ? "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(84,132,255,0.02) 100%)"
                                                : undefined,
                                    border: index === 1 ? "1px solid rgba(84,132,255,0.3)" : "1px solid rgba(255,255,255,0.08)",
                                    transition: "all 0.3s ease",
                                }}
                                onMouseEnter={(e) => {
                                    if (index !== 1) {
                                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(84,132,255,0.2)";
                                        (e.currentTarget as HTMLElement).style.background = "linear-gradient(135deg, rgba(84,132,255,0.04) 0%, rgba(255,255,255,0.03) 100%)";
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (index !== 1) {
                                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
                                        (e.currentTarget as HTMLElement).style.background = index % 2 === 0
                                            ? "linear-gradient(135deg, rgba(255,255,255,0.03) 0%, rgba(84,132,255,0.02) 100%)"
                                            : "";
                                    }
                                }}
                            >
                                <div
                                    className="features-group-inner"
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.2fr)",
                                        gap: "40px",
                                        alignItems: "start",
                                    }}
                                >
                                    <div>
                                        <span className="section-label" style={{ color: index === 1 ? "rgb(84,132,255)" : undefined }}>
                                            {group.eyebrow}
                                        </span>
                                        <h2 className="section-headline features-group-headline" style={{ marginBottom: "16px", maxWidth: "580px", fontSize: "clamp(1.6rem, 2.8vw, 2.4rem)", lineHeight: 1.2 }}>
                                            {group.title}
                                        </h2>
                                        <p className="section-desc features-group-desc" style={{ marginBottom: "24px", maxWidth: "560px", fontSize: "1.01rem" }}>
                                            {group.description}
                                        </p>

                                        <div
                                            style={{
                                                padding: "20px",
                                                borderRadius: "18px",
                                                border: "1px solid rgba(255,255,255,0.1)",
                                                background: "rgba(255,255,255,0.02)",
                                                marginBottom: "20px",
                                            }}
                                        >
                                            <div style={{ color: "var(--text-tertiary)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "8px", fontWeight: 600 }}>
                                                Best aligned to
                                            </div>
                                            <div className="features-best-for" style={{ color: "var(--text-primary)", fontSize: "0.97rem", lineHeight: 1.6, fontWeight: 500 }}>
                                                {group.bestFor}
                                            </div>
                                        </div>

                                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                            {group.highlights.map((highlight, hIdx) => (
                                                <span
                                                    key={highlight}
                                                    style={{
                                                        padding: "7px 12px",
                                                        borderRadius: "18px",
                                                        border: "1px solid rgba(84,132,255,0.3)",
                                                        background: "rgba(84,132,255,0.08)",
                                                        color: "rgb(132, 160, 255)",
                                                        fontSize: "0.81rem",
                                                        fontWeight: 500,
                                                        transition: "all 0.2s ease",
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        (e.currentTarget as HTMLElement).style.background = "rgba(84,132,255,0.15)";
                                                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(84,132,255,0.5)";
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        (e.currentTarget as HTMLElement).style.background = "rgba(84,132,255,0.08)";
                                                        (e.currentTarget as HTMLElement).style.borderColor = "rgba(84,132,255,0.3)";
                                                    }}
                                                >
                                                    {highlight}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    <div
                                        className="features-items-grid"
                                        style={{
                                            display: "grid",
                                            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                                            gap: "16px",
                                        }}
                                    >
                                        {group.features.map((feature) => (
                                            <div
                                                key={feature}
                                                style={{
                                                    padding: "18px",
                                                    borderRadius: "16px",
                                                    border: "1px solid rgba(255,255,255,0.08)",
                                                    background: "rgba(255,255,255,0.015)",
                                                    color: "var(--text-secondary)",
                                                    fontSize: "0.93rem",
                                                    lineHeight: 1.65,
                                                    transition: "all 0.25s ease",
                                                    cursor: "pointer",
                                                }}
                                                onMouseEnter={(e) => {
                                                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(84,132,255,0.4)";
                                                    (e.currentTarget as HTMLElement).style.background = "rgba(84,132,255,0.08)";
                                                    (e.currentTarget as HTMLElement).style.color = "var(--text-primary)";
                                                    (e.currentTarget as HTMLElement).style.transform = "translateY(-2px)";
                                                }}
                                                onMouseLeave={(e) => {
                                                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)";
                                                    (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.015)";
                                                    (e.currentTarget as HTMLElement).style.color = "var(--text-secondary)";
                                                    (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                                                }}
                                            >
                                                <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                                                    <svg
                                                        width="16"
                                                        height="16"
                                                        viewBox="0 0 16 16"
                                                        fill="none"
                                                        style={{
                                                            marginTop: "4px",
                                                            flexShrink: 0,
                                                            color: "rgb(84,132,255)",
                                                        }}
                                                    >
                                                        <circle
                                                            cx="8"
                                                            cy="8"
                                                            r="3"
                                                            fill="currentColor"
                                                        />
                                                    </svg>
                                                    <span className="features-item-text">{feature}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Closing Section */}
                <section className="section" style={{ overflow: "hidden", paddingBottom: "80px" }}>
                    <div
                        aria-hidden="true"
                        className="bg-glow"
                        style={{ bottom: "-10%", right: "5%", left: "auto", width: "420px", height: "420px", opacity: 0.18 }}
                    ></div>
                    <div className="container">
                        <div
                            className="card features-closing-card"
                            style={{
                                padding: "40px",
                                background: "linear-gradient(135deg, rgba(84,132,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
                                border: "1px solid rgba(84,132,255,0.2)",
                            }}
                        >
                            <div className="features-closing-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.1fr) minmax(0, 0.9fr)", gap: "40px", alignItems: "center" }}>
                                <div>
                                    <span className="section-label">Next steps</span>
                                    <h2 className="section-headline features-closing-headline" style={{ marginBottom: "18px", maxWidth: "700px" }}>
                                        Start with one workflow. The rest will make sense once you’re in.
                                    </h2>
                                    <p className="section-desc features-closing-desc" style={{ marginBottom: "28px", maxWidth: "680px", fontSize: "1.02rem" }}>
                                        Most teams start with visitor approvals and gate operations, then discover
                                        that resident self-service cuts their daily interruptions in half. Then
                                        leadership wants the reporting. Then the second property gets added.
                                        {appName} is designed to grow with you — not charge you for features you
                                        haven’t reached yet.
                                    </p>
                                    <div className="features-closing-cta" style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                                        <a href="/#contact" className="btn-primary" style={{ textDecoration: "none" }}>
                                            Request Demo
                                        </a>
                                        <a href="/pricing" className="btn-secondary" style={{ textDecoration: "none" }}>
                                            See Plans
                                        </a>
                                    </div>
                                </div>

                                <div
                                    style={{
                                        padding: "28px",
                                        borderRadius: "20px",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        background: "linear-gradient(180deg, rgba(84,132,255,0.08), rgba(255,255,255,0.02))",
                                    }}
                                >
                                    <div style={{ color: "var(--text-tertiary)", fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "12px", fontWeight: 600 }}>
                                        Why this design
                                    </div>
                                    <div style={{ display: "grid", gap: "14px" }}>
                                        {[
                                            "Site, resident, and team context built into the feature structure",
                                            "Clear operational scope from beginning to enterprise",
                                            "Transparent about dependency trees and multi-gate capability",
                                            "Better buying context for property, estate, and ops teams",
                                        ].map((item) => (
                                            <div key={item} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                                                <svg
                                                    width="16"
                                                    height="16"
                                                    viewBox="0 0 16 16"
                                                    fill="none"
                                                    style={{
                                                        marginTop: "2px",
                                                        flexShrink: 0,
                                                        color: "rgb(84,132,255)",
                                                    }}
                                                >
                                                    <path
                                                        d="M13.5 4.5L6 12l-3.5-3.5"
                                                        stroke="currentColor"
                                                        strokeWidth="1.5"
                                                        strokeLinecap="round"
                                                        strokeLinejoin="round"
                                                    />
                                                </svg>
                                                <span style={{ color: "var(--text-secondary)", fontSize: "0.93rem", lineHeight: 1.65 }}>
                                                    {item}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </>
    );
}