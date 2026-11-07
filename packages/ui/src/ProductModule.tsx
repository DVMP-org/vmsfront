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
        background: "#f5f6f8",
        color: "#17191f",
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
      }}
    >
      <section
        style={{
          width: "min(560px, calc(100vw - 48px))",
          border: "1px solid #dfe2e8",
          borderRadius: 18,
          background: "#fff",
          padding: 32,
        }}
      >
        <p
          style={{
            margin: 0,
            color: "#5b6270",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
          }}
        >
          {eyebrow}
        </p>
        <h1 style={{ margin: "10px 0 16px", fontSize: 32 }}>{title}</h1>
        <div style={{ lineHeight: 1.6 }}>{children}</div>
      </section>
    </main>
  );
}
