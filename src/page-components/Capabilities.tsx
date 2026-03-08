import { motion } from "framer-motion";
import { GateEventIllustration } from "@/page-components/illustrations/GateEventIllustration";

export function Capabilities() {
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
    <section id="platform" className="section">
      <div className="container">
        <motion.div
          className="capabilities-header"
          style={{ textAlign: "center", marginBottom: "80px" }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <span className="section-label">Built around how communities actually run</span>
          <h2 className="section-headline" style={{ margin: "0 auto" }}>
            One platform. No more app-switching.
          </h2>
          <p className="section-desc" style={{ margin: "24px auto 0 auto" }}>
            Most communities are managing gates in one tool, visitors in another,
            residents in a third, and dues in a spreadsheet. VMS Core is the single
            system that replaces all of them.
          </p>
        </motion.div>

        <motion.div
          className="bento-grid"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          <motion.div
            variants={itemVariants}
            className="bento-card capabilities-hero-card"
            style={{ gridColumn: "span 12" }}
          >
            <div className="capabilities-hero-inner">
            <div className="capabilities-hero-text">
            <div className="icon-box accent">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                role="img"
              >
                <title>Identity Management Icon</title>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h3
              className="font-display"
              style={{
                fontSize: "1.5rem",
                marginBottom: "12px",
                color: "var(--text-primary)",
              }}
            >
              No more “who approved this?” moments
            </h3>
            <p
              style={{
                color: "var(--text-secondary)",
                marginBottom: "32px",
                maxWidth: "600px",
              }}
            >
              Remember the last time a visitor stood at your gate while your team
              scrambled through WhatsApp to find the approval? That’s over. Visitor
              passes, gate events, visit requests, and resident coordination live in
              one auditable system your whole team can see in real time.
            </p>
            </div>
            <div className="capabilities-hero-illustration">
              <GateEventIllustration />
            </div>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bento-card"
            style={{ gridColumn: "span 4" }}
          >
            <div className="icon-box">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                role="img"
              >
                <title>Tenant Isolation Icon</title>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h3
              className="font-display"
              style={{ fontSize: "1.25rem", marginBottom: "8px" }}
            >
              See every gate, every property, from one login
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              Stop logging into five different dashboards for five different sites.
              Portfolio managers get one view across all properties, residency groups,
              and gate dependency trees — with the ability to drill in wherever something
              needs attention.
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bento-card"
            style={{ gridColumn: "span 4" }}
          >
            <div className="icon-box">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                role="img"
              >
                <title>Integration Governance Icon</title>
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
            </div>
            <h3
              className="font-display"
              style={{ fontSize: "1.25rem", marginBottom: "8px" }}
            >
              Residents handle their own guests. Staff handle less.
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              No more calls asking “what’s the gate code?” Residents invite guests
              directly, track visit requests, view dues, and post to the community
              forum — without contacting the front desk for every interaction.
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bento-card"
            style={{ gridColumn: "span 4" }}
          >
            <div className="icon-box">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                role="img"
              >
                <title>Compliance Control Icon</title>
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h3
              className="font-display"
              style={{ fontSize: "1.25rem", marginBottom: "8px" }}
            >
              Admin control for the whole operation, not just the gate
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              Branding, billing, plugins, role permissions, and operational settings
              managed from one back-office layer — so your team isn’t stitching three
              different tools together to run a single community.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
