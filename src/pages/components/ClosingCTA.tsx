import { motion } from "framer-motion";

export function ClosingCTA() {
  return (
    <section
      className="section"
      style={{ textAlign: "center", position: "relative", overflow: "hidden" }}
    >
      <div
        className="bg-glow"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          opacity: 0.5,
        }}
      ></div>
      <motion.div
        className="container"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        style={{ position: "relative", zIndex: 10 }}
      >
        <h2 className="section-headline" style={{ margin: "0 auto 32px auto" }}>
          Making the switch is easier than you think.
        </h2>
        <p
          className="section-desc"
          style={{ margin: "0 auto 32px auto", maxWidth: "760px" }}
        >
          Most properties are up and running within a day. No ripping out existing
          infrastructure — just a cleaner process your gate team, admin, and residents
          will immediately prefer over whatever you’re doing now.
        </p>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            marginBottom: "48px",
          }}
        >
          <button
            className="btn-primary"
            style={{ padding: "14px 28px", fontSize: "1rem" }}
          >
            REQUEST A DEMO
          </button>
          <button
            className="btn-secondary"
            style={{ padding: "14px 28px", fontSize: "1rem" }}
          >
            See the Platform
          </button>
        </div>
        <p style={{ color: "var(--text-tertiary)", fontSize: "0.9rem" }}>
          HOAs · Gated communities · Apartment buildings · Managed properties
        </p>
      </motion.div>
    </section>
  );
}
