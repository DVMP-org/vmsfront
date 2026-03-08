import { motion } from "framer-motion";

export function IdentityWorkflow() {
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
        <motion.div
          style={{ textAlign: "center", marginBottom: "80px" }}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
        >
          <span className="section-label">Identity Workflow</span>
          <h2 className="section-headline" style={{ margin: "0 auto" }}>
            Guide visitors, residents, and gate teams
            <br />
            through the same system.
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
            style={{ gridColumn: "span 8", minHeight: "360px" }}
          >
            <h3
              className="font-display"
              style={{ fontSize: "1.5rem", marginBottom: "12px" }}
            >
              Visit requests and pass creation
            </h3>
            <p style={{ color: "var(--text-secondary)", maxWidth: "400px" }}>
              Let residents or staff create guest access ahead of arrival so names,
              purpose, timing, and approvals are already organized before anyone reaches the gate.
            </p>
            <div style={{ marginTop: "auto", display: "flex", gap: "16px" }}>
              <motion.div
                initial={{ height: 0 }}
                whileInView={{ height: "120px" }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
                style={{
                  flex: 1,
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 100%)",
                  borderRadius: "12px",
                  border: "1px solid var(--border-light)",
                }}
              ></motion.div>
              <motion.div
                initial={{ height: 0 }}
                whileInView={{ height: "140px" }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.4 }}
                style={{
                  flex: 1,
                  background:
                    "linear-gradient(180deg, rgba(59, 130, 246, 0.1) 0%, transparent 100%)",
                  borderRadius: "12px",
                  border: "1px solid rgba(59, 130, 246, 0.3)",
                }}
              ></motion.div>
              <motion.div
                initial={{ height: 0 }}
                whileInView={{ height: "100px" }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.6 }}
                style={{
                  flex: 1,
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 100%)",
                  borderRadius: "12px",
                  border: "1px solid var(--border-light)",
                }}
              ></motion.div>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bento-card"
            style={{ gridColumn: "span 4" }}
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
                <title>QR Verification Icon</title>
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <h3
              className="font-display"
              style={{ fontSize: "1.25rem", marginBottom: "12px" }}
            >
              QR-based gate verification
            </h3>
            <p style={{ color: "var(--text-secondary)" }}>
              Verify passes quickly with codes and QR scanning so check-ins and check-outs
              are captured cleanly at the point of entry.
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bento-card"
            style={{ gridColumn: "span 6" }}
          >
            <h3
              className="font-display"
              style={{ fontSize: "1.25rem", marginBottom: "12px" }}
            >
              Community forum and resident updates
            </h3>
            <p style={{ color: "var(--text-secondary)" }}>
              Keep announcements, questions, and daily coordination inside the platform
              instead of scattering them across chats and manual follow-ups.
            </p>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bento-card"
            style={{ gridColumn: "span 6" }}
          >
            <h3
              className="font-display"
              style={{ fontSize: "1.25rem", marginBottom: "12px" }}
            >
              Dues and resident self-service
            </h3>
            <p style={{ color: "var(--text-secondary)" }}>
              Give residents a clearer way to track dues, access wallet actions,
              and manage recurring estate interactions without extra admin effort.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
