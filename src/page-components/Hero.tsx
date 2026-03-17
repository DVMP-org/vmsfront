import Link from "next/link";
import { Fragment, useCallback, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { CommunityDashboardIllustration } from "./illustrations/CommunityDashboardIllustration";
import { useTheme } from "@/lib/theme_context";

export function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const { theme } = useTheme();
  const isLight = theme === "light";

  const onMouseMove = useCallback((e: MouseEvent) => {
    const el = heroRef.current;
    if (!el) return;
    const { left, top } = el.getBoundingClientRect();
    const x = e.clientX - left;
    const y = e.clientY - top;
    el.style.setProperty("--mouse-x", `${x}px`);
    el.style.setProperty("--mouse-y", `${y}px`);
  }, []);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    el.addEventListener("mousemove", onMouseMove);
    return () => el.removeEventListener("mousemove", onMouseMove);
  }, [onMouseMove]);
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  const activities = [
    ["Visit request submitted", "Residents and staff can review the next action without back-and-forth"],
    ["Due reminder posted", "Operations keeps payments and follow-up in one shared system"],
    ["Gate team monitoring live", "Leadership sees access, arrivals, and site activity across properties"],
  ];

  const navigationItems = ["Admin Dashboard", "Visitor Queue", "Gate Control", "Access Audit", "Resident Requests", "Announcements"];

  const queue = [
    ["A. Johnson", "Delivery guest", "Approved"],
    ["Greenfield Vendor", "Maintenance team", "Pending"],
    ["Resident Family", "Personal visit", "Scheduled"],
  ];

  return (
    <section
      ref={heroRef}
      className="section hero-section"
      style={{
        paddingTop: "154px",
        paddingBottom: "96px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Mouse-following spotlight */}
      <div className="hero-spotlight" />

      {/* Ambient floating glow blobs */}
      <div
        className="glow-blob blue"
        style={{ width: "700px", height: "700px", top: "-200px", left: "-180px", opacity: 0.8 }}
      />
      <div
        className="glow-blob violet"
        style={{ width: "600px", height: "600px", top: "0", right: "-150px", opacity: 0.7 }}
      />
      <div
        className="glow-blob cyan"
        style={{ width: "400px", height: "400px", bottom: "60px", left: "50%", opacity: 0.5 }}
      />
      <motion.div
        className="container"
        style={{ position: "relative", zIndex: 10 }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="hero-layout" style={{ gap: "30px" }}>
          <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <motion.div
              variants={itemVariants}
              className="hero-badge"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
                padding: "7px 14px",
                background: "linear-gradient(135deg, rgba(84,132,255,0.1), rgba(155,124,255,0.07))",
                border: "1px solid rgba(124,169,255,0.22)",
                borderRadius: "999px",
                marginBottom: "28px",
                fontSize: "0.84rem",
                color: "var(--text-secondary)",
                boxShadow: "0 0 24px -8px rgba(84,132,255,0.3), inset 0 1px 0 rgba(255,255,255,0.06)",
              }}
            >
              <span className="blink-dot blue" />
              Built for community administrators — HOAs, gated communities, apartments &amp; managed properties
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="section-headline animated-gradient-text"
              style={{
                maxWidth: "760px",
                margin: "0 0 18px 0",
                textAlign: "center",
                fontSize: "clamp(2.4rem, 5vw, 4.2rem)",
                lineHeight: 1.0,
              }}
            >
              Stop improvising.
              <br />
              Start operating.
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="section-desc"
              style={{
                margin: "0 0 24px 0",
                maxWidth: "560px",
                textAlign: "center",
                fontSize: "1.04rem",
              }}
            >
              One platform that replaces the group chats, gate codes, and notebooks
              your team still relies on.
            </motion.p>

            <motion.div
              variants={itemVariants}
              style={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: "8px",
                marginBottom: "24px",
              }}
            >
              {([
                ["Visitor approvals", "blue"],
                ["Gate access & audits", "violet"],
                ["Resident self-service", "cyan"],
                ["Visit requests", "blue"],
                ["Dues & wallet", "green"],
                ["Community forum", "violet"],
              ] as [string, string][]).map(([item, color]) => (
                <span key={item} className={`feature-pill ${color}`}>
                  {item}
                </span>
              ))}
            </motion.div>

            <motion.div
              variants={itemVariants}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "14px", flexWrap: "wrap", marginBottom: "22px" }}
            >

              <Link href="/#platform" className="btn-secondary" style={{ padding: "15px 28px", fontSize: "0.98rem", textDecoration: "none" }}>
                Explore Platform
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 36, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.35 }}
            style={{ width: "100%", display: "flex", justifyContent: "center" }}
          >
            <div style={{ width: "100%", maxWidth: "920px", display: "flex", flexDirection: "column", alignItems: "center", gap: "18px" }}>


              <div
                style={{
                  width: "100%",
                  maxWidth: "920px",
                  borderRadius: "32px",
                  padding: "14px",
                  background: isLight
                    ? "linear-gradient(180deg, rgba(15,23,42,0.07), rgba(15,23,42,0.03))"
                    : "linear-gradient(180deg, rgba(255,255,255,0.065), rgba(255,255,255,0.025))",
                  border: isLight
                    ? "1px solid rgba(15,23,42,0.12)"
                    : "1px solid rgba(255,255,255,0.12)",
                  boxShadow: isLight
                    ? "0 24px 80px -40px rgba(67,97,244,0.18), 0 4px 24px -8px rgba(15,23,42,0.1)"
                    : "0 48px 120px -70px rgba(0, 0, 0, 1)",
                }}
              >
                <div
                  style={{
                    height: "18px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      width: "56px",
                      height: "6px",
                      borderRadius: "999px",
                      background: isLight ? "rgba(15,23,42,0.14)" : "rgba(255, 255, 255, 0.18)",
                    }}
                  ></span>
                </div>

                <div className="card hero-illustration-card" style={{ padding: "0", borderRadius: "24px", background: "#080810", overflow: "hidden" }}>
                  <CommunityDashboardIllustration />
                </div>  
              </div>

              <div
                aria-hidden="true"
                style={{
                  width: "140px",
                  height: "24px",
                  marginTop: "-2px",
                  background: isLight
                    ? "linear-gradient(180deg, rgba(15,23,42,0.1), rgba(15,23,42,0.04))"
                    : "linear-gradient(180deg, rgba(255,255,255,0.16), rgba(110,110,110,0.08))",
                  borderLeft: isLight ? "1px solid rgba(15,23,42,0.08)" : "1px solid rgba(255,255,255,0.1)",
                  borderRight: isLight ? "1px solid rgba(15,23,42,0.08)" : "1px solid rgba(255,255,255,0.1)",
                  borderBottomLeftRadius: "18px",
                  borderBottomRightRadius: "18px",
                }}
              ></div>
              <div
                aria-hidden="true"
                style={{
                  width: "240px",
                  height: "18px",
                  borderRadius: "999px",
                  background: isLight
                    ? "linear-gradient(180deg, rgba(15,23,42,0.09), rgba(15,23,42,0.03))"
                    : "linear-gradient(180deg, rgba(255,255,255,0.14), rgba(110,110,110,0.08))",
                  boxShadow: isLight
                    ? "0 16px 40px -16px rgba(67,97,244,0.15)"
                    : "0 26px 60px -26px rgba(0, 0, 0, 0.9)",
                }}
              ></div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}
