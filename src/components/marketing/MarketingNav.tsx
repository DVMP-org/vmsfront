"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown } from "lucide-react";
import { VmsWordmark } from "@/components/brand/VmsBrand";

const groups = [
  {
    label: "Product",
    links: [
      ["Overview", "/product"],
      ["Features", "/features"],
      ["Integrations", "/platform/integrations"],
      ["Access operations", "/features/access-operations"],
    ],
  },
  {
    label: "Solutions",
    links: [
      ["Use cases", "/use-cases"],
      ["Residential", "/solutions/residential"],
      ["Commercial", "/solutions/commercial"],
      ["Hospitality", "/solutions/hospitality"],
      ["Mixed-use", "/solutions/mixed-use"],
      ["Estate associations", "/solutions/estate-associations"],
    ],
  },
  {
    label: "Platform",
    links: [
      ["Multi-site management", "/platform/multi-site-management"],
      ["Organization branding", "/platform/white-label"],
      ["Connected infrastructure", "/platform/connected-infrastructure"],
    ],
  },
];

export function MarketingNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="mk-nav-wrap">
      <div className="mk-nav">
        <Link href="/" aria-label="VMS Core home">
          <VmsWordmark size="md" />
        </Link>
        <nav className="mk-desktop-nav" aria-label="Main navigation">
          {groups.map((group) => (
            <div className="mk-nav-group" key={group.label}>
              <button className="mk-nav-trigger" type="button">
                {group.label}
                <ChevronDown size={14} />
              </button>
              <div className="mk-dropdown">
                {group.links.map(([label, href]) => (
                  <Link href={href} key={href}>
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
          <Link href="/pricing">Pricing</Link>
          <Link href="/resources">Resources</Link>
        </nav>
        <div className="mk-nav-actions">
          <Link className="mk-login" href="/auth/login">
            Log in
          </Link>
          <Link
            className="mk-button mk-button-dark mk-button-small"
            href="/auth/register"
          >
            Get started <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <button
          className="mk-menu-toggle"
          type="button"
          aria-label={open ? "Close navigation" : "Open navigation"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav className="mk-mobile-nav" aria-label="Mobile navigation">
          {groups.map((group) => (
            <section key={group.label}>
              <h2>{group.label}</h2>
              {group.links.map(([label, href]) => (
                <Link onClick={() => setOpen(false)} href={href} key={href}>
                  {label}
                </Link>
              ))}
            </section>
          ))}
          <Link href="/pricing" onClick={() => setOpen(false)}>
            Pricing
          </Link>
          <Link href="/resources" onClick={() => setOpen(false)}>
            Resources
          </Link>
          <Link href="/auth/login" onClick={() => setOpen(false)}>
            Log in
          </Link>
          <Link
            className="mk-button mk-button-dark"
            href="/auth/register"
            onClick={() => setOpen(false)}
          >
            Get started
          </Link>
        </nav>
      )}
    </header>
  );
}
