import { motion } from "framer-motion";

export function ComplianceAndAudit() {
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
      transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
    },
  };

  return (
    <section className="section">
      <div className="container">
        <motion.span
          className="section-label"
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          Audit &middot; Compliance
        </motion.span>
        <motion.div
          className="bento-grid"
          style={{ marginTop: "48px" }}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          <motion.div
            variants={itemVariants}
            className="bento-card"
            style={{ gridColumn: "span 4" }}
          >
            <div className="icon-box">
              <span
                className="font-display"
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                }}
              >
                A.
              </span>
            </div>
            <h3
              className="font-display"
              style={{ fontSize: "1.25rem", marginBottom: "12px" }}
            >
              Audit-Ready Digital Records
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              Maintain detailed, immutable visitor records automatically.
              Generate compliance documentation without manual intervention.
            </p>
          </motion.div>
          <motion.div
            variants={itemVariants}
            className="bento-card"
            style={{ gridColumn: "span 4" }}
          >
            <div className="icon-box accent">
              <span
                className="font-display"
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  color: "var(--accent-primary)",
                }}
              >
                B.
              </span>
            </div>
            <h3
              className="font-display"
              style={{ fontSize: "1.25rem", marginBottom: "12px" }}
            >
              Real-Time Occupancy Analytics
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              Surface critical insights instantly. Track comprehensive visitor
              data, generate capacity forecasts, and automatically share
              scheduled reports.
            </p>
          </motion.div>
          <motion.div
            variants={itemVariants}
            className="bento-card"
            style={{ gridColumn: "span 4" }}
          >
            <div className="icon-box">
              <span
                className="font-display"
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                }}
              >
                C.
              </span>
            </div>
            <h3
              className="font-display"
              style={{ fontSize: "1.25rem", marginBottom: "12px" }}
            >
              Expedited Emergency Response
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              See exactly who is onsite during a crisis. Broadcast urgent alerts
              instantly and let employees confirm their safety via SMS or email.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
