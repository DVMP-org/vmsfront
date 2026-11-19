import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  CheckCircle2,
  DoorOpen,
  Layers3,
  WalletCards,
  UsersRound,
  Wrench,
  ShieldCheck,
} from "lucide-react";
import { Eyebrow, MarketingFrame } from "@/components/marketing/MarketingFrame";
import { features } from "@/components/marketing/content";

export const metadata: Metadata = {
  title: "VMS Core Property Operations Features",
  description:
    "Explore VMS Core visitor management, property charges, occupancy, maintenance and access operations.",
  alternates: { canonical: "/features/" },
  openGraph: {
    title: "VMS Core Features",
    description:
      "Explore property operations workflows for sites, people and access.",
    url: "/features/",
    type: "website",
  },
};

const items = [
  [DoorOpen, "visitor-management"],
  [WalletCards, "estate-billing"],
  [UsersRound, "occupancy-management"],
  [Wrench, "maintenance-management"],
  [ShieldCheck, "access-operations"],
] as const;

export default function FeaturesPage() {
  return (
    <MarketingFrame>
      <main className="mk-features-index">
        <section>
          <Eyebrow>Product features</Eyebrow>
          <h1>Everyday property workflows, brought together.</h1>
          <p className="mk-lead">
            Explore how VMS Core helps teams keep site, people, access, charge
            and maintenance work in context.
          </p>
        </section>
        <div className="mk-feature-index-grid">
          {items.map(([Icon, slug]) => {
            const feature = features[slug];
            return (
              <Link href={`/features/${slug}`} key={slug}>
                <span>
                  <Icon />
                </span>
                <small>
                  <CheckCircle2 size={13} /> Available capability
                </small>
                <h2>{feature.title}</h2>
                <p>{feature.description}</p>
                <b>
                  Explore feature <ArrowUpRight size={15} />
                </b>
              </Link>
            );
          })}
          <Link href="/platform/integrations">
            <span>
              <Layers3 />
            </span>
            <small>
              <CheckCircle2 size={13} /> Configuration dependent
            </small>
            <h2>Integrations and plugins</h2>
            <p>
              Configure supported payment and email services and enable
              available plugins for your organization.
            </p>
            <b>
              Explore integrations <ArrowUpRight size={15} />
            </b>
          </Link>
        </div>
        <section className="mk-feature-index-note">
          <Eyebrow>Availability varies</Eyebrow>
          <h2>Provider connections depend on configuration and support.</h2>
          <p>
            Payment gateways and email settings have product configuration
            surfaces. Confirm provider compatibility and supported channels
            before rollout.
          </p>
          <Link href="/platform/integrations">
            Read about integrations <ArrowUpRight size={15} />
          </Link>
        </section>
      </main>
    </MarketingFrame>
  );
}
