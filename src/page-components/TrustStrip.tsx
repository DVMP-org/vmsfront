import { motion } from "framer-motion";

const ITEMS = [
  { icon: "shield", label: "SOC 2 Type II", color: "var(--accent-secondary)" },
  { icon: "check", label: "ISO 27001", color: "var(--accent-green)" },
  { icon: "lock", label: "GDPR Compliant", color: "var(--accent-violet)" },
  { icon: "plus", label: "HIPAA Ready", color: "var(--accent-cyan)" },
  { icon: "server", label: "Self-Hosted Available", color: "var(--accent-secondary)" },
  { icon: "eye", label: "Zero-Trust Architecture", color: "var(--accent-violet)" },
  { icon: "clock", label: "99.9% Uptime SLA", color: "var(--accent-green)" },
  { icon: "key", label: "End-to-End Encryption", color: "var(--accent-cyan)" },
  { icon: "file", label: "Full Audit Trail", color: "var(--accent-secondary)" },
  { icon: "globe", label: "Multi-Region Deploy", color: "var(--accent-secondary)" },
];

const ICON_PATHS: Record<string, React.ReactNode> = {
  shield: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />,
  check: <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
  lock: <><rect x="3" y="11" width="18" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" /><path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></>,
  plus: <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
  server: <><rect x="2" y="2" width="20" height="8" rx="2" stroke="currentColor" strokeWidth="1.8" /><rect x="2" y="14" width="20" height="8" rx="2" stroke="currentColor" strokeWidth="1.8" /><circle cx="6" cy="6" r="1" fill="currentColor" /><circle cx="6" cy="18" r="1" fill="currentColor" /></>,
  eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.8" /></>,
  clock: <><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" /><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></>,
  key: <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />,
  file: <><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><polyline points="14 2 14 8 20 8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /><line x1="8" y1="13" x2="16" y2="13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></>,
  globe: <><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" /><path d="M2 12h20M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" stroke="currentColor" strokeWidth="1.8" /></>,
};

import React from "react";

function TickerItem({ icon, label, color }: { icon: string; label: string; color: string }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "9px",
        padding: "8px 20px",
        margin: "0 6px",
        borderRadius: "999px",
        border: "1px solid rgba(255,255,255,0.07)",
        background: "rgba(255,255,255,0.025)",
        whiteSpace: "nowrap",
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" style={{ color, flexShrink: 0 }}>
        {ICON_PATHS[icon]}
      </svg>
      <span style={{ fontSize: "0.82rem", color: "var(--text-secondary)", fontWeight: 500 }}>
        {label}
      </span>
    </div>
  );
}

function Sep() {
  return (
    <span
      style={{
        display: "inline-block",
        width: "4px",
        height: "4px",
        borderRadius: "50%",
        background: "rgba(255,255,255,0.12)",
        flexShrink: 0,
        margin: "0 14px",
        verticalAlign: "middle",
      }}
    />
  );
}

export function TrustStrip() {
  const doubled = [...ITEMS, ...ITEMS];

  return (
    <section
      id="security"
      style={{
        padding: "56px 0",
        borderTop: "1px solid rgba(255,255,255,0.05)",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        className="glow-blob blue"
        style={{ width: "400px", height: "200px", top: "50%", left: "30%", opacity: 0.18, filter: "blur(80px)" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        style={{ textAlign: "center", marginBottom: "28px" }}
      >
        <span
          style={{
            fontSize: "0.72rem",
            textTransform: "uppercase",
            letterSpacing: "0.16em",
            color: "var(--text-tertiary)",
            fontWeight: 600,
          }}
        >
          Enterprise-grade security &amp; compliance, built in
        </span>
      </motion.div>

      <div className="ticker-outer">
        <div className="ticker-track" style={{ alignItems: "center" }}>
          {doubled.map((item, i) => (
            <React.Fragment key={i}>
              <TickerItem {...item} />
              {i !== doubled.length - 1 && <Sep />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
}
