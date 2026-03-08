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
              “We used to manage gate approvals over WhatsApp. Now everything is
              in one place and I can see exactly who approved what, and when. It’s
              the first system our team actually uses consistently.”
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
                  Marcus D.
                </p>
                <p
                  style={{
                    color: "var(--text-secondary)",
                    margin: 0,
                    fontSize: "0.8rem",
                  }}
                >
                  HOA Board Chair, Riverside Estates
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
              “Our residents love it. No more ‘what’s the code?’ texts. No more
              keys left under the mat for the cleaner. Guests get a pass, staff
              see the audit trail, and I can check the gate log from my phone.”
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
                  Priya N.
                </p>
                <p
                  style={{
                    color: "var(--text-secondary)",
                    margin: 0,
                    fontSize: "0.8rem",
                  }}
                >
                  Property Manager, Oakview Apartments
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
              “From a security standpoint, we love it. There’s no gate code that
              half the city has memorized. We finally have real control over who
              enters — and a record we can actually reference when something
              goes wrong.”
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
                  Tanya F.
                </p>
                <p
                  style={{
                    color: "var(--text-secondary)",
                    margin: 0,
                    fontSize: "0.8rem",
                  }}
                >
                  Operations Director, Greenfield Residences
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
