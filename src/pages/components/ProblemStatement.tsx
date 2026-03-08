export function ProblemStatement() {
  return (
    <section className="section problem-section scroll-reveal">
      <div className="container" style={{ position: "relative" }}>
        <div className="problem-shell">
          <div>
            <span className="section-label">Why both leaders and users switch</span>
            <p className="problem-copy font-serif">
              Most systems fail in two directions at once: executives never get
              the clean oversight they need, and ordinary users get a clunky,
              frustrating process that slows everyone down. The better answer is
              one system that feels credible in the boardroom and effortless in
              the lobby.
            </p>
          </div>

          <div className="problem-aside">
            <div
              style={{
                color: "var(--text-tertiary)",
                fontSize: "0.74rem",
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                marginBottom: "12px",
              }}
            >
              What buyers want
            </div>
            <div
              style={{
                color: "var(--text-primary)",
                fontWeight: 700,
                fontSize: "1.04rem",
                marginBottom: "8px",
              }}
            >
              Less risk. Better experience. Faster adoption.
            </div>
            <div
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.94rem",
                lineHeight: 1.7,
              }}
            >
              Decision-makers need operational confidence and measurable control.
              Everyday users need speed, clarity, and fewer steps. VMS Core is
              designed to deliver both.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
