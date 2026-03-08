import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export function Nav() {
  const { pathname } = useRouter();
  const [hash, setHash] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setHash(window.location.hash);
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const linkClass = (href: string) =>
    `nav-link${pathname === href ? " nav-link-active" : ""}`;

  const hashLinkClass = (fragment: string) =>
    `nav-link${hash === fragment ? " nav-link-active" : ""}`;

  return (
    <nav className="nav-fixed">
      <div className="container">
        {/* gradient-border wrapper when scrolled */}
        <div
          style={{
            padding: scrolled ? "1px" : "0",
            borderRadius: "20px",
            background: scrolled
              ? "linear-gradient(135deg, rgba(124,169,255,0.28), rgba(255,255,255,0.04) 40%, rgba(155,124,255,0.18) 80%, rgba(255,255,255,0.03))"
              : "transparent",
            transition: "background 0.4s ease, padding 0.4s ease",
          }}
        >
          <div
            className="nav-container"
            style={{
              background: scrolled
                ? "rgba(4, 5, 9, 0.88)"
                : "rgba(7, 17, 31, 0.7)",
              boxShadow: scrolled
                ? "0 24px 48px -40px rgba(0,0,0,0.9), 0 0 40px -20px rgba(84,132,255,0.12)"
                : "0 24px 48px -40px rgba(0,0,0,0.82), inset 0 1px 0 rgba(255,255,255,0.04)",
              border: scrolled ? "1px solid transparent" : undefined,
              transition: "background 0.4s ease, box-shadow 0.4s ease, border-color 0.4s ease",
            }}
          >
            <button
              className="mobile-menu-btn"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M2 5h14M2 9h14M2 13h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              )}
            </button>
            <Link href="/" className="nav-logo" style={{ textDecoration: "none" }}>
              <span style={{
                background: "linear-gradient(135deg, #ffffff 0%, var(--accent-secondary) 60%, var(--accent-violet) 100%)",
                backgroundClip: "text",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                VMS
              </span>
              <span style={{ color: "var(--accent-primary)" }}>Core</span>
            </Link>
            <div className="nav-links">
              <Link href="/features" className={linkClass("/features")}>
                For Communities
              </Link>
              <Link href="/solutions" className={linkClass("/solutions")}>
                Why VMS Core
              </Link>
              <Link href="/pricing" className={linkClass("/pricing")}>
                Pricing
              </Link>
              <a href="/#platform" className={hashLinkClass("#platform")} onClick={() => setHash("#platform")}>
                Platform
              </a>
              <a href="/#security" className={hashLinkClass("#security")} onClick={() => setHash("#security")}>
                Security
              </a>

              <Link
                href="/auth/login"
                className="btn-secondary"
                style={{ padding: "8px 16px", fontSize: "0.85rem", textDecoration: "none" }}
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className="btn-primary"
                style={{ padding: "8px 16px", fontSize: "0.85rem", textDecoration: "none" }}
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </div>
      {/* Mobile navigation drawer */}
      <div className={`mobile-nav-drawer${menuOpen ? " open" : ""}`}>
        <button
          className="mobile-nav-close"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M2 2l14 14M16 2L2 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        <Link href="/features" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
          For Communities
        </Link>
        <Link href="/solutions" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
          Why VMS Core
        </Link>
        <Link href="/pricing" className="mobile-nav-link" onClick={() => setMenuOpen(false)}>
          Pricing
        </Link>
        <a href="/#platform" className="mobile-nav-link" onClick={() => { setHash("#platform"); setMenuOpen(false); }}>
          Platform
        </a>
        <a href="/#security" className="mobile-nav-link" onClick={() => { setHash("#security"); setMenuOpen(false); }}>
          Security
        </a>

        <div className="mobile-nav-cta">
          <Link
            href="/auth/login"
            className="btn-secondary"
            style={{ flex: 1, textAlign: "center", padding: "12px 16px", fontSize: "0.95rem", textDecoration: "none" }}
            onClick={() => setMenuOpen(false)}
          >
            Login
          </Link>
          <Link
            href="/auth/register"
            className="btn-primary"
            style={{ flex: 1, textAlign: "center", padding: "12px 16px", fontSize: "0.95rem", textDecoration: "none" }}
            onClick={() => setMenuOpen(false)}
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  );
}

