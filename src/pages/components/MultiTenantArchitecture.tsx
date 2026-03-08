import { motion } from "framer-motion";

export function MultiTenantArchitecture() {
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
    <section className="section">
      <div className="container">
        <motion.div
          style={{ textAlign: "center", marginBottom: "80px" }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <span className="section-label">Organizations &amp; Residencies</span>
          <h2 className="section-headline" style={{ margin: "0 auto" }}>
            Built for one property or many.
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
            style={{ gridColumn: "span 6" }}
          >
            <div
              className="card-glow-wrapper"
              style={{
                padding: "0",
                background: "transparent",
                marginBottom: "32px",
              }}
            >
              <div
                style={{
                  height: "240px",
                  background: "var(--bg-base)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: 0,
                    bottom: 0,
                    left: "50%",
                    width: "1px",
                    background: "var(--border-strong)",
                  }}
                ></div>
                <div style={{ display: "flex", gap: "64px", zIndex: 10 }}>
                  <div
                    style={{
                      background: "var(--bg-card)",
                      padding: "16px",
                      border: "1px solid var(--accent-primary)",
                      borderRadius: "12px",
                      boxShadow: "0 4px 20px rgba(59, 130, 246, 0.2)",
                    }}
                  >
                    Maple Grove
                  </div>
                  <div
                    style={{
                      background: "var(--bg-card)",
                      padding: "16px",
                      border: "1px solid var(--border-strong)",
                      borderRadius: "12px",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
                    }}
                  >
                    Cedar Heights
                  </div>
                </div>
              </div>
            </div>
            <h3
              className="font-display"
              style={{ fontSize: "1.5rem", marginBottom: "12px" }}
            >
              Organization-wide visibility with local gate logic
            </h3>
            <p style={{ color: "var(--text-secondary)" }}>
              Manage organizations, residencies, residency groups, residents, visitors,
              and gate activity from a shared control layer while still keeping each property operationally distinct.
              Create multiple gates and define which checkpoints depend on others so real movement paths are reflected in the system.
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bento-card"
            style={{ gridColumn: "span 6" }}
          >
            <div
              className="card-glow-wrapper"
              style={{
                padding: "0",
                background: "transparent",
                marginBottom: "32px",
              }}
            >
              <div
                style={{
                  height: "240px",
                  background: "var(--bg-base)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: "120px",
                    height: "120px",
                    border: "2px solid var(--border-light)",
                    borderRadius: "50%",
                    position: "absolute",
                    left: "20%",
                  }}
                ></div>
                <div
                  style={{
                    width: "120px",
                    height: "120px",
                    border: "2px solid var(--border-light)",
                    borderRadius: "50%",
                    position: "absolute",
                    right: "20%",
                  }}
                ></div>
                <div
                  style={{
                    background: "var(--bg-card)",
                    padding: "12px 24px",
                    border: "1px solid var(--accent-primary)",
                    borderRadius: "100px",
                    zIndex: 10,
                    color: "var(--accent-primary)",
                    fontSize: "0.875rem",
                  }}
                >
                  Scoped access
                </div>
              </div>
            </div>
            <h3
              className="font-display"
              style={{ fontSize: "1.5rem", marginBottom: "12px" }}
            >
              Tree-based gate dependency mapping
            </h3>
            <p style={{ color: "var(--text-secondary)" }}>
              Model main entrances, inner checkpoints, and dependent gates as a visual tree.
              Teams can review the map, understand downstream access points, and trace visitor movement against the configured path.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
