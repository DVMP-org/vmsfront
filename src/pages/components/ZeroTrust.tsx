import { motion } from "framer-motion";

export function ZeroTrust() {
    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 },
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

    return (
        <section className="section" style={{ position: "relative" }}>
            <div className="bg-glow" style={{ top: "0", left: "20%" }}></div>
            <div className="container">
                <motion.div
                    style={{ textAlign: "center", marginBottom: "80px" }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.6 }}
                >
                    <span className="section-label">Enterprise Shield</span>
                    <h2 className="section-headline" style={{ margin: "0 auto" }}>
                        Zero-Trust Architecture.
                    </h2>
                    <p className="section-desc" style={{ margin: "24px auto 0 auto", maxWidth: "700px" }}>
                        In an environment where a single physical breach compromises digital security,
                        assume nothing is safe. Every identity, every badge, and every door swing is
                        continuously cryptographically authenticated.
                    </p>
                </motion.div>

                <motion.div
                    className="bento-grid"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-50px" }}
                >
                    <motion.div variants={itemVariants} className="card" style={{ gridColumn: "span 6" }}>
                        <div className="icon-box accent">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"></path>
                            </svg>
                        </div>
                        <h3 className="font-display" style={{ fontSize: "1.25rem", marginBottom: "12px" }}>
                            Continuous Validation
                        </h3>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                            Authorization doesn't end at the front desk. Physical location telemetry is continuously mapped against active directory roles—suspicious lateral movement triggers instant credential revocation.
                        </p>
                    </motion.div>

                    <motion.div variants={itemVariants} className="card" style={{ gridColumn: "span 6" }}>
                        <div className="icon-box">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                            </svg>
                        </div>
                        <h3 className="font-display" style={{ fontSize: "1.25rem", marginBottom: "12px" }}>
                            Ephemeral Credentials
                        </h3>
                        <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                            Say goodbye to lost physical keys. Mobile credentials are cryptographically bound to specific devices, rotate hourly, and instantly expire the moment a contractor's shift concludes.
                        </p>
                    </motion.div>

                    <motion.div variants={itemVariants} className="card" style={{ gridColumn: "span 12", display: "flex", alignItems: "center", gap: "32px", flexWrap: "wrap" }}>
                        <div style={{ flex: 1, minWidth: "300px" }}>
                            <h3 className="font-display" style={{ fontSize: "1.5rem", marginBottom: "12px" }}>
                                Military-Grade Penetration Testing
                            </h3>
                            <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem", marginBottom: "0" }}>
                                Our application stack, physical access controllers, and mobile credential wallets undergo continuous, rigorous black-box penetration testing by independent Tier-1 security research firms. We publish our SOC2 Type II, ISO 27001, and penetration testing summaries directly in our Trust Center.
                            </p>
                        </div>
                        <div style={{ flex: "0 0 auto", display: "flex", gap: "16px" }}>
                            <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-light)", padding: "12px 24px", borderRadius: "100px", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>SOC2 Type II</div>
                            <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid var(--border-light)", padding: "12px 24px", borderRadius: "100px", fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>ISO 27001</div>
                        </div>
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
