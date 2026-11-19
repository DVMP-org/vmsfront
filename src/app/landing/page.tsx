import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowUpRight,
  Building2,
  DoorOpen,
  WalletCards,
  Wrench,
  ShieldCheck,
  Layers3,
  CreditCard,
  MessagesSquare,
  PlugZap,
  Hotel,
  Store,
  Home,
  Network,
  Check,
  UsersRound,
} from "lucide-react";
import {
  CTA,
  Eyebrow,
  MarketingFrame,
} from "@/components/marketing/MarketingFrame";
import { HierarchyDiagram } from "@/components/marketing/HierarchyDiagram";
import { marketingSiteUrl } from "@/components/marketing/seo";

export const metadata: Metadata = {
  title: "VMS Core | Property & Estate Management Software in Nigeria",
  description:
    "Manage estates, sites, residents, visitor access, service charges and property operations with VMS Core, a flexible platform for Nigerian property operators.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "VMS Core | Property operations for every site",
    description: "One platform for your properties, people and operations.",
    url: "/",
    siteName: "VMS Core",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "VMS Core property operations platform",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "VMS Core | Property operations for every site",
    description: "One platform for your properties, people and operations.",
    images: ["/opengraph-image"],
  },
};

const useCases = [
  {
    icon: Home,
    name: "Residential",
    line: "Run a more organized estate.",
    detail:
      "Bring places, occupants, visitor access, charges and maintenance into the same operating context.",
    href: "/solutions/residential",
    art: "mk-art-residential",
  },
  {
    icon: Store,
    name: "Commercial",
    line: "Keep spaces and tenants in view.",
    detail:
      "Coordinate business occupants, leases, charges, access and facility work by site.",
    href: "/solutions/commercial",
    art: "mk-art-commercial",
  },
  {
    icon: Hotel,
    name: "Hospitality",
    line: "Coordinate rooms and guest stays.",
    detail:
      "Use supported room, reservation, guest and day-to-day operating workflows.",
    href: "/solutions/hospitality",
    art: "mk-art-hospitality",
  },
  {
    icon: Layers3,
    name: "Mixed-use",
    line: "Manage different uses together.",
    detail:
      "Keep varied spaces, occupants and shared facilities within one organization structure.",
    href: "/solutions/mixed-use",
    art: "mk-art-mixed",
  },
];
const work = [
  {
    icon: DoorOpen,
    title: "Visitor access",
    text: "Keep invitations, checkpoint activity and movement records connected.",
    href: "/features/visitor-management",
  },
  {
    icon: WalletCards,
    title: "Charges and collections",
    text: "Define charges, assign responsibility and follow payments and balances.",
    href: "/features/estate-billing",
  },
  {
    icon: Building2,
    title: "Occupancy records",
    text: "Maintain structured information about the people and businesses in each place.",
    href: "/features/occupancy-management",
  },
  {
    icon: Wrench,
    title: "Maintenance",
    text: "Track requests, assignments and resolution against the relevant site.",
    href: "/features/maintenance-management",
  },
];

function Schema() {
  const site = marketingSiteUrl;
  const data = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "VMS Core",
      url: site,
      logo: `${site}/icon.svg`,
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "VMS Core",
      url: site,
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: "VMS Core",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "Property operations platform for managing sites, occupants, visitor access, charges and maintenance.",
    },
  ];
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

