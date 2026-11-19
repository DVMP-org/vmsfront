import Link from "next/link";
import { VmsWordmark } from "@/components/brand/VmsBrand";
import { MarketingNav } from "./MarketingNav";

export function MarketingFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mk-site">
      <MarketingNav />
      {children}
      <footer className="mk-footer">
        <div className="mk-footer-top">
          <div>
            <Link href="/">
              <VmsWordmark size="md" />
            </Link>
            <p>One platform for your properties, people and operations.</p>
          </div>
          <div className="mk-footer-links">
            <section>
              <b>Product</b>
              <Link href="/product">Overview</Link>
              <Link href="/features/visitor-management">
                Visitor management
              </Link>
              <Link href="/platform/integrations">Integrations</Link>
            </section>
            <section>
              <b>Solutions</b>
              <Link href="/solutions/residential">Residential</Link>
              <Link href="/solutions/commercial">Commercial</Link>
              <Link href="/solutions/hospitality">Hospitality</Link>
              <Link href="/solutions/mixed-use">Mixed-use</Link>
            </section>
            <section>
              <b>Company</b>
              <Link href="/pricing">Pricing</Link>
              <Link href="/resources">Resources</Link>
              <Link href="/contact">Contact</Link>
              <Link href="/auth/login">Log in</Link>
            </section>
          </div>
        </div>
        <div className="mk-footer-bottom">
          <span>© {new Date().getFullYear()} VMS Core</span>
          <span>
            Property operations software for organizations in Nigeria.
          </span>
        </div>
      </footer>
    </div>
  );
}

export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <p className="mk-eyebrow">{children}</p>;
}
export function CTA({
  href = "/auth/register",
  children = "Get started",
  secondary = false,
}: {
  href?: string;
  children?: React.ReactNode;
  secondary?: boolean;
}) {
  return (
    <Link
      className={`mk-button ${secondary ? "mk-button-light" : "mk-button-dark"}`}
      href={href}
    >
      {children}
      <span aria-hidden="true">↗</span>
    </Link>
  );
}
