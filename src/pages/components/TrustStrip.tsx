import { motion } from "framer-motion";

export function TrustStrip() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  return (
    <section
      id="security"
      style={{
        padding: "64px 0",
        borderBottom: "1px solid var(--border-light)",
      }}
    >
      <motion.div
        className="container"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <motion.div
          variants={itemVariants}
          style={{
            padding: "8px 16px",
            background: "var(--bg-card)",
            borderRadius: "100px",
            border: "1px solid var(--border-strong)",
            fontSize: "0.875rem",
            color: "var(--text-secondary)",
          }}
        >
          SOC 2 Type II
        </motion.div>
        <motion.div
          variants={itemVariants}
          style={{
            padding: "8px 16px",
            background: "var(--bg-card)",
            borderRadius: "100px",
            border: "1px solid var(--border-strong)",
            fontSize: "0.875rem",
            color: "var(--text-secondary)",
          }}
        >
          ISO 27001
        </motion.div>
        <motion.div
          variants={itemVariants}
          style={{
            padding: "8px 16px",
            background: "var(--bg-card)",
            borderRadius: "100px",
            border: "1px solid var(--border-strong)",
            fontSize: "0.875rem",
            color: "var(--text-secondary)",
          }}
        >
          GDPR Compliant
        </motion.div>
        <motion.div
          variants={itemVariants}
          style={{
            padding: "8px 16px",
            background: "var(--bg-card)",
            borderRadius: "100px",
            border: "1px solid var(--border-strong)",
            fontSize: "0.875rem",
            color: "var(--text-secondary)",
          }}
        >
          HIPAA Ready
        </motion.div>
        <motion.div
          variants={itemVariants}
          style={{
            padding: "8px 16px",
            background: "var(--bg-card)",
            borderRadius: "100px",
            border: "1px solid var(--accent-primary)",
            fontSize: "0.875rem",
            color: "var(--accent-primary)",
          }}
        >
          Self-Hosted Available
        </motion.div>
      </motion.div>
    </section>
  );
}
