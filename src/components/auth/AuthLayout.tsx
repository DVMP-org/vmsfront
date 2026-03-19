"use client";

import { motion } from "framer-motion";
import { ReactNode } from "react";
import Image from "next/image";
import { ArrowLeft, Shield, Users, Zap, Moon, Sun } from "lucide-react";
import NextLink from "next/link";
import { useTheme } from "@/lib/theme_context";
import { VisitorFlowIllustration } from "@/page-components/illustrations/VisitorFlowIllustration";
const appName = process.env.NEXT_PUBLIC_APP_NAME;
/* Floating glass bubble definitions for the left panel */
const BUBBLES = [
    { size: 88, top: "8%", left: "72%", delay: 0, duration: 7, color: "rgba(84,132,255,0.13)", border: "rgba(84,132,255,0.28)", borderRadius: "26px", yRange: [-22, 0, -10, 0], rotRange: [0, 6, -3, 0] },
    { size: 52, top: "22%", left: "12%", delay: 1.4, duration: 9, color: "rgba(155,124,255,0.11)", border: "rgba(155,124,255,0.24)", borderRadius: "50%", yRange: [0, 28, 10, 0], rotRange: [0, -8, 3, 0] },
    { size: 36, top: "60%", left: "80%", delay: 0.7, duration: 6, color: "rgba(72,216,200,0.09)", border: "rgba(72,216,200,0.22)", borderRadius: "12px", yRange: [-14, 0, -20, 0], rotRange: [0, 4, -6, 0] },
    { size: 64, top: "74%", left: "8%", delay: 2, duration: 11, color: "rgba(84,132,255,0.08)", border: "rgba(84,132,255,0.18)", borderRadius: "50%", yRange: [0, -18, 8, 0], rotRange: [0, -5, 2, 0] },
    { size: 28, top: "42%", left: "88%", delay: 0.3, duration: 8, color: "rgba(155,124,255,0.1)", border: "rgba(155,124,255,0.2)", borderRadius: "8px", yRange: [-10, 0, -24, 0], rotRange: [0, 10, -4, 0] },
    { size: 20, top: "86%", left: "60%", delay: 1.8, duration: 7, color: "rgba(72,216,200,0.13)", border: "rgba(72,216,200,0.28)", borderRadius: "6px", yRange: [0, 16, -8, 0], rotRange: [0, -6, 4, 0] },
    { size: 44, top: "16%", left: "42%", delay: 2.6, duration: 10, color: "rgba(84,132,255,0.07)", border: "rgba(124,169,255,0.15)", borderRadius: "50%", yRange: [-18, 6, 0, -18], rotRange: [0, 3, -5, 0] },
] as const;

interface AuthLayoutProps {
    children: ReactNode;
    title: string;
    description: string;
}

const FEATURES = [
    {
        icon: Shield,
        title: "Zero-trust access control",
        desc: "Every gate event is logged, signed, and auditable in real time.",
        color: "rgba(84,132,255,0.9)",
        glow: "rgba(84,132,255,0.14)",
        border: "rgba(84,132,255,0.22)",
        iconBg: "rgba(84,132,255,0.12)",
    },
    {
        icon: Users,
        title: "Multi-property management",
        desc: "Residents, guests, and staff — unified across all your properties.",
        color: "rgba(155,124,255,0.9)",
        glow: "rgba(155,124,255,0.12)",
        border: "rgba(155,124,255,0.2)",
        iconBg: "rgba(155,124,255,0.1)",
    },
    {
        icon: Zap,
        title: "Real-time gate monitoring",
        desc: "Live access logs, QR verification, and instant approvals.",
        color: "rgba(72,216,200,0.9)",
        glow: "rgba(72,216,200,0.1)",
        border: "rgba(72,216,200,0.18)",
        iconBg: "rgba(72,216,200,0.08)",
    },
] as const;

