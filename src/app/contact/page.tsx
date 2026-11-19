import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, Building2, Check } from "lucide-react";
import {
  CTA,
  Eyebrow,
  MarketingFrame,
} from "@/components/marketing/MarketingFrame";

export const metadata: Metadata = {
  title: "Contact VMS Core",
  description:
    "Talk with the VMS Core team about multi-site operations, provider configuration and enterprise requirements.",
  alternates: { canonical: "/contact/" },
  openGraph: {
    title: "Contact VMS Core",
    description:
      "Discuss your property operations and enterprise requirements with the VMS Core team.",
    url: "/contact/",
    type: "website",
  },
};

export default function ContactPage() {
  return (
    <MarketingFrame>
      <main className="mk-contact">
        <section className="mk-contact-hero">
          <Eyebrow>Enterprise and multi-site enquiries</Eyebrow>
          <h1>Let’s talk about the way your properties operate.</h1>
          <p className="mk-lead">
            Share your locations, workflows and integration requirements with
            the VMS Core team. We’ll use that context to discuss product fit and
            current availability.
          </p>
          <div className="mk-hero-actions">
            <a
              className="mk-button mk-button-dark"
              href="mailto:support@vmscore.to?subject=VMS%20Core%20enterprise%20enquiry"
            >
              Email the VMS Core team <ArrowUpRight size={16} />
            </a>
            <CTA>Get started</CTA>
          </div>
          <p className="mk-status-note">
            <Check size={15} /> Use the email link to open a message to
            support@vmscore.to.
          </p>
        </section>
        <section className="mk-contact-body">
          <article>
            <span>
              <Building2 />
            </span>
            <h2>Useful details to include</h2>
            <ul>
              <li>How many sites or properties you manage</li>
              <li>The property types and teams involved</li>
              <li>Payment, communication or access providers to consider</li>
              <li>Any rollout, branding or deployment requirements</li>
            </ul>
          </article>
          <aside>
            <Eyebrow>Getting started now?</Eyebrow>
            <h2>Create an organization account.</h2>
            <p>
              Start with the existing registration and organization setup flow.
              Subscription options are shown during setup.
            </p>
            <CTA>Get started</CTA>
            <Link href="/platform/integrations">
              Review integration capabilities <ArrowUpRight size={15} />
            </Link>
          </aside>
        </section>
      </main>
    </MarketingFrame>
  );
}
