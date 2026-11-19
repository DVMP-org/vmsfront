"use client";

import { useState } from "react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  BedDouble,
  Building2,
  CalendarDays,
  Check,
  CircleDollarSign,
  DoorOpen,
  Layers3,
  Mail,
  MessageSquareText,
  ShieldCheck,
  Store,
  UsersRound,
  Wrench,
} from "lucide-react";

type Props = { variant?: string; title?: string; interactive?: boolean };

const focusPoints: Record<string, [string, string][]> = {
  residential: [
    ["Places", "Units and shared spaces give each record a location."],
    ["People", "Occupants and responsible parties stay connected to places."],
    ["Operations", "Visitors, charges and maintenance use that site context."],
  ],
  commercial: [
    ["Space", "Organize offices, shops and shared building areas."],
    ["Tenants", "Connect business occupants and leases to their spaces."],
    ["Facilities", "Follow access, charges and maintenance at the site."],
  ],
  hospitality: [
    ["Inventory", "Maintain rooms and categories for the property."],
    ["Booking", "Connect reservations to room assignment workflows."],
    ["Stay", "Coordinate guests, housekeeping and service work."],
  ],
  "mixed-use": [
    ["Structure", "Represent distinct areas in one development."],
    ["Context", "Use the right workflow for each property domain."],
    ["Shared work", "Keep common facilities tied to their locations."],
  ],
  "estate-associations": [
    ["Community", "Keep occupants and unit relationships current."],
    ["Access", "Coordinate invitations and checkpoint activity."],
    ["Dues", "Connect charges and maintenance to the estate."],
  ],
  "multi-site-management": [
    ["Portfolio", "See the organization and its managed sites."],
    ["Site teams", "Each property has its own operating workspace."],
    ["Oversight", "Keep responsibility and permissions scoped correctly."],
  ],
  integrations: [
    ["Providers", "Review available payment and communication providers."],
    ["Configuration", "Connect the organization's supported accounts."],
    ["Boundary", "Confirm fees, credentials and supported flows."],
  ],
  "white-label": [
    ["Identity", "Apply organization branding in supported surfaces."],
    ["Theme", "Use colors and visual settings that fit the brand."],
    ["Experience", "Keep a recognizable experience across workspaces."],
  ],
  "connected-infrastructure": [
    ["Authorize", "Create a digital visitor authorization."],
    ["Validate", "Check the credential at a configured checkpoint."],
    ["Connect", "Physical hardware requires a supported integration."],
  ],
  "visitor-management": [
    ["Invite", "Record the visitor and host context."],
    ["Check", "Validate the pass under site policy."],
    ["Review", "Follow entry and exit events in movement history."],
  ],
  "estate-billing": [
    ["Define", "Set the charge and applicable schedule."],
    ["Assign", "Connect responsibility to a place or party."],
    ["Review", "Follow payment records and remaining balances."],
  ],
  "occupancy-management": [
    ["Place", "Start with an assignable unit, office or room."],
    ["Relationship", "Connect the person or business to that place."],
    ["Context", "Use that relationship in permitted workflows."],
  ],
  "maintenance-management": [
    ["Request", "Record the issue and affected location."],
    ["Assign", "Give the work an owner and status."],
    ["Resolve", "Keep progress and outcome in the request history."],
  ],
  "access-operations": [
    ["Policy", "Configure site checkpoints and operator roles."],
    ["Validate", "Check credentials against the site context."],
    ["History", "Review the recorded passage activity."],
  ],
  "property-hierarchy": [
    ["Organization", "Owns the managed portfolio."],
    ["Site", "Owns the property operations."],
    ["Place", "Represents a physical location within a site."],
  ],
  "visitor-flow": [
    ["Authorize", "Create the visit in its site context."],
    ["Check", "Validate at the checkpoint."],
    ["Record", "Retain the movement outcome for review."],
  ],
  "integration-readiness": [
    ["Fit", "Confirm a supported provider or controller."],
    ["Setup", "Prepare credentials and account configuration."],
    ["Terms", "Review transaction, fee and settlement behavior."],
  ],
  "product-overview": [
    ["Model", "Structure organizations, sites and places."],
    ["Operate", "Connect people, access, charges and service work."],
    ["Extend", "Configure supported providers and branding."],
  ],
};

