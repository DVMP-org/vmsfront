import { motion } from "framer-motion";

export function Flow() {
  const steps = [
    {
      number: "01",
      title: "Invite before arrival",
      description:
        "Residents or staff send a visitor invitation ahead of time so names, purpose, and approvals are already in place before anyone reaches the gate.",
      accent: "var(--accent-primary)",
      summary: "Less scrambling at the front desk",
      bullets: ["Pre-approved guest details", "Clear host ownership", "Fewer manual calls"],
    },
    {
      number: "02",
      title: "Guide the check-in clearly",
      description:
        "When the visitor arrives, the team sees the exact next action: verify identity, confirm approval, notify the host, and move the visit forward quickly.",
      accent: "var(--accent-secondary)",
      summary: "A calmer arrival experience",
      bullets: ["Fast verification", "Simple operator workflow", "Host updates in real time"],
    },
    {
      number: "03",
      title: "Keep the visit visible",
      description:
        "Entry, status changes, and exit records stay captured in one place, giving operations and leadership a cleaner view of what happened and when.",
      accent: "var(--text-primary)",
      summary: "Complete record without extra effort",
      bullets: ["Entry and exit history", "Site-level visibility", "Cleaner reporting"],
    },
  ];

  return (
    <section className="section">
      <div className="container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          style={{ textAlign: "center", marginBottom: "56px" }}
        >
          <span className="section-label">Visitor Flow</span>
          <h2 className="section-headline" style={{ margin: "0 auto 16px auto", maxWidth: "720px" }}>
            A visitor journey people can follow without asking for help.
          </h2>
          <p className="section-desc" style={{ margin: "0 auto", maxWidth: "680px" }}>
            Instead of making visitors, residents, and staff guess the next step, the flow keeps
            every handoff simple, visible, and easy to manage from invitation to exit.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: "20px",
          }}
        >
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: index * 0.08 }}
              className="card"
              style={{
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "18px",
                minHeight: "100%",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px" }}>
                <div
                  style={{
                    width: "42px",
                    height: "42px",
                    borderRadius: "14px",
                    border: `1px solid ${step.accent}`,
                    color: step.accent,
                    background: "rgba(255,255,255,0.02)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    letterSpacing: "0.08em",
                  }}
                >
                  {step.number}
                </div>
                <span
                  style={{
                    padding: "7px 10px",
                    borderRadius: "999px",
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.06)",
                    color: "var(--text-secondary)",
                    fontSize: "0.76rem",
                  }}
                >
                  {step.summary}
                </span>
              </div>

              <div>
                <h3 className="font-display" style={{ fontSize: "1.12rem", marginBottom: "10px", color: "var(--text-primary)" }}>
                  {step.title}
                </h3>
                <p style={{ color: "var(--text-secondary)", margin: 0, lineHeight: 1.7, fontSize: "0.95rem" }}>
                  {step.description}
                </p>
              </div>

              <div
                style={{
                  borderRadius: "18px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.02)",
                  padding: "16px",
                  display: "grid",
                  gap: "10px",
                }}
              >
                {step.bullets.map((bullet) => (
                  <div key={bullet} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <span
                      style={{
                        width: "8px",
                        height: "8px",
                        borderRadius: "50%",
                        background: step.accent,
                        boxShadow: `0 0 0 6px ${step.accent === "var(--text-primary)" ? "rgba(255,255,255,0.08)" : "rgba(84, 132, 255, 0.08)"}`,
                        flexShrink: 0,
                      }}
                    ></span>
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>{bullet}</span>
                  </div>
                ))}
              </div>

              <div
                style={{
                  marginTop: "auto",
                  borderRadius: "18px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background:
                    index === 1
                      ? "linear-gradient(180deg, rgba(84, 132, 255, 0.1), rgba(255,255,255,0.02))"
                      : "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.015))",
                  padding: "16px",
                }}
              >
                <div style={{ color: "var(--text-tertiary)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.14em", marginBottom: "10px" }}>
                  What the team sees
                </div>
                <div style={{ display: "grid", gap: "8px" }}>
                  <div style={{ height: "10px", width: index === 0 ? "78%" : index === 1 ? "70%" : "74%", borderRadius: "999px", background: "rgba(255,255,255,0.12)" }}></div>
                  <div style={{ height: "10px", width: index === 0 ? "58%" : index === 1 ? "62%" : "55%", borderRadius: "999px", background: "rgba(255,255,255,0.08)" }}></div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "8px" }}>
                    <div style={{ height: "54px", borderRadius: "14px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.05)" }}></div>
                    <div style={{ height: "54px", borderRadius: "14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}></div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{
            marginTop: "24px",
            padding: "18px 20px",
            borderRadius: "20px",
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.02)",
            display: "flex",
            justifyContent: "space-between",
            gap: "16px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ color: "var(--text-primary)", fontWeight: 700, marginBottom: "4px", fontSize: "0.96rem" }}>
              A better flow reduces friction for everyone involved.
            </div>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>
              Visitors move faster, operators stay oriented, and leadership gets a cleaner record of what happened on site.
            </div>
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {[
              "Fewer front-desk bottlenecks",
              "Clearer approvals",
              "Better arrival experience",
            ].map((item) => (
              <span
                key={item}
                style={{
                  padding: "8px 12px",
                  borderRadius: "999px",
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                  color: "var(--text-secondary)",
                  fontSize: "0.8rem",
                }}
              >
                {item}
              </span>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
