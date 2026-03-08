import { motion } from "framer-motion";

export function PluginEcosystem() {
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
    <section
      className="section"
      style={{
        background: "var(--bg-card)",
        borderTop: "1px solid var(--border-light)",
        borderBottom: "1px solid var(--border-light)",
      }}
    >
      <div className="container">
        <motion.div
          className="plugin-ecosystem-header"
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: "64px",
          }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <div>
            <span className="section-label">Extensibility</span>
            <h2 className="section-headline" style={{ marginBottom: 0 }}>
              Extend the platform where it matters.
            </h2>
          </div>
          <p
            style={{
              color: "var(--text-secondary)",
              maxWidth: "400px",
              margin: 0,
            }}
          >
            Add the modules your team needs, activate them deliberately, and keep
            configuration inside the admin experience instead of spreading it across disconnected tools.
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
            className="card"
            style={{ gridColumn: "span 4", background: "var(--bg-base)" }}
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
                <title>Plugin Marketplace Icon</title>
                <path d="M14.5 4h5v5" />
                <polyline points="19.5 4 10 13.5" />
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              </svg>
            </div>
            <h3
              className="font-display"
              style={{ fontSize: "1.25rem", marginBottom: "12px" }}
            >
              Plugin marketplace
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              Browse, install, and review available plugins from a dedicated marketplace
              instead of treating every new workflow as a custom rebuild.
            </p>
          </motion.div>
          <motion.div
            variants={itemVariants}
            className="card"
            style={{ gridColumn: "span 4", background: "var(--bg-base)" }}
          >
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
                <title>Tailored Workflows Icon</title>
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <h3
              className="font-display"
              style={{ fontSize: "1.25rem", marginBottom: "12px" }}
            >
              Configurable workflows
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              Enable modules that match your operations, then adjust plugin settings so
              estate-specific processes can fit the way your teams already work.
            </p>
          </motion.div>
          <motion.div
            variants={itemVariants}
            className="card"
            style={{ gridColumn: "span 4", background: "var(--bg-base)" }}
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
                <title>Automated Governance Icon</title>
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <h3
              className="font-display"
              style={{ fontSize: "1.25rem", marginBottom: "12px" }}
            >
              Controlled activation and admin setup
            </h3>
            <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              Turn plugins on or off, manage configuration, and pair them with branding,
              payment, mailer, and integration settings from the admin side.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