function Label({ children }: { children: React.ReactNode }) {
  return <span className="mk-ill-label">{children}</span>;
}
function Node({
  icon: Icon,
  title,
  detail,
}: {
  icon: React.ElementType;
  title: string;
  detail: string;
}) {
  return (
    <div className="mk-ill-node">
      <span>
        <Icon size={17} />
      </span>
      <b>{title}</b>
      <small>{detail}</small>
    </div>
  );
}

export function MarketingPageIllustration({
  variant = "product-overview",
  title,
  interactive = true,
}: Props) {
  const [focus, setFocus] = useState(0);
  const points = focusPoints[variant] || focusPoints["product-overview"];
  const names: Record<string, string> = {
    residential: "Residential estate workflow illustration",
    commercial: "Commercial building and tenancy workflow illustration",
    hospitality: "Hospitality reservation and room workflow illustration",
    "mixed-use": "Mixed-use property illustration",
    "estate-associations": "Estate association operating model illustration",
    "multi-site-management": "Multi-site portfolio illustration",
    integrations: "VMS Core connected provider capabilities illustration",
    "white-label": "Organization branding theme examples illustration",
    "connected-infrastructure":
      "Digital access and compatible site infrastructure illustration",
    "visitor-management":
      "Visitor authorization and checkpoint workflow illustration",
    "estate-billing":
      "Charge assignment and configured payment provider workflow illustration",
    "occupancy-management": "Place and occupant relationship illustration",
    "maintenance-management":
      "Maintenance request and resolution workflow illustration",
    "access-operations": "Digital access and checkpoint workflow illustration",
    "property-hierarchy": "Property hierarchy guide illustration",
    "visitor-flow": "Visitor flow guide illustration",
    "integration-readiness": "Integration readiness guide illustration",
    "product-overview": "VMS Core property operations overview illustration",
  };
  const variantClass = `mk-ill-${variant}`;
  let diagram: React.ReactNode;
  switch (variant) {
    case "residential":
      diagram = (
        <>
          <div className="mk-ill-head">
            <Building2 />
            <div>
              <b>Residential site</b>
              <small>Site operations</small>
            </div>
            <Label>Example structure</Label>
          </div>
          <div className="mk-res-grid">
            {[
              "Unit A · occupant record",
              "Unit B · charge assignment",
              "Shared space · maintenance",
              "Gate · visitor checkpoint",
            ].map((item) => (
              <div key={item}>
                <DoorOpen />
                <span>{item}</span>
                <Check />
              </div>
            ))}
          </div>
          <div className="mk-ill-footer">
            <span>Places</span>
            <ArrowRight />
            <span>People</span>
            <ArrowRight />
            <span>Site workflows</span>
          </div>
        </>
      );
      break;
    case "commercial":
      diagram = (
        <>
          <div className="mk-ill-head">
            <Store />
            <div>
              <b>Commercial building</b>
              <small>Site workspace</small>
            </div>
            <Label>Illustrative</Label>
          </div>
          <div className="mk-commercial-plan">
            <div className="mk-floor-stack">
              {[
                "Level 03 · offices",
                "Level 02 · retail",
                "Level 01 · lobby",
              ].map((floor) => (
                <div key={floor}>
                  <span />
                  {floor}
                  <DoorOpen />
                </div>
              ))}
            </div>
            <div className="mk-commercial-ops">
              <Node
                icon={UsersRound}
                title="Business occupants"
                detail="Connected to places"
              />
              <Node
                icon={CalendarDays}
                title="Leases and charges"
                detail="Site records"
              />
              <Node
                icon={Wrench}
                title="Facility work"
                detail="Requests and follow-up"
              />
            </div>
          </div>
        </>
      );
      break;
    case "hospitality":
      diagram = (
        <>
          <div className="mk-ill-head">
            <BedDouble />
            <div>
              <b>Guest stay workflow</b>
              <small>Hospitality site</small>
            </div>
            <Label>Illustrative</Label>
          </div>
          <div className="mk-flow-three">
            <Node
              icon={CalendarDays}
              title="Reservation"
              detail="Request and dates"
            />
            <ArrowRight />
            <Node
              icon={DoorOpen}
              title="Room assignment"
              detail="Site inventory"
            />
            <ArrowRight />
            <Node
              icon={BadgeCheck}
              title="Guest stay"
              detail="Stay record and access"
            />
          </div>
          <div className="mk-ill-note">
            Room availability and operating policies remain specific to each
            property.
          </div>
        </>
      );
      break;
    case "mixed-use":
      diagram = (
        <>
          <div className="mk-ill-head">
            <Layers3 />
            <div>
              <b>One development</b>
              <small>Different site contexts</small>
            </div>
            <Label>Illustrative structure</Label>
          </div>
          <div className="mk-mixed-map">
            <div className="mk-mixed-center">
              <Building2 />
              <b>Shared development</b>
              <small>Organization context</small>
            </div>
            <div className="mk-mixed-branch">
              <div>
                <HomeIcon />
                <b>Residential</b>
                <small>Homes and occupants</small>
              </div>
              <div>
                <Store />
                <b>Commercial</b>
                <small>Businesses and spaces</small>
              </div>
              <div>
                <BedDouble />
                <b>Hospitality</b>
                <small>Rooms and stays</small>
              </div>
            </div>
          </div>
          <div className="mk-ill-note">
            Shared facilities and site operations stay linked to their location.
          </div>
        </>
      );
      break;
    case "estate-associations":
      diagram = (
        <>
          <div className="mk-ill-head">
            <UsersRound />
            <div>
              <b>Estate association</b>
              <small>People, places and shared responsibilities</small>
            </div>
            <Label>Illustrative</Label>
          </div>
          <div className="mk-association-web">
            <div className="mk-association-center">
              <Building2 />
              <b>Estate operations</b>
              <small>Site workspace</small>
            </div>
            <div className="mk-association-side">
              <Node
                icon={UsersRound}
                title="Occupant records"
                detail="People and places"
              />
              <Node
                icon={DoorOpen}
                title="Visitor activity"
                detail="Invitations and checkpoints"
              />
              <Node
                icon={CircleDollarSign}
                title="Estate charges"
                detail="Assignments and payment records"
              />
            </div>
          </div>
        </>
      );
      break;
    case "multi-site-management":
      diagram = (
        <>
          <div className="mk-ill-head">
            <Layers3 />
            <div>
              <b>Portfolio view</b>
              <small>One organization · distinct site workspaces</small>
            </div>
            <Label>Illustrative</Label>
          </div>
          <div className="mk-portfolio-sites">
            <article>
              <span className="mk-site-symbol mk-site-home">
                <Building2 />
              </span>
              <b>Residential estate</b>
              <small>Units · occupants · gate</small>
              <i>Site workspace</i>
            </article>
            <article>
              <span className="mk-site-symbol mk-site-office">
                <Store />
              </span>
              <b>Commercial property</b>
              <small>Tenants · leases · facilities</small>
              <i>Site workspace</i>
            </article>
            <article>
              <span className="mk-site-symbol mk-site-hotel">
                <BedDouble />
              </span>
              <b>Hospitality property</b>
              <small>Rooms · reservations · guests</small>
              <i>Site workspace</i>
            </article>
          </div>
          <div className="mk-ill-footer">
            <span>Shared organization administration</span>
            <ArrowDownRight />
            <span>Site-specific operations</span>
          </div>
        </>
      );
      break;
    case "integrations":
      diagram = (
        <>
          <div className="mk-ill-head">
            <Layers3 />
            <div>
              <b>VMS Core organization</b>
              <small>Configure supported connections</small>
            </div>
            <Label>Availability varies</Label>
          </div>
          <div className="mk-integrations-map">
            <div className="mk-integrations-core">
              <b>VMS Core</b>
              <small>Property workflows</small>
            </div>
            <div className="mk-integrations-list">
              <Node
                icon={CircleDollarSign}
                title="Payment gateway"
                detail="Configured provider account"
              />
              <Node
                icon={Mail}
                title="Email delivery"
                detail="Organization SMTP settings"
              />
              <Node
                icon={Layers3}
                title="Plugins"
                detail="Enabled capabilities"
              />
              <Node
                icon={ShieldCheck}
                title="Access systems"
                detail="Compatibility dependent"
              />
            </div>
          </div>
          <div className="mk-ill-note">
            Providers, channels and compatible hardware depend on current
            support and configuration.
          </div>
        </>
      );
      break;
    case "white-label":
      diagram = (
        <>
          <div className="mk-ill-head">
            <Layers3 />
            <div>
              <b>Organization branding</b>
              <small>Theme settings</small>
            </div>
            <Label>Example themes</Label>
          </div>
          <div className="mk-theme-examples">
            <article className="mk-theme-green">
              <div>
                <span>H</span>
                <b>Harbour View</b>
              </div>
              <strong>Site operations</strong>
              <i />
              <i />
              <i />
              <small>Logo · colors · favicon</small>
            </article>
            <article className="mk-theme-coral">
              <div>
                <span>P</span>
                <b>Palm Court</b>
              </div>
              <strong>Visitor workspace</strong>
              <i />
              <i />
              <i />
              <small>Logo · colors · favicon</small>
            </article>
          </div>
          <div className="mk-ill-note">
            Fictional theme examples. Custom domains and every branded surface
            depend on product support.
          </div>
        </>
      );
      break;
    case "connected-infrastructure":
      diagram = (
        <>
          <div className="mk-ill-head">
            <ShieldCheck />
            <div>
              <b>Digital access workflow</b>
              <small>Site checkpoints and movement records</small>
            </div>
            <Label>Hardware compatibility varies</Label>
          </div>
          <div className="mk-flow-three">
            <Node
              icon={BadgeCheck}
              title="Authorization"
              detail="Approved visitor pass"
            />
            <ArrowRight />
            <Node
              icon={ShieldCheck}
              title="Checkpoint"
              detail="Credential validation"
            />
            <ArrowRight />
            <Node
              icon={DoorOpen}
              title="Passage record"
              detail="Entry or exit activity"
            />
          </div>
          <div className="mk-edge-status">
            <span>Planned edge-device approach</span>
            <small>In development · not currently available</small>
          </div>
        </>
      );
      break;
    case "visitor-management":
    case "visitor-flow":
      diagram = (
        <>
          <div className="mk-ill-head">
            <DoorOpen />
            <div>
              <b>Visitor movement</b>
              <small>Authorization to site record</small>
            </div>
            <Label>Operational workflow</Label>
          </div>
          <div className="mk-flow-three">
            <Node
              icon={UsersRound}
              title="Host creates invite"
              detail="Visitor and visit context"
            />
            <ArrowRight />
            <Node
              icon={ShieldCheck}
              title="Checkpoint validates"
              detail="Site policy and credential"
            />
            <ArrowRight />
            <Node
              icon={Check}
              title="Movement recorded"
              detail="Passage history"
            />
          </div>
          <div className="mk-ill-note">
            Validation rules and checkpoint setup are configured for the site.
          </div>
        </>
      );
      break;
    case "estate-billing":
      diagram = (
        <>
          <div className="mk-ill-head">
            <CircleDollarSign />
            <div>
              <b>Charge and payment record</b>
              <small>Billing workflow</small>
            </div>
            <Label>Provider terms apply</Label>
          </div>
          <div className="mk-flow-three">
            <Node
              icon={Layers3}
              title="Define charge"
              detail="Schedule and assignment"
            />
            <ArrowRight />
            <Node
              icon={CircleDollarSign}
              title="Configured gateway"
              detail="Provider processes payment"
            />
            <ArrowRight />
            <Node
              icon={Check}
              title="Payment record"
              detail="Balance and transaction"
            />
          </div>
          <div className="mk-ill-note">
            Processing, fees and settlement follow the configured provider’s
            agreement.
          </div>
        </>
      );
      break;
    case "occupancy-management":
      diagram = (
        <>
          <div className="mk-ill-head">
            <UsersRound />
            <div>
              <b>Place and occupant relationships</b>
              <small>Property context</small>
            </div>
            <Label>Illustrative</Label>
          </div>
          <div className="mk-occupancy-grid">
            <div>
              <Building2 />
              <b>Site</b>
              <small>Managed location</small>
            </div>
            <ArrowDownRight />
            <div>
              <DoorOpen />
              <b>Place</b>
              <small>Unit · office · room</small>
            </div>
            <ArrowRight />
            <div>
              <UsersRound />
              <b>People</b>
              <small>Roles and relationships</small>
            </div>
          </div>
          <div className="mk-ill-note">
            A person’s workspace reflects their active relationship and
            permissions.
          </div>
        </>
      );
      break;
    case "maintenance-management":
      diagram = (
        <>
          <div className="mk-ill-head">
            <Wrench />
            <div>
              <b>Maintenance request</b>
              <small>Site and place context</small>
            </div>
            <Label>Operating workflow</Label>
          </div>
          <div className="mk-maintenance-board">
            <article>
              <small>REQUEST</small>
              <b>Water supply issue</b>
              <span>Place: Block B · Unit 4</span>
            </article>
            <ArrowRight />
            <article>
              <small>ASSIGNED</small>
              <b>Site maintenance team</b>
              <span>Priority and due dates</span>
            </article>
            <ArrowRight />
            <article>
              <small>RESOLVED</small>
              <b>Work updated</b>
              <span>Request history retained</span>
            </article>
          </div>
          <div className="mk-ill-note">
            Example request only; no live customer record or service metric.
          </div>
        </>
      );
      break;
    case "access-operations":
      diagram = (
        <>
          <div className="mk-ill-head">
            <ShieldCheck />
            <div>
              <b>Checkpoint operations</b>
              <small>Authorized movement at a site</small>
            </div>
            <Label>Digital workflow</Label>
          </div>
          <div className="mk-access-diagram">
            <div className="mk-access-pass">
              <BadgeCheck />
              <b>Visitor pass</b>
              <small>Credential and visit details</small>
            </div>
            <div className="mk-access-gate">
              <span />
              <span />
              <span />
              <i />
            </div>
            <div className="mk-access-log">
              <Check />
              <b>Passage event</b>
              <small>Checkpoint activity</small>
            </div>
          </div>
          <div className="mk-ill-note">
            Physical barrier control requires a compatible, supported
            integration.
          </div>
        </>
      );
      break;
    case "property-hierarchy":
      diagram = (
        <>
          <div className="mk-ill-head">
            <Building2 />
            <div>
              <b>From portfolio to place</b>
              <small>A practical property model</small>
            </div>
            <Label>Guide illustration</Label>
          </div>
          <div className="mk-guide-hierarchy">
            <span>Organization</span>
            <ArrowDownRight />
            <div>
              <span>Site A</span>
              <span>Site B</span>
            </div>
            <ArrowDownRight />
            <div>
              <span>Places</span>
              <span>People and teams</span>
            </div>
          </div>
        </>
      );
      break;
    case "integration-readiness":
      diagram = (
        <>
          <div className="mk-ill-head">
            <Layers3 />
            <div>
              <b>Integration readiness</b>
              <small>Questions before connecting a provider</small>
            </div>
            <Label>Guide illustration</Label>
          </div>
          <div className="mk-readiness-list">
            <span>
              <Check />
              Provider supported?
            </span>
            <span>
              <Check />
              Credentials and account ready?
            </span>
            <span>
              <Check />
              Webhook and transaction flow understood?
            </span>
            <span>
              <Check />
              Fees and settlement confirmed?
            </span>
          </div>
        </>
      );
      break;
    default:
      diagram = (
        <>
          <div className="mk-ill-head">
            <Layers3 />
            <div>
              <b>Property operations</b>
              <small>One connected working context</small>
            </div>
            <Label>Product overview</Label>
          </div>
          <div className="mk-product-map">
            <Node
              icon={Building2}
              title="Sites and places"
              detail="Property structure"
            />
            <Node
              icon={UsersRound}
              title="People and roles"
              detail="Occupancy and permissions"
            />
            <Node
              icon={DoorOpen}
              title="Access"
              detail="Invitations and checkpoints"
            />
            <Node
              icon={CircleDollarSign}
              title="Charges"
              detail="Assignments and payments"
            />
            <Node
              icon={Wrench}
              title="Operations"
              detail="Maintenance and follow-up"
            />
          </div>
          <div className="mk-ill-note">
            {title || "A property operating platform"}
          </div>
        </>
      );
  }

  return (
    <figure
      className={`mk-illustration ${variantClass}`}
      aria-label={names[variant] || "VMS Core property operations illustration"}
    >
      <div className="mk-ill-chrome" aria-hidden="true">
        <span />
        <span />
        <span />
        <i>VMS CORE / OPERATING MODEL</i>
      </div>
      <div className="mk-ill-scene" data-focus={focus} aria-hidden="true">
        {diagram}
      </div>
      {interactive && (
        <figcaption className="mk-ill-interaction">
          <div
            className="mk-ill-tabs"
            role="group"
            aria-label="Explore illustration layers"
          >
            {points.map(([label], index) => (
              <button
                type="button"
                key={label}
                className={index === focus ? "is-active" : ""}
                aria-pressed={index === focus}
                onClick={() => setFocus(index)}
              >
                <span>0{index + 1}</span>
                {label}
              </button>
            ))}
          </div>
          <p key={focus} className="mk-ill-focus-copy">
            <b>{points[focus][0]}</b>
            {points[focus][1]}
          </p>
        </figcaption>
      )}
    </figure>
  );
}

function HomeIcon() {
  return <Building2 />;
}
