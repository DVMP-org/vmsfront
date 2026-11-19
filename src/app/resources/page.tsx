import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Eyebrow, MarketingFrame } from "@/components/marketing/MarketingFrame";
import { MarketingPageIllustration } from "@/components/marketing/MarketingPageIllustration";
import { guides } from "@/components/marketing/guides";

export const metadata: Metadata = {
  title: "Property Operations Resources | VMS Core",
  description:
    "Explore VMS Core guides to property operations, multi-site management, visitor access, billing and integrations.",
  alternates: { canonical: "/resources/" },
  openGraph: {
    title: "VMS Core Resources",
    description: "Guides to property operations with VMS Core.",
    url: "/resources/",
    type: "website",
  },
};
export default function ResourcesPage() {
  return (
    <MarketingFrame>
      <main className="mk-resources">
        <section className="mk-resource-hero">
          <Eyebrow>Resources</Eyebrow>
          <h1>Practical guides for property operators.</h1>
          <p className="mk-lead">
            Explore the platform model, operational workflows and integration
            considerations for your organization.
          </p>
        </section>
        <section className="mk-resource-grid">
          {guides.map((guide) => (
            <Link href={`/resources/guides/${guide.slug}`} key={guide.slug}>
              <MarketingPageIllustration
                variant={guide.illustration}
                title={guide.title}
                interactive={false}
              />
              <small>{guide.category}</small>
              <h2>{guide.title}</h2>
              <p>{guide.description}</p>
              <b>
                Read guide <ArrowUpRight size={15} />
              </b>
            </Link>
          ))}
        </section>
        <section className="mk-resources-faq">
          <Eyebrow>Common questions</Eyebrow>
          <h2>Start with the workflows that matter to your site.</h2>
          <details>
            <summary>
              Can one organization manage several property types?
            </summary>
            <p>
              VMS Core models organizations, sites and places, with domain-aware
              site workspaces for residential, commercial, hospitality and
              mixed-use operations.
            </p>
          </details>
          <details>
            <summary>Does VMS Core provide payment processing?</summary>
            <p>
              VMS Core organizes billing workflows and connects to configured
              supported payment gateways. The configured provider processes
              transactions under its own terms.
            </p>
          </details>
          <details>
            <summary>Is the on-site edge device available?</summary>
            <p>
              No. The proposed edge-device approach is in development and is not
              currently available.
            </p>
          </details>
        </section>
      </main>
    </MarketingFrame>
  );
}