export default function LandingPage() {
  return (
    <MarketingFrame>
      <main>
        <Schema />
        <section className="mk-hero">
          <div className="mk-hero-copy">
            <Eyebrow>Property operations platform · Nigeria</Eyebrow>
            <h1>One platform for your properties, people and operations.</h1>
            <p className="mk-lead">
              Manage sites, occupants, visitor access, service charges and daily
              property operations with VMS Core. Connect supported services as
              your organization grows.
            </p>
            <div className="mk-hero-actions">
              <CTA>Get started</CTA>
              <CTA href="/product" secondary>
                Explore the platform
              </CTA>
            </div>
            <p className="mk-proof-line">
              <Check size={15} /> For residential, commercial, hospitality and
              mixed-use properties
            </p>
          </div>
          <div className="mk-hero-visual">
            <div className="mk-visual-caption">
              <span className="mk-status-dot" /> Organization structure
            </div>
            <HierarchyDiagram />
            <div className="mk-visual-foot">
              <span>One organization</span>
              <ArrowUpRight size={15} />
              <span>Distinct site workspaces</span>
            </div>
          </div>
        </section>
        <section className="mk-press-strip">
          <span>Built for the work behind</span>
          <b>RESIDENTIAL</b>
          <i />
          <b>COMMERCIAL</b>
          <i />
          <b>HOSPITALITY</b>
          <i />
          <b>MIXED-USE</b>
        </section>
        <section className="mk-section mk-problem">
          <div className="mk-section-heading">
            <div>
              <Eyebrow>One coordinated operating environment</Eyebrow>
              <h2>
                Property operations shouldn’t depend on scattered records.
              </h2>
            </div>
            <p>
              Visitor records, occupancy, charges and maintenance can end up
              across spreadsheets, paper registers and disconnected
              conversations. VMS Core brings these workflows into context.
            </p>
          </div>
          <div className="mk-work-grid">
            {work.map(({ icon: Icon, title, text, href }, i) => (
              <Link
                className={`mk-work-item mk-work-item-${i + 1}`}
                href={href}
                key={title}
              >
                <span className="mk-icon-box">
                  <Icon size={20} />
                </span>
                <span className="mk-work-index">0{i + 1}</span>
                <h3>{title}</h3>
                <p>{text}</p>
                <span className="mk-text-link">
                  Explore capability <ArrowUpRight size={15} />
                </span>
              </Link>
            ))}
          </div>
        </section>
        <section className="mk-structure-section">
          <div className="mk-section mk-structure">
            <div>
              <Eyebrow>Organization → Sites → Places</Eyebrow>
              <h2>The everyday work of property management, organized.</h2>
              <p className="mk-body">
                From the organization level down to individual apartments,
                offices, rooms and shared spaces, teams get a workspace shaped
                by their role and permissions.
              </p>
              <div className="mk-structure-list">
                <p>
                  <b>Organization</b>
                  <span>
                    The operator managing the portfolio and shared
                    configuration.
                  </span>
                </p>
                <p>
                  <b>Site</b>
                  <span>An estate, building, hotel or managed location.</span>
                </p>
                <p>
                  <b>Place</b>
                  <span>
                    An apartment, office, shop, room or assignable space.
                  </span>
                </p>
                <p>
                  <b>Workspace</b>
                  <span>The tools available to a person in their role.</span>
                </p>
              </div>
              <Link
                className="mk-inline-link"
                href="/platform/multi-site-management"
              >
                Explore multi-site management <ArrowUpRight size={16} />
              </Link>
            </div>
            <HierarchyDiagram />
          </div>
        </section>
        <section className="mk-section mk-solutions">
          <div className="mk-section-heading">
            <div>
              <Eyebrow>Solutions for different property types</Eyebrow>
              <h2>Different properties. Designed around how they operate.</h2>
            </div>
            <p>
              Residential estates, commercial buildings, hospitality properties
              and mixed-use developments have different day-to-day needs.
            </p>
          </div>
          <div className="mk-solution-grid">
            {useCases.map(({ icon: Icon, name, line, detail, href, art }) => (
              <Link href={href} className="mk-solution" key={name}>
                <div className={`mk-solution-art ${art}`} aria-hidden="true">
                  <div className="mk-building-shape">
                    <Icon size={28} />
                    <span />
                    <span />
                    <span />
                  </div>
                  <div className="mk-art-orbit" />
                </div>
                <div className="mk-solution-copy">
                  <span>{name}</span>
                  <ArrowUpRight size={16} />
                  <h3>{line}</h3>
                  <p>{detail}</p>
                </div>
              </Link>
            ))}
          </div>
          <Link
            className="mk-inline-link"
            href="/solutions/estate-associations"
          >
            See estate association workflows <ArrowUpRight size={16} />
          </Link>
        </section>
        <section className="mk-extensible">
          <div className="mk-section mk-extensible-inner">
            <div>
              <Eyebrow>Your sites. Your systems. Your providers.</Eyebrow>
              <h2>Your operations evolve. Your software should too.</h2>
              <p>
                Use the organization and site structure as a foundation, then
                configure supported payment, email, integration and plugin
                capabilities for the work your teams do.
              </p>
              <CTA href="/platform/integrations" secondary>
                Explore integrations
              </CTA>
            </div>
            <div
              className="mk-connection-graphic"
              aria-label="VMS Core connected to payment, communication, access and plugin capabilities"
            >
              <div className="mk-connection-center">
                <Layers3 size={24} />
                <b>VMS Core</b>
                <small>Organization</small>
              </div>
              <div className="mk-connection-node mk-node-pay">
                <CreditCard />
                <span>Payments</span>
              </div>
              <div className="mk-connection-node mk-node-msg">
                <MessagesSquare />
                <span>Communication</span>
              </div>
              <div className="mk-connection-node mk-node-access">
                <ShieldCheck />
                <span>Access systems</span>
              </div>
              <div className="mk-connection-node mk-node-plugin">
                <PlugZap />
                <span>Plugins</span>
              </div>
              <svg
                viewBox="0 0 460 340"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path d="M230 170 L90 65 M230 170 L370 65 M230 170 L90 275 M230 170 L370 275" />
              </svg>
            </div>
          </div>
        </section>
        <section className="mk-section mk-payment">
          <div className="mk-payment-copy">
            <Eyebrow>Payments on your terms</Eyebrow>
            <h2>Your collections. Your payment provider.</h2>
            <p>
              VMS Core manages charge definitions, assignments, schedules and
              payment records. A configured payment provider handles transaction
              processing and settlement under its arrangement with your
              organization.
            </p>
            <ul>
              <li>Configure a supported gateway for your organization</li>
              <li>Define charges and assign responsibility to places</li>
              <li>Review payment records and outstanding balances</li>
            </ul>
            <Link className="mk-inline-link" href="/features/estate-billing">
              Explore billing and payments <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="mk-payment-diagram">
            <div className="mk-payment-step">
              <span>01</span>
              <CreditCard />
              <b>Organization charge</b>
              <small>Defined and assigned in VMS Core</small>
            </div>
            <div className="mk-payment-line" />
            <div className="mk-payment-step mk-payment-provider">
              <span>02</span>
              <Network />
              <b>Configured provider</b>
              <small>Processes transaction under its terms</small>
            </div>
            <div className="mk-payment-line" />
            <div className="mk-payment-step">
              <span>03</span>
              <Check />
              <b>Payment record</b>
              <small>Visible in the operating workflow</small>
            </div>
            <p>
              Provider availability, fees and settlement terms depend on
              configuration and provider agreement.
            </p>
          </div>
        </section>
        <section className="mk-notice-band">
          <MessagesSquare />
          <div>
            <Eyebrow>Communication configuration</Eyebrow>
            <h2>Configure email delivery for your organization.</h2>
            <p>
              Email delivery settings are available in VMS Core. Event-based
              routing and WhatsApp or SMS channels depend on current provider
              and product support.
            </p>
          </div>
          <Link href="/platform/integrations" className="mk-inline-link">
            Communication capabilities <ArrowUpRight size={16} />
          </Link>
        </section>
        <section className="mk-section mk-workspaces">
          <div className="mk-workspace-copy">
            <Eyebrow>One platform, different workspaces</Eyebrow>
            <h2>The right workspace for every responsibility.</h2>
            <p className="mk-body">
              Organization owners, site administrators, occupants and access
              teams work with different information. VMS Core separates those
              responsibilities through role-based workspaces.
            </p>
            <Link
              className="mk-inline-link"
              href="/platform/multi-site-management"
            >
              Explore the platform structure <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="mk-role-stack">
            <article>
              <span>01</span>
              <div>
                <b>Organization owner</b>
                <small>Portfolio structure and organization settings</small>
              </div>
              <Layers3 />
            </article>
            <article>
              <span>02</span>
              <div>
                <b>Site administrator</b>
                <small>Operations for their managed location</small>
              </div>
              <Building2 />
            </article>
            <article>
              <span>03</span>
              <div>
                <b>Occupant</b>
                <small>Records and actions relevant to their place</small>
              </div>
              <UsersRound />
            </article>
            <article>
              <span>04</span>
              <div>
                <b>Access team</b>
                <small>Checkpoint validation and passage activity</small>
              </div>
              <ShieldCheck />
            </article>
          </div>
        </section>
        <section className="mk-branding-section">
          <div className="mk-branding-copy">
            <Eyebrow>Your organization, your identity</Eyebrow>
            <h2>Make supported parts of the platform feel familiar.</h2>
            <p>
              Create organization branding themes with supported colors and
              image assets. Branding controls are available in the product;
              custom domains and every communication surface depend on current
              support.
            </p>
            <Link className="mk-inline-link" href="/platform/white-label">
              Explore organization branding <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="mk-branding-demo">
            <div className="mk-brand-card mk-brand-card-one">
              <div className="mk-brand-head">
                <span>H</span>
                <b>Harbour View</b>
                <small>Example theme</small>
              </div>
              <div className="mk-brand-body">
                <i />
                <i />
                <i />
              </div>
              <div className="mk-brand-colors">
                <span />
                <span />
                <span />
              </div>
            </div>
            <div className="mk-brand-card mk-brand-card-two">
              <div className="mk-brand-head">
                <span>P</span>
                <b>Palm Court</b>
                <small>Example theme</small>
              </div>
              <div className="mk-brand-body">
                <i />
                <i />
                <i />
              </div>
              <div className="mk-brand-colors">
                <span />
                <span />
                <span />
              </div>
            </div>
            <p>Illustrative examples · not customer brands</p>
          </div>
        </section>
        <section className="mk-future">
          <div>
            <span className="mk-pill">In development</span>
            <Eyebrow>Exploring more reliable on-site connectivity</Eyebrow>
            <h2>
              Bringing digital workflows closer to compatible access systems.
            </h2>
            <p>
              VMS Core is developing an edge-device approach intended to improve
              communication with compatible on-site access systems. This
              hardware is not currently available.
            </p>
          </div>
          <div className="mk-future-graphic">
            <div className="mk-gate">
              <span />
              <span />
              <span />
              <div className="mk-gate-arm" />
            </div>
            <div className="mk-edge-device">
              VMS
              <br />
              EDGE<small>IN DEVELOPMENT</small>
            </div>
            <div className="mk-dotted-link" />
          </div>
        </section>
        <section className="mk-deployment">
          <div>
            <span className="mk-pill">Planned</span>
            <Eyebrow>Future deployment flexibility</Eyebrow>
            <h2>More deployment choice is a future direction.</h2>
            <p>
              A self-hosted VMS Core edition is planned. It is not currently
              available, so deployment, hosting and data-governance requirements
              should be confirmed with the team before a decision.
            </p>
          </div>
          <div className="mk-deployment-note">
            <Network />
            <b>Self-hosted edition</b>
            <small>Planned · not currently available</small>
          </div>
        </section>
        <section className="mk-trust">
          <div>
            <Eyebrow>Product availability</Eyebrow>
            <h2>Know what is available today.</h2>
            <p>
              Evaluate VMS Core using the capabilities already present in the
              product and confirm provider-specific configuration for your
              setup.
            </p>
          </div>
          <div className="mk-trust-columns">
            <article>
              <span className="mk-state mk-state-available">Available</span>
              <b>Core operating workflows</b>
              <p>
                Organization and site structure, place and occupant records,
                visitor access, charges, maintenance, plugins and branding
                themes.
              </p>
            </article>
            <article>
              <span className="mk-state mk-state-config">
                Configuration dependent
              </span>
              <b>Providers and integrations</b>
              <p>
                Payment gateways and email delivery require provider
                configuration. Compatibility and channel availability vary by
                integration.
              </p>
            </article>
            <article>
              <span className="mk-state mk-state-planned">Planned</span>
              <b>Future deployment options</b>
              <p>
                The edge-device approach and self-hosted edition are not
                currently available.
              </p>
            </article>
          </div>
        </section>
        <section className="mk-section mk-onboarding">
          <div>
            <Eyebrow>How to get started</Eyebrow>
            <h2>From account to first operating site.</h2>
            <p className="mk-body">
              Start on the base domain, set up your organization, then add the
              first location and invite the people who operate it.
            </p>
          </div>
          <div className="mk-steps">
            {[
              [
                "01",
                "Create an account",
                "Register through the VMS Core base-domain flow.",
              ],
              [
                "02",
                "Set up your organization",
                "Name the organization and configure its identity.",
              ],
              [
                "03",
                "Add your first site",
                "Create an estate, building, hotel or other managed location.",
              ],
              [
                "04",
                "Configure operations",
                "Choose available modules and supported providers.",
              ],
              [
                "05",
                "Invite your people",
                "Give the relevant teams access based on their role.",
              ],
            ].map(([n, title, text]) => (
              <article key={n}>
                <span>{n}</span>
                <div>
                  <b>{title}</b>
                  <small>{text}</small>
                </div>
                <ArrowUpRight size={15} />
              </article>
            ))}
          </div>
        </section>
        <section className="mk-pricing-preview">
          <div>
            <Eyebrow>Pricing and plans</Eyebrow>
            <h2>Review current plans during organization setup.</h2>
            <p>
              Plan availability and included capabilities may vary. VMS Core
              shows the subscription options currently available in the
              organization setup flow.
            </p>
          </div>
          <CTA href="/pricing" secondary>
            See pricing information
          </CTA>
        </section>
        <section className="mk-section mk-home-faq">
          <div>
            <Eyebrow>Frequently asked questions</Eyebrow>
            <h2>Before you bring your operations together.</h2>
          </div>
          <div className="mk-home-faq-list">
            <details>
              <summary>
                What does VMS Core help property operators manage?
              </summary>
              <p>
                VMS Core connects organizations, sites, places and people with
                workflows for visitor access, charges, payments, maintenance and
                day-to-day operations.
              </p>
            </details>
            <details>
              <summary>
                Can one organization manage multiple properties?
              </summary>
              <p>
                Yes. An organization can represent multiple sites with distinct
                site workspaces and role-based access.
              </p>
            </details>
            <details>
              <summary>Can we use our own payment provider?</summary>
              <p>
                Organizations can configure a supported payment gateway. The
                provider processes transactions and settlement according to its
                agreement with your organization.
              </p>
            </details>
            <details>
              <summary>Can our team customize VMS Core branding?</summary>
              <p>
                Organization branding themes support color and image assets in
                the product. Custom domains and branding across every surface
                depend on current support.
              </p>
            </details>
            <details>
              <summary>
                Does VMS Core connect to access-control hardware?
              </summary>
              <p>
                Digital visitor and checkpoint workflows are available. Physical
                hardware compatibility depends on the device and supported
                integration; the proposed edge device is in development.
              </p>
            </details>
            <details>
              <summary>Is a self-hosted edition available?</summary>
              <p>No. Self-hosting is planned and is not currently available.</p>
            </details>
          </div>
        </section>
        <section className="mk-final-cta">
          <Eyebrow>Start with the organization you run</Eyebrow>
          <h2>Bring your property operations together.</h2>
          <p>
            Organize your sites, people and everyday workflows with VMS Core.
          </p>
          <div>
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
