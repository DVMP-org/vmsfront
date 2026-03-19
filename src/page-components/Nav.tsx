
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useTheme } from "@/lib/theme_context";

const appName = process.env.NEXT_PUBLIC_APP_NAME || "VMS Core";
export function Nav() {
  const { pathname } = useRouter();
  const [hash, setHash] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

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
              <Image
                src={theme === "dark" ? "/gardvix-logo-dark.svg" : "/gardvix-logo-light.svg"}
                alt="Gardvix"
                width={140}
                height={45}
                priority
              />
            </Link>
            <div className="nav-links">
              <Link href="/features" className={linkClass("/features")}>
                For Communities
              </Link>
              <Link href="/solutions" className={linkClass("/solutions")}>
                Why {appName}
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

              <button
                onClick={toggleTheme}
                aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
                className="theme-toggle-btn"
              >
                {theme === "light" ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                )}
              </button>
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
          Why {appName}
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

        <button
          onClick={() => { toggleTheme(); setMenuOpen(false); }}
          aria-label={theme === "light" ? "Switch to dark mode" : "Switch to light mode"}
          className="mobile-nav-link"
          style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer", border: "none", background: "none", width: "100%", textAlign: "left" }}
        >
          {theme === "light" ? (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
              Dark mode
            </>
          ) : (
            <>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <line x1="12" y1="1" x2="12" y2="3" />
                <line x1="12" y1="21" x2="12" y2="23" />
                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                <line x1="1" y1="12" x2="3" y2="12" />
                <line x1="21" y1="12" x2="23" y2="12" />
                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
              </svg>
              Light mode
            </>
          )}
        </button>
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

