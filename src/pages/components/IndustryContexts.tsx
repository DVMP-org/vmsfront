import { motion } from "framer-motion";

export function IndustryContexts() {
  return (
    <section
      className="section"
      style={{ position: "relative", overflow: "hidden" }}
    >
      <div
        className="bg-glow"
        style={{
          top: "50%",
          left: "0",
          transform: "translateY(-50%)",
          opacity: 0.5,
        }}
      ></div>
      <div className="container">
        <motion.div
          className="card"
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{
            padding: "64px",
            textAlign: "center",
            background:
              "linear-gradient(180deg, var(--bg-card) 0%, rgba(24, 24, 27, 0.5) 100%)",
            border: "1px solid var(--border-strong)",
          }}
        >
          <span className="section-label">Verticals</span>
          <h2
            className="section-headline"
            style={{ margin: "24px auto", maxWidth: "800px" }}
          >
            Engineered to secure the world's most critical workplaces.
          </h2>
          <p
            className="section-desc"
            style={{ margin: "0 auto", maxWidth: "600px" }}
          >
            From heavily regulated data centers to distributed healthcare
            networks, our solutions map directly to complex industry
            requirements.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
