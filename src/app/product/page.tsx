import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Building2,
  DoorOpen,
  WalletCards,
  Wrench,
  ShieldCheck,
  UsersRound,
  Check,
  Layers3,
} from "lucide-react";
import {
  CTA,
  Eyebrow,
  MarketingFrame,
} from "@/components/marketing/MarketingFrame";
import { MarketingPageIllustration } from "@/components/marketing/MarketingPageIllustration";

export const metadata: Metadata = {
  title: "VMS Core Product Overview",
  description:
    "See how VMS Core connects organizations, sites, places, people and property operations.",
  alternates: { canonical: "/product/" },
  openGraph: {
    title: "VMS Core Product Overview",
    description: "One platform for your properties, people and operations.",
    url: "/product/",
    type: "website",
  },
};

const modules = [
  [
    Building2,
    "Sites and places",
    "Represent organizations, managed locations and assignable spaces.",
    "/platform/multi-site-management",
  ],
  [
    UsersRound,
    "People and occupancy",
    "Keep occupants and responsible parties connected to the relevant places.",
    "/features/occupancy-management",
  ],
  [
    DoorOpen,
    "Visitor access",
    "Manage authorizations, checkpoint validation and movement records.",
    "/features/visitor-management",
  ],
  [
    WalletCards,
    "Charges and payments",
    "Define charges and assignments; review payment records and balances.",
    "/features/estate-billing",
  ],
  [
    Wrench,
    "Maintenance",
    "Coordinate site requests, assignment and resolution records.",
    "/features/maintenance-management",
  ],
  [
    ShieldCheck,
    "Integrations and branding",
    "Configure supported providers, plugins and organization themes.",
    "/platform/integrations",
  ],
] as const;

export default function ProductPage() {
  return (
    <MarketingFrame>
      <main className="mk-product">
        <section className="mk-product-hero mk-product-hero-grid">
          <div>
            <Eyebrow>Product overview</Eyebrow>
            <h1>One operating platform for property work.</h1>
            <p className="mk-lead">
              VMS Core connects the organization, each managed site, the people
              who use its places and the teams responsible for daily operations.
            </p>
            <div className="mk-hero-actions">
              <CTA>Get started</CTA>
              <CTA href="/contact" secondary>
                Talk to our team
              </CTA>
            </div>
          </div>
          <MarketingPageIllustration
            variant="product-overview"
            title="VMS Core property operations overview"
          />
        </section>
        <section className="mk-product-structure">
          <div>
            <Eyebrow>A structure that follows the property</Eyebrow>
            <h2>Organization → Sites → Places → Workspaces</h2>
            <p className="mk-body">
              An organization can represent the operator or association. Sites
              represent the managed locations. Places represent the apartments,
              offices, rooms or other spaces within them. Workspace access
              follows a person’s role and relationship.
            </p>
            <Link
              className="mk-inline-link"
              href="/platform/multi-site-management"
            >
              Learn about multi-site management <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="mk-product-model">
            <article>
              <span>01</span>
              <b>Organization</b>
              <small>Portfolio and shared settings</small>
            </article>
            <article>
              <span>02</span>
              <b>Site</b>
              <small>Location and operating team</small>
            </article>
            <article>
              <span>03</span>
              <b>Place</b>
              <small>Unit, office, room or space</small>
            </article>
            <article>
              <span>04</span>
              <b>Workspace</b>
              <small>Tools based on role and access</small>
            </article>
          </div>
        </section>
        <section className="mk-product-modules">
          <Eyebrow>Core operating workflows</Eyebrow>
          <h2>Bring the everyday work into context.</h2>
          <p className="mk-product-intro">
            Use the workflows that fit the property and the team. Each record
            remains connected to its organization, site or place.
          </p>
          <div>
            {modules.map(([Icon, title, description, href]) => (
              <Link href={href} key={title}>
                <Icon />
                <h3>{title}</h3>
                <p>{description}</p>
                <span>
                  Explore capability <ArrowRight size={14} />
                </span>
              </Link>
            ))}
          </div>
        </section>
        <section className="mk-product-roles">
          <div>
            <Eyebrow>Different responsibilities</Eyebrow>
            <h2>Give each team a workspace that fits its work.</h2>
            <p>
              Organization owners manage the portfolio. Site administrators
              coordinate operations for their location. Occupants and checkpoint
              teams use workflows relevant to their responsibilities.
            </p>
            <Link className="mk-inline-link" href="/use-cases">
              Explore use cases <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="mk-product-role-list">
            <article>
              <Layers3 />
              <span>
                <b>Organization administrators</b>
                <small>Portfolio structure and shared settings</small>
              </span>
              <Check />
            </article>
            <article>
              <Building2 />
              <span>
                <b>Site administrators</b>
                <small>People, places and local operations</small>
              </span>
              <Check />
            </article>
            <article>
              <UsersRound />
              <span>
                <b>Occupants</b>
                <small>Place relationships and permitted actions</small>
              </span>
              <Check />
            </article>
            <article>
              <ShieldCheck />
              <span>
                <b>Checkpoint teams</b>
                <small>Credential checks and passage records</small>
              </span>
              <Check />
            </article>
          </div>
        </section>
        <section className="mk-product-integrations">
          <div>
            <Eyebrow>Extensible where supported</Eyebrow>
            <h2>Configure the services that support your operations.</h2>
            <p>
              Set up supported payment gateway credentials, organization email
              delivery and enabled plugins. Confirm provider support,
              compatibility and terms for your specific setup.
            </p>
            <Link className="mk-inline-link" href="/platform/integrations">
              Explore integrations <ArrowUpRight size={15} />
            </Link>
          </div>
          <MarketingPageIllustration
            variant="integrations"
            title="Supported provider configuration"
          />
        </section>
        <section className="mk-small-cta">
          <h2>Start with the sites you manage.</h2>
          <p>
            Set up an organization and review the workflows and subscription
            options available for your operation.
          </p>
          <div className="mk-hero-actions">
            <CTA>Get started</CTA>
            <CTA href="/contact" secondary>
              Talk to our team
            </CTA>
          </div>
        </section>
      </main>
    </MarketingFrame>
  );
}
