import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import {
  CTA,
  Eyebrow,
  MarketingFrame,
} from "@/components/marketing/MarketingFrame";

export const metadata: Metadata = {
  title: "VMS Core Pricing",
  description:
    "Explore VMS Core subscription options during organization setup and choose a plan for your property operation.",
  alternates: { canonical: "/pricing/" },
  openGraph: {
    title: "VMS Core Pricing",
    description: "Choose a plan for your property operation.",
    url: "/pricing/",
    type: "website",
  },
};
export default function PricingPage() {
  return (
    <MarketingFrame>
      <main className="mk-pricing">
        <section className="mk-pricing-hero">
          <Eyebrow>Pricing</Eyebrow>
          <h1>Choose an operating plan that fits your organization.</h1>
          <p className="mk-lead">
            VMS Core presents available subscription plans as part of
            organization setup, so you can review the current options in the
            product.
          </p>
          <CTA>Start organization setup</CTA>
          <p className="mk-pricing-note">
            Plan availability and included capabilities may vary. Review the
            current terms in the setup flow before choosing.
          </p>
        </section>
        <section className="mk-pricing-body">
          <article>
            <span className="mk-plan-mark">VMS</span>
            <h2>Start with your organization</h2>
            <p>
              Create an account, set up your organization, then review the
              subscription plans currently available for your workspace.
            </p>
            <ul>
              <li>
                <Check />
                Plan options shown in the product
              </li>
              <li>
                <Check />
                Organization and site setup flow
              </li>
              <li>
                <Check />
                Current plan terms available before selection
              </li>
            </ul>
            <Link className="mk-inline-link" href="/auth/register">
              Create an account <ArrowRight size={16} />
            </Link>
          </article>
          <aside>
            <h3>Need a multi-site or integration discussion?</h3>
            <p>
              Start with the product setup flow to establish your organization
              and review available options. For provider-specific requirements,
              confirm compatibility before rollout.
            </p>
            <Link href="/platform/integrations">
              Review integration capabilities <ArrowRight size={15} />
            </Link>
          </aside>
        </section>
        <section className="mk-pricing-faq">
          <Eyebrow>Pricing questions</Eyebrow>
          <h2>What to expect</h2>
          <details>
            <summary>Are plan prices shown on this page?</summary>
            <p>
              No. Current subscription options are presented within the VMS Core
              organization setup flow.
            </p>
          </details>
          <details>
            <summary>Are payment processing fees included?</summary>
            <p>
              Payment provider transaction fees and settlement terms are
              governed by the configured provider's agreement with the
              organization.
            </p>
          </details>
          <details>
            <summary>
              Can I compare plans before creating an organization?
            </summary>
            <p>
              The current plan selection is part of organization setup. You can
              begin by creating an account and reviewing the options shown
              there.
            </p>
          </details>
        </section>
      </main>
    </MarketingFrame>
  );
}