export function AuthLayout({ children, title, description }: AuthLayoutProps) {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === "dark";

    // Theme-aware colors
    const bgColor = isDark ? "#000000" : "#f8fafc";
    const panelBorder = isDark ? "rgba(148,163,184,0.07)" : "rgba(148,163,184,0.15)";
    const cardBg = isDark ? "rgba(255,255,255,0.025)" : "rgba(255,255,255,0.8)";
    const cardBorder = isDark ? "rgba(148,163,184,0.08)" : "rgba(148,163,184,0.2)";
    const textPrimary = isDark ? "rgba(255,255,255,0.95)" : "rgba(15,23,42,0.95)";
    const textSecondary = isDark ? "rgba(148,163,184,0.75)" : "rgba(100,116,139,0.85)";
    const gridColor = isDark ? "rgba(84,132,255,0.03)" : "rgba(84,132,255,0.06)";
    const featureCardBg = isDark ? "rgba(9,9,10,0.72)" : "rgba(255,255,255,0.85)";
    const featureCardTitle = isDark ? "#f5f8fc" : "#0f172a";
    const featureCardDesc = isDark ? "rgba(165,178,199,0.65)" : "rgba(71,85,105,0.85)";

    return (
        /* Theme is now managed on document.documentElement by theme_context */
        <div style={{ minHeight: "100vh", display: "flex", background: bgColor, overflow: "hidden" }}>

            {/* ── Left decorative panel ─────────────────────────── */}
            <div
                className="hidden md:flex"
                style={{
                    width: "50%",
                    maxWidth: "50%",
                    flexDirection: "column",
                    justifyContent: "center",
                    padding: "50px 40px",
                    position: "relative",
                    overflow: "hidden",
                    background: bgColor,
                    borderRight: `1px solid ${panelBorder}`,
                    flexShrink: 0,
                }}
            >
                {/* Grid lines */}
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        zIndex: 0,
                        backgroundImage:
                            `linear-gradient(${gridColor} 1px, transparent 1px), linear-gradient(90deg, ${gridColor} 1px, transparent 1px)`,
                        backgroundSize: "64px 64px",
                        maskImage: "linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 60%, transparent 100%)",
                    }}
                />

                {/* Glow blobs */}
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        top: "-180px",
                        left: "-80px",
                        width: "520px",
                        height: "520px",
                        background: isDark
                            ? "radial-gradient(circle, rgba(84,132,255,0.2) 0%, transparent 70%)"
                            : "radial-gradient(circle, rgba(84,132,255,0.12) 0%, transparent 70%)",
                        borderRadius: "50%",
                        filter: "blur(50px)",
                        pointerEvents: "none",
                        zIndex: 0,
                    }}
                />
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        bottom: "-80px",
                        right: "-60px",
                        width: "440px",
                        height: "440px",
                        background: isDark
                            ? "radial-gradient(circle, rgba(155,124,255,0.16) 0%, transparent 70%)"
                            : "radial-gradient(circle, rgba(155,124,255,0.1) 0%, transparent 70%)",
                        borderRadius: "50%",
                        filter: "blur(60px)",
                        pointerEvents: "none",
                        zIndex: 0,
                    }}
                />

                {/* Noise texture */}
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        inset: 0,
                        pointerEvents: "none",
                        zIndex: 1,
                        opacity: 0.022,
                        backgroundImage:
                            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")",
                        backgroundRepeat: "repeat",
                        backgroundSize: "200px 200px",
                    }}
                />

                {/* Floating glass bubbles */}
                {BUBBLES.map((b, i) => (
                    <motion.div
                        key={i}
                        aria-hidden="true"
                        animate={{ y: b.yRange as unknown as number[], rotate: b.rotRange as unknown as number[] }}
                        transition={{ duration: b.duration, delay: b.delay, repeat: Infinity, ease: "easeInOut" }}
                        style={{
                            position: "absolute",
                            top: b.top,
                            left: b.left,
                            width: b.size,
                            height: b.size,
                            borderRadius: b.borderRadius,
                            background: b.color,
                            border: `1px solid ${b.border}`,
                            backdropFilter: "blur(12px)",
                            WebkitBackdropFilter: "blur(12px)",
                            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.07), 0 0 18px -6px ${b.border}`,
                            pointerEvents: "none",
                            zIndex: 1,
                            willChange: "transform",
                        }}
                    />
                ))}

                <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, ease: "easeOut" }}
                    style={{ position: "relative", zIndex: 2 }}
                >
                    {/* Logo */}
                    <NextLink href="/" style={{ display: "inline-block", marginBottom: "52px" }}>
                        <Image
                            src={isDark ? "/gardvix-logo-dark.svg" : "/gardvix-logo-light.svg"}
                            alt="Gardvix"
                            width={152}
                            height={48}
                            priority
                        />
                    </NextLink>

                    {/* Platform badge */}
                    <div
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "5px 14px",
                            background: "linear-gradient(135deg, rgba(84,132,255,0.1), rgba(155,124,255,0.06))",
                            border: "1px solid rgba(124,169,255,0.22)",
                            borderRadius: "999px",
                            marginBottom: "22px",
                            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06), 0 0 20px -10px rgba(84,132,255,0.3)",
                        }}
                    >
                        <span
                            style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                background: "rgba(72,216,200,1)",
                                boxShadow: "0 0 8px rgba(72,216,200,0.7)",
                                flexShrink: 0,
                            }}
                        />
                        <span
                            style={{
                                fontSize: "0.65rem",
                                fontWeight: 600,
                                letterSpacing: "0.13em",
                                textTransform: "uppercase" as const,
                                color: "rgba(124,169,255,0.9)",
                            }}
                        >
                            Community Management Platform
                        </span>
                    </div>

                    {/* Headline */}
                    <h1
                        style={{
                            fontSize: "clamp(1.75rem, 3.2vw, 2.5rem)",
                            fontWeight: 800,
                            letterSpacing: "-0.04em",
                            lineHeight: 1.06,
                            marginBottom: "18px",

                        }}
                    >
                        Control every gate, every visit,
                        from one platform.
                    </h1>

                    <p
                        style={{
                            fontSize: "0.9rem",
                            lineHeight: 1.65,
                            letterSpacing: "-0.01em",
                            color: textSecondary,
                            marginBottom: "32px",
                            maxWidth: "400px",
                        }}
                    >
                        Replace scattered approvals, gate codes, and notebooks with one
                        clear, auditable system your whole team will use.
                    </p>

                    {/* Visitor flow illustration */}
                    <div style={{ marginBottom: "32px" }}>
                        <VisitorFlowIllustration />
                    </div>

                    {/* Feature cards */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {FEATURES.map(({ icon: Icon, title: feat, desc, color, glow, border, iconBg }) => (
                            <div
                                key={feat}
                                style={{
                                    display: "flex",
                                    alignItems: "flex-start",
                                    gap: "14px",
                                    padding: "14px 16px",
                                    background: featureCardBg,
                                    border: `1px solid ${border}`,
                                    borderRadius: "14px",
                                    backdropFilter: "blur(18px)",
                                    boxShadow: isDark
                                        ? `0 0 24px -10px ${glow}, inset 0 1px 0 rgba(255,255,255,0.04)`
                                        : `0 0 24px -10px ${glow}, 0 4px 12px -4px rgba(0,0,0,0.08)`,
                                }}
                            >
                                <div
                                    style={{
                                        flexShrink: 0,
                                        width: "34px",
                                        height: "34px",
                                        borderRadius: "9px",
                                        background: iconBg,
                                        border: `1px solid ${border}`,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <Icon size={15} style={{ color }} />
                                </div>
                                <div>
                                    <div
                                        style={{
                                            fontSize: "0.81rem",
                                            fontWeight: 600,
                                            color: featureCardTitle,
                                            marginBottom: "2px",
                                            letterSpacing: "-0.01em",
                                        }}
                                    >
                                        {feat}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: "0.75rem",
                                            color: featureCardDesc,
                                            lineHeight: 1.45,
                                        }}
                                    >
                                        {desc}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>

            {/* ── Right form panel ─────────────────────────────────── */}
            <div
                style={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: "40px 24px",
                    position: "relative",
                    background: isDark ? "#050505" : "#ffffff",
                    overflow: "hidden",
                }}
            >
                {/* Subtle right glow */}
                <div
                    aria-hidden="true"
                    style={{
                        position: "absolute",
                        top: "-10%",
                        right: "-15%",
                        width: "480px",
                        height: "480px",
                        background: isDark
                            ? "radial-gradient(circle, rgba(84,132,255,0.055) 0%, transparent 70%)"
                            : "radial-gradient(circle, rgba(84,132,255,0.08) 0%, transparent 70%)",
                        borderRadius: "50%",
                        filter: "blur(60px)",
                        pointerEvents: "none",
                    }}
                />

                {/* Mobile logo */}
                <div className="md:hidden" style={{ position: "absolute", top: "24px", left: "24px" }}>
                    <NextLink href="/">
                        <Image
                            src={isDark ? "/gardvix-logo-dark.svg" : "/gardvix-logo-light.svg"}
                            alt="Gardvix"
                            width={120}
                            height={38}
                            priority
                        />
                    </NextLink>
                </div>

                {/* Top right controls: Theme toggle + Back to site */}
                <div
                    style={{
                        position: "absolute",
                        top: "24px",
                        right: "24px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        zIndex: 10,
                    }}
                >
                    {/* Theme toggle button */}
                    <button
                        onClick={toggleTheme}
                        aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "36px",
                            height: "36px",
                            borderRadius: "10px",
                            border: `1px solid ${cardBorder}`,
                            background: cardBg,
                            backdropFilter: "blur(12px)",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            color: textSecondary,
                        }}
                    >
                        {isDark ? (
                            <Sun size={16} />
                        ) : (
                            <Moon size={16} />
                        )}
                    </button>

                    {/* Back to site */}
                    <NextLink
                        href="/"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            fontSize: "0.76rem",
                            fontWeight: 500,
                            color: textSecondary,
                            textDecoration: "none",
                            padding: "6px 12px",
                            borderRadius: "8px",
                            border: `1px solid ${cardBorder}`,
                            background: cardBg,
                            backdropFilter: "blur(12px)",
                            transition: "color 0.2s",
                        }}
                    >
                        <ArrowLeft size={12} />
                        Back to site
                    </NextLink>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    style={{ width: "100%", maxWidth: "420px", position: "relative", zIndex: 1, marginTop: "3rem" }}
                >
                    {/* Glass form card */}
                    <div
                        style={{
                            background: isDark ? "rgba(9,9,10,0.88)" : "rgba(255,255,255,0.95)",
                            border: `1px solid ${cardBorder}`,
                            borderRadius: "20px",
                            padding: "36px 32px 32px",
                            backdropFilter: "blur(24px)",
                            boxShadow: isDark
                                ? "0 32px 64px -24px rgba(0,0,0,0.95), inset 0 1px 0 rgba(255,255,255,0.04)"
                                : "0 32px 64px -24px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.8)",
                            position: "relative",
                            overflow: "hidden",
                        }}
                    >
                        {/* Top shimmer line */}
                        <div
                            aria-hidden="true"
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                height: "1px",
                                background:
                                    "linear-gradient(90deg, transparent, rgba(124,169,255,0.35), transparent)",
                                pointerEvents: "none",
                            }}
                        />

                        {/* Heading */}
                        <div style={{ marginBottom: "28px", }}>
                            <h2
                                style={{
                                    fontSize: "1.5rem",
                                    fontWeight: 800,
                                    letterSpacing: "-0.04em",
                                    lineHeight: 1.1,
                                    marginBottom: "7px",
                                }}
                                className="text-dark/70 dark:text-white/90"
                            >
                                {title}
                            </h2>
                            <p
                                style={{
                                    fontSize: "0.82rem",
                                    color: textSecondary,
                                    letterSpacing: "-0.01em",
                                    lineHeight: 1.5,
                                }}
                            >
                                {description}
                            </p>
                        </div>

                        {children}
                    </div>

                    <p
                        style={{
                            marginTop: "18px",
                            textAlign: "center",
                            fontSize: "0.7rem",
                            color: textSecondary,
                            letterSpacing: "0.01em",
                        }}
                    >
                        &copy; {new Date().getFullYear()} {appName}. All rights reserved.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}

