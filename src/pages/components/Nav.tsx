import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

export function Nav() {
  const { pathname } = useRouter();
  const [hash, setHash] = useState("");

  useEffect(() => {
    setHash(window.location.hash);
    const onHashChange = () => setHash(window.location.hash);
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const linkClass = (href: string) =>
    `nav-link${pathname === href ? " nav-link-active" : ""}`;

  const hashLinkClass = (fragment: string) =>
    `nav-link${hash === fragment ? " nav-link-active" : ""}`;

  return (
    <nav className="nav-fixed">
      <div className="container nav-container">
        <Link href="/" className="nav-logo gradient-text" style={{ textDecoration: "none" }}>
          VMS Core
        </Link>
        <div className="nav-links">
          <Link href="/features" className={linkClass("/features")}>
            For Communities
          </Link>
          <Link href="/problems" className={linkClass("/problems")}>
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
    </nav>
  );
}

