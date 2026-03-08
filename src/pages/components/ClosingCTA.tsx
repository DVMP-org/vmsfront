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
          Make the platform choice that feels right in the boardroom
          <br />
          and obvious in everyday use.
        </h2>
        <p
          className="section-desc"
          style={{ margin: "0 auto 32px auto", maxWidth: "760px" }}
        >
          If you are buying for a portfolio, site, estate, or community, VMS
          Core helps you present a more professional operation while keeping the
          experience simple for the people who use it every day.
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
            Talk to Sales
          </button>
          <button
            className="btn-secondary"
            style={{ padding: "14px 28px", fontSize: "1rem" }}
          >
            See the Product
          </button>
        </div>
        <p style={{ color: "var(--text-tertiary)", fontSize: "0.9rem" }}>
          Executive walkthroughs &middot; Guided rollout &middot; Everyday-user
          friendly experience
        </p>
      </motion.div>
    </section>
  );
}
