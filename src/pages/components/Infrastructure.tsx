import { motion } from "framer-motion";

export function Infrastructure() {
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
    <section id="deployment" className="section">
      <div className="container">
        <motion.div
          style={{ textAlign: "center", marginBottom: "80px" }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <span className="section-label">Deployment Modes</span>
          <h2 className="section-headline" style={{ margin: "0 auto" }}>
            Deploy anywhere.
          </h2>
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
            className="bento-card"
            style={{ gridColumn: "span 4" }}
          >
            <div
              style={{
                padding: "4px 12px",
                background: "rgba(255,255,255,0.05)",
                borderRadius: "100px",
                display: "inline-block",
                marginBottom: "24px",
                fontSize: "0.8rem",
                border: "1px solid var(--border-light)",
              }}
            >
              Turnkey
            </div>
            <h3
              className="font-display"
              style={{ fontSize: "1.5rem", marginBottom: "12px" }}
            >
              Cloud Hosted
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              Fully managed and instantly available. Perfect for organizations
              that want enterprise-grade security without the overhead of
              maintaining infrastructure.
            </p>
          </motion.div>
          <motion.div
            variants={itemVariants}
            className="bento-card"
            style={{
              gridColumn: "span 4",
              borderColor: "rgba(139, 92, 246, 0.4)",
              boxShadow: "0 0 40px rgba(139, 92, 246, 0.1)",
            }}
          >
            <div
              style={{
                padding: "4px 12px",
                background: "rgba(139, 92, 246, 0.1)",
                color: "var(--accent-secondary)",
                borderRadius: "100px",
                display: "inline-block",
                marginBottom: "24px",
                fontSize: "0.8rem",
                border: "1px solid rgba(139, 92, 246, 0.2)",
              }}
            >
              Dedicated
            </div>
            <h3
              className="font-display"
              style={{ fontSize: "1.5rem", marginBottom: "12px" }}
            >
              Private Cloud
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              Deployed securely within your own virtual environment. Maintain
              strict control over your data boundaries while enjoying a managed
              experience.
            </p>
          </motion.div>
          <motion.div
            variants={itemVariants}
            className="bento-card"
            style={{ gridColumn: "span 4" }}
          >
            <div
              style={{
                padding: "4px 12px",
                background: "rgba(255,255,255,0.05)",
                borderRadius: "100px",
                display: "inline-block",
                marginBottom: "24px",
                fontSize: "0.8rem",
                border: "1px solid var(--border-light)",
              }}
            >
              Air-gapped
            </div>
            <h3
              className="font-display"
              style={{ fontSize: "1.5rem", marginBottom: "12px" }}
            >
              On-Premise
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              Installed directly onto your physical servers. Designed for highly
              regulated industries, defense contractors, and environments requiring
              absolute physical control.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
