import type { ReactNode } from "react";

export interface ProductModuleProps {
  eyebrow: string;
  title: string;
  children: ReactNode;
}

export function ProductModule({
  eyebrow,
  title,
  children,
}: ProductModuleProps) {
  return (
    <main
      style={{
        minHeight: "100vh",
        margin: 0,
        display: "grid",
        placeItems: "center",
        background: "var(--vms-canvas)",
        color: "var(--vms-ink)",
        fontFamily: "var(--vms-font-interface)",
      }}
    >
      <section
        style={{
          width: "min(560px, calc(100vw - 48px))",
          border: "1px solid var(--vms-line)",
          borderRadius: "var(--vms-radius-surface)",
          background: "var(--vms-surface)",
          padding: 24,
          boxShadow: "var(--vms-shadow-raised)",
        }}
      >
        <p
          style={{
            margin: 0,
            color: "var(--vms-ink-muted)",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {eyebrow}
        </p>
        <h1 style={{ margin: "8px 0 16px", fontSize: 28, lineHeight: 1.25 }}>{title}</h1>
        <div style={{ color: "var(--vms-ink-muted)", lineHeight: 1.6 }}>{children}</div>
      </section>
    </main>
  );
}
