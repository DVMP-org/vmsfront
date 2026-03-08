import Link from "next/link";

export function Nav() {
  return (
    <nav className="nav-fixed">
      <div className="container nav-container">
        <Link href="/" className="nav-logo gradient-text" style={{ textDecoration: "none" }}>
          VMS Core
        </Link>
        <div className="nav-links">
          <Link href="/features" className="nav-link">
            Features
          </Link>
          <Link href="/problems" className="nav-link">
            Problems
          </Link>
          <Link href="/pricing" className="nav-link">
            Pricing
          </Link>
          <a href="/#platform" className="nav-link">
            Platform
          </a>
          <a href="/#security" className="nav-link">
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
            Register
          </Link>
        </div>
      </div>
    </nav>
  );
}
