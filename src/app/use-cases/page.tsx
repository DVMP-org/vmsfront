import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { Eyebrow, MarketingFrame } from "@/components/marketing/MarketingFrame";
import { MarketingPageIllustration } from "@/components/marketing/MarketingPageIllustration";

export const metadata: Metadata = {
  title: "Property Operations Use Cases | VMS Core",
  description:
    "Explore how estate associations, property managers, commercial operators and hospitality teams use VMS Core workflows.",
  alternates: { canonical: "/use-cases/" },
  openGraph: {
    title: "VMS Core Property Operations Use Cases",
    description: "Explore property workflows by organization and site type.",
    url: "/use-cases/",
    type: "website",
  },
};

const cases = [
  {
    label: "Estate associations",
    title: "Coordinate the shared work of a residential community.",
    detail:
      "Connect unit and occupant records with visitor invitations, checkpoint activity, estate charges, maintenance and community notices.",
    context:
      "A committee and facility team need a current view of place responsibilities and outstanding operational work, while checkpoint staff need a focused access workflow.",
    illustration: "estate-associations",
    href: "/solutions/estate-associations",
    capabilities: [
      "Occupancy records",
      "Visitor access",
      "Dues and charges",
      "Maintenance",
    ],
  },
  {
    label: "Property management companies",
    title: "Keep a growing portfolio in one organization.",
    detail:
      "Manage several estates, buildings or facilities while preserving their local teams, place structures and operating requirements.",
    context:
      "A portfolio manager oversees different properties across cities and needs organization-level structure with site-specific workspaces.",
    illustration: "multi-site-management",
    href: "/platform/multi-site-management",
    capabilities: [
      "Multiple sites",
      "Role-based access",
      "Distinct workspaces",
      "Property hierarchy",
    ],
  },
  {
    label: "Commercial operators",
    title: "Connect tenants, spaces and building operations.",
    detail:
      "Maintain business occupant and place context alongside lease and charge workflows, visitor access and facility maintenance.",
    context:
      "A commercial property team coordinates tenant spaces and shared building services, with operational records attached to the responsible site.",
    illustration: "commercial",
    href: "/solutions/commercial",
    capabilities: [
      "Business occupants",
      "Leases and charges",
      "Visitor records",
      "Facility work",
    ],
  },
  {
    label: "Hospitality teams",
    title: "Coordinate room inventory and guest stays.",
    detail:
      "Use room and category management alongside supported reservation, booking, guest-stay, housekeeping and maintenance workflows.",
    context:
      "A hospitality operator needs room assignments and guest context to stay connected as teams prepare rooms and coordinate a stay.",
    illustration: "hospitality",
    href: "/solutions/hospitality",
    capabilities: [
      "Rooms and categories",
      "Reservations",
      "Guest stays",
      "Housekeeping",
    ],
  },
  {
    label: "Mixed-use developments",
    title: "Keep different property uses connected.",
    detail:
      "Represent residential, commercial and hospitality spaces in a shared organization while retaining the operating context of each site.",
    context:
      "A development combines homes, retail, offices and guest rooms. Local teams work in the workflows relevant to their spaces while administrators manage the wider structure.",
    illustration: "mixed-use",
    href: "/solutions/mixed-use",
    capabilities: [
      "Different place types",
      "Site-specific workflows",
      "Shared facilities",
      "Portfolio structure",
    ],
  },
];

export default function UseCasesPage() {
  return (
    <MarketingFrame>
      <main className="mk-use-cases">
        <section className="mk-use-cases-hero">
          <Eyebrow>Use cases</Eyebrow>
          <h1>Property operations shaped around the work you do.</h1>
          <p className="mk-lead">
            Explore practical workflows for communities, property portfolios,
            commercial buildings, hospitality sites and mixed-use developments.
          </p>
        </section>
        <div className="mk-use-case-list">
          {cases.map((item, index) => (
            <article
              key={item.label}
              className={index % 2 ? "mk-use-case-reverse" : ""}
            >
              <div className="mk-use-case-copy">
                <Eyebrow>{item.label}</Eyebrow>
                <h2>{item.title}</h2>
                <p>{item.detail}</p>
                <div className="mk-use-case-chips">
                  {item.capabilities.map((capability) => (
                    <span key={capability}>{capability}</span>
                  ))}
                </div>
                <div className="mk-use-case-example">
                  <b>Example operating scenario</b>
                  <p>{item.context}</p>
                </div>
                <Link href={item.href}>
                  Explore this workflow <ArrowUpRight size={15} />
                </Link>
              </div>
              <MarketingPageIllustration
                variant={item.illustration}
                title={`${item.label} use case`}
              />
            </article>
          ))}
        </div>
        <section className="mk-guide-cta">
          <div>
            <Eyebrow>Need a portfolio conversation?</Eyebrow>
            <h2>Talk through your sites and operating requirements.</h2>
            <p>
              Share your property types, teams and integration needs with the
              VMS Core team.
            </p>
          </div>
          <div className="mk-hero-actions">
            <Link className="mk-button mk-button-dark" href="/contact">
              Talk to our team <ArrowUpRight size={15} />
            </Link>
            <Link className="mk-button mk-button-light" href="/auth/register">
              Get started <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      </main>
    </MarketingFrame>
  );
}
