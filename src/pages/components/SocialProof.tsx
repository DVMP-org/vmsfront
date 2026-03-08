import { motion } from "framer-motion";

export function SocialProof() {
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
    <section className="section" style={{ background: "var(--bg-card)" }}>
      <div className="container">
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
            style={{
              gridColumn: "span 4",
              border: "none",
              background: "var(--bg-base)",
              padding: "40px",
            }}
          >
            <p
              style={{
                color: "var(--text-primary)",
                fontSize: "1.1rem",
                marginBottom: "32px",
                fontStyle: "italic",
              }}
            >
              "VMS Core allowed us to consolidate six different access products
              into one unified policy engine. It fundamentally changed our
              posture."
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginTop: "auto",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "var(--border-strong)",
                }}
              ></div>
              <div>
                <p style={{ fontWeight: 600, margin: 0, fontSize: "0.9rem" }}>
                  Sarah Jenkins
                </p>
                <p
                  style={{
                    color: "var(--text-secondary)",
                    margin: 0,
                    fontSize: "0.8rem",
                  }}
                >
                  CISO, Global Financial
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bento-card"
            style={{
              gridColumn: "span 4",
              border: "none",
              background: "var(--bg-base)",
              padding: "40px",
            }}
          >
            <p
              style={{
                color: "var(--text-primary)",
                fontSize: "1.1rem",
                marginBottom: "32px",
                fontStyle: "italic",
              }}
            >
              "We required an access layer that could be deployed entirely
              on-premise without losing modern integration. This delivered."
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginTop: "auto",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "var(--border-strong)",
                }}
              ></div>
              <div>
                <p style={{ fontWeight: 600, margin: 0, fontSize: "0.9rem" }}>
                  David Chen
                </p>
                <p
                  style={{
                    color: "var(--text-secondary)",
                    margin: 0,
                    fontSize: "0.8rem",
                  }}
                >
                  VP Infra, National Health
                </p>
              </div>
            </div>
          </motion.div>

          <motion.div
            variants={itemVariants}
            className="bento-card"
            style={{
              gridColumn: "span 4",
              border: "none",
              background: "var(--bg-base)",
              padding: "40px",
            }}
          >
            <p
              style={{
                color: "var(--text-primary)",
                fontSize: "1.1rem",
                marginBottom: "32px",
                fontStyle: "italic",
              }}
            >
              "The ability to govern integrations server-side means our identity
              data never leaves the compliance boundary."
            </p>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "16px",
                marginTop: "auto",
              }}
            >
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  background: "var(--border-strong)",
                }}
              ></div>
              <div>
                <p style={{ fontWeight: 600, margin: 0, fontSize: "0.9rem" }}>
                  Elena Rodriguez
                </p>
                <p
                  style={{
                    color: "var(--text-secondary)",
                    margin: 0,
                    fontSize: "0.8rem",
                  }}
                >
                  IT Director, Nexus Logistics
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
