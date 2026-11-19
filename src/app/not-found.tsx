import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Page not found | VMS Core",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main
      className="mk-site"
      style={{
        minHeight: "70vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
      }}
    >
      <div style={{ maxWidth: 560, textAlign: "center" }}>
        <p className="mk-eyebrow">404 · Page not found</p>
        <h1
          style={{
            fontSize: "clamp(40px, 7vw, 64px)",
            lineHeight: 1,
            letterSpacing: "-.06em",
          }}
        >
          This page isn’t here.
        </h1>
        <p className="mk-lead" style={{ margin: "20px auto" }}>
          The link may have moved. Return to VMS Core and continue from the
          platform overview.
        </p>
        <Link
          className="mk-button mk-button-dark"
          href="/"
          style={{ margin: "12px auto" }}
        >
          <ArrowLeft size={15} /> Back to home
        </Link>
      </div>
    </main>
  );
}
