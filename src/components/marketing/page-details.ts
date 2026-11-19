export type Capability = { title: string; description: string };
export type WorkflowStep = { step: string; title: string; description: string };
export type MarketingEnrichment = {
  illustration: string;
  overviewHeading: string;
  overview: string;
  capabilities: Capability[];
  workflow: WorkflowStep[];
  scenario: string;
  related: { label: string; href: string }[];
};

export const solutionDetails: Record<string, MarketingEnrichment> = {
  residential: {
    illustration: "residential",
    overviewHeading: "From unit records to gate activity",
    overview:
      "Residential teams need a reliable view of places, who is connected to them, what is due and what is happening at the gate. VMS Core keeps these workflows associated with the same site and place model.",
    capabilities: [
      {
        title: "Units and occupancy",
        description:
          "Represent units and shared spaces, then connect occupants and responsible parties to the places they use.",
      },
      {
        title: "Visitor invitations",
        description:
          "Create visit authorizations and review checkpoint activity and movement history in the site context.",
      },
      {
        title: "Estate charges",
        description:
          "Define recurring or one-off dues, assign responsibility and review payment records and balances.",
      },
      {
        title: "Maintenance and notices",
        description:
          "Keep maintenance requests and community announcements attached to the estate workspace.",
      },
    ],
    workflow: [
      {
        step: "01",
        title: "Set up the estate",
        description:
          "Create the site and represent its units, gates and shared places.",
      },
      {
        step: "02",
        title: "Connect people",
        description:
          "Maintain occupancy and responsibility relationships for each place.",
      },
      {
        step: "03",
        title: "Run daily operations",
        description:
          "Coordinate invitations, charges, maintenance and site updates.",
      },
    ],
    scenario:
      "Example: an estate administrator needs to confirm who is associated with a unit, check a visitor’s authorization at the gate and review an outstanding service charge. Each task starts from the same estate context, while access still follows the user’s role.",
    related: [
      { label: "Visitor management", href: "/features/visitor-management" },
      { label: "Estate billing", href: "/features/estate-billing" },
      { label: "Estate associations", href: "/solutions/estate-associations" },
    ],
  },
  commercial: {
    illustration: "commercial",
    overviewHeading: "Spaces, tenants and facility work in one site context",
    overview:
      "Commercial operators coordinate businesses, assignable spaces, leases and shared building operations. VMS Core connects those records to the site and the teams responsible for the property.",
    capabilities: [
      {
        title: "Business occupants and spaces",
        description:
          "Keep companies and other occupants connected to offices, shops and managed places.",
      },
      {
        title: "Leases and charges",
        description:
          "Track lease workflows and assign service or other charges to the appropriate place and responsible party.",
      },
      {
        title: "Visitor access",
        description:
          "Coordinate visit authorizations and review checkpoint activity for the commercial site.",
      },
      {
        title: "Facilities and maintenance",
        description:
          "Keep maintenance requests and facility operations associated with their building context.",
      },
    ],
    workflow: [
      {
        step: "01",
        title: "Structure the property",
        description:
          "Represent the building, floors or other places used by businesses.",
      },
      {
        step: "02",
        title: "Maintain tenant context",
        description:
          "Connect occupants and lease or charge responsibilities to places.",
      },
      {
        step: "03",
        title: "Coordinate building operations",
        description:
          "Follow access activity and service work with the site team.",
      },
    ],
    scenario:
      "Example: a property manager reviewing a tenant’s lease obligations can move from the business occupant to its assigned place and charge records, while a facilities team follows a separate maintenance request at the same site.",
    related: [
      { label: "Occupancy management", href: "/features/occupancy-management" },
      { label: "Property charges", href: "/features/estate-billing" },
      {
        label: "Multi-site management",
        href: "/platform/multi-site-management",
      },
    ],
  },
  hospitality: {
    illustration: "hospitality",
    overviewHeading: "Room inventory and guest workflows",
    overview:
      "Hospitality operations depend on room context and the timing of each stay. VMS Core includes room and room-category management, reservation and booking workflows, guest records, housekeeping and maintenance operations.",
    capabilities: [
      {
        title: "Rooms and categories",
        description:
          "Organize room inventory and categories within the hospitality site.",
      },
      {
        title: "Reservations and bookings",
        description:
          "Work with reservation and booking records and assign rooms through the supported workflow.",
      },
      {
        title: "Guest stays",
        description:
          "Keep guest and stay context associated with the booking and site.",
      },
      {
        title: "Housekeeping and maintenance",
        description:
          "Coordinate room readiness and service work through hospitality operations pages.",
      },
    ],
    workflow: [
      {
        step: "01",
        title: "Maintain room inventory",
        description: "Set up rooms and categories for the site.",
      },
      {
        step: "02",
        title: "Review a reservation",
        description:
          "Work through the supported reservation and booking steps.",
      },
      {
        step: "03",
        title: "Coordinate the stay",
        description:
          "Manage the assigned room, guest stay, housekeeping and maintenance context.",
      },
    ],
    scenario:
      "Example: a front-desk operator reviews a reservation, assigns an available room using the product workflow and coordinates the guest stay with the housekeeping team. Availability and booking policies remain property-specific.",
    related: [
      { label: "Hospitality workflows", href: "/use-cases" },
      { label: "Bookings and reservations", href: "/solutions/hospitality" },
      {
        label: "Connected infrastructure",
        href: "/platform/connected-infrastructure",
      },
    ],
  },
  "mixed-use": {
    illustration: "mixed-use",
    overviewHeading: "Different property types, connected operations",
    overview:
      "A mixed-use development can contain residential, commercial and hospitality activity. VMS Core lets an organization represent its sites and places while using domain-aware workflows at each location.",
    capabilities: [
      {
        title: "Varied place types",
        description:
          "Represent homes, offices, shops, rooms and shared spaces in the property structure.",
      },
      {
        title: "Occupants and responsibilities",
        description:
          "Keep people and businesses connected to their respective places and operating context.",
      },
      {
        title: "Shared access and charges",
        description:
          "Use access and charge workflows across the organization while keeping records scoped to their site.",
      },
      {
        title: "Facilities and maintenance",
        description:
          "Coordinate shared facility and maintenance work with the location that owns the request.",
      },
    ],
    workflow: [
      {
        step: "01",
        title: "Model the development",
        description:
          "Create an organization and define the constituent site and place structure.",
      },
      {
        step: "02",
        title: "Choose the site context",
        description:
          "Use the workspace and domain workflow appropriate to each property area.",
      },
      {
        step: "03",
        title: "Coordinate shared operations",
        description:
          "Keep facilities, access and charge activity connected to the responsible location.",
      },
    ],
    scenario:
      "Example: a mixed-use operator oversees apartments, retail units and serviced rooms. Site teams work in their domain context, while organization administrators retain a portfolio-level view of the structure.",
    related: [
      {
        label: "Multi-site management",
        href: "/platform/multi-site-management",
      },
      { label: "Occupancy records", href: "/features/occupancy-management" },
      { label: "Maintenance", href: "/features/maintenance-management" },
    ],
  },
  "estate-associations": {
    illustration: "estate-associations",
    overviewHeading: "Make shared responsibilities easier to follow",
    overview:
      "Estate associations often coordinate resident records, visitor access, dues and maintenance across elected leaders, facility staff and security teams. VMS Core provides a shared site context for those operating records.",
    capabilities: [
      {
        title: "People and place records",
        description:
          "Keep occupant relationships connected to units and other estate places.",
      },
      {
        title: "Dues and service charges",
        description:
          "Define charges, assign responsibility and review balances and payment records.",
      },
      {
        title: "Gate operations",
        description:
          "Connect visitor invitations with checkpoint validation and movement history.",
      },
      {
        title: "Maintenance follow-up",
        description:
          "Give estate teams a record for requests, assignments and resolution.",
      },
    ],
    workflow: [
      {
        step: "01",
        title: "Set up the community",
        description: "Create the estate site and its places.",
      },
      {
        step: "02",
        title: "Keep responsibilities current",
        description: "Connect occupants and charge responsibilities to places.",
      },
      {
        step: "03",
        title: "Coordinate shared services",
        description:
          "Follow visitor access and maintenance in the estate workspace.",
      },
    ],
    scenario:
      "Example: an estate office checks an occupant’s place relationship, reviews a due charge and follows a maintenance request. Security staff use checkpoint workflows according to their granted responsibilities.",
    related: [
      { label: "Residential estates", href: "/solutions/residential" },
      { label: "Visitor management", href: "/features/visitor-management" },
      { label: "Charges and payments", href: "/features/estate-billing" },
    ],
  },
};

export const platformDetails: Record<string, MarketingEnrichment> = {
  "multi-site-management": {
    illustration: "multi-site-management",
    overviewHeading: "A portfolio view without flattening each property",
    overview:
      "Organization administrators manage the portfolio structure. Site teams use workspaces scoped to their location and responsibilities, so operational records stay attached to the site where they belong.",
    capabilities: [
      {
        title: "Organization-level structure",
        description:
          "Group managed locations under one organization and maintain their parent-child relationships.",
      },
      {
        title: "Site-specific workspaces",
        description:
          "Give local teams an operating context for their site rather than a single generic property list.",
      },
      {
        title: "Place hierarchy",
        description:
          "Represent apartments, rooms, offices and other assignable places under the appropriate site.",
      },
      {
        title: "Role-scoped access",
        description:
          "Provide workspaces based on a person’s role and active site or place relationship.",
      },
    ],
    workflow: [
      {
        step: "01",
        title: "Create the organization",
        description: "Set the portfolio owner and shared organization context.",
      },
      {
        step: "02",
        title: "Add sites and places",
        description: "Represent managed properties and the spaces within them.",
      },
      {
        step: "03",
        title: "Assign teams",
        description:
          "Give administrators and site teams access for their responsibilities.",
      },
    ],
    scenario:
      "Example: a property manager operates a residential estate in Lagos and an office property in Abuja. Each site keeps its own place records and local workflows, while organization administrators can manage both locations through one organization.",
    related: [
      { label: "Residential solution", href: "/solutions/residential" },
      { label: "Commercial solution", href: "/solutions/commercial" },
      {
        label: "Organization and site model",
        href: "/resources/guides/property-hierarchy",
      },
    ],
  },
  integrations: {
    illustration: "integrations",
    overviewHeading: "Connect providers with a clear view of what is supported",
    overview:
      "The product exposes settings for payment gateways, email delivery and plugins. A provider’s presence in the settings model does not guarantee that every organization has configured it or that every external service is available.",
    capabilities: [
      {
        title: "Payment gateway settings",
        description:
          "Configure supported provider credentials and settings for transaction processing.",
      },
      {
        title: "Email delivery",
        description: "Configure SMTP delivery settings for operational email.",
      },
      {
        title: "Plugins",
        description:
          "Enable available plugins and configure their supported capabilities.",
      },
      {
        title: "Access and building services",
        description:
          "Assess compatibility for a specific device or provider; broad hardware and utility coverage is not assumed.",
      },
    ],
    workflow: [
      {
        step: "01",
        title: "Name the operational need",
        description:
          "Identify the payment, communication or site service the workflow depends on.",
      },
      {
        step: "02",
        title: "Confirm product support",
        description:
          "Check that the required provider and connection are supported for your setup.",
      },
      {
        step: "03",
        title: "Configure and validate",
        description:
          "Add the provider settings and confirm the expected processing or delivery path.",
      },
    ],
    scenario:
      "Example: before enabling online service-charge payments, an organization confirms that its preferred gateway is supported, configures its provider account and understands the provider’s processing, fees and settlement terms.",
    related: [
      { label: "Billing and payments", href: "/features/estate-billing" },
      {
        label: "Access infrastructure",
        href: "/platform/connected-infrastructure",
      },
      {
        label: "Integration readiness guide",
        href: "/resources/guides/integration-readiness",
      },
    ],
  },
  "white-label": {
    illustration: "white-label",
    overviewHeading: "Branding settings for the organization",
    overview:
      "VMS Core includes branding themes that can set organization identity elements such as colors and image assets. This helps teams make supported application surfaces more recognizable without implying a custom domain or that every email and visitor page is branded.",
    capabilities: [
      {
        title: "Theme management",
        description:
          "Create, update, activate and remove organization branding themes.",
      },
      {
        title: "Color settings",
        description:
          "Set primary and secondary colors for supported application surfaces.",
      },
      {
        title: "Brand assets",
        description: "Configure logo, dark logo and favicon assets.",
      },
      {
        title: "Applied appearance",
        description:
          "Activate a theme and apply it to the VMS Core application experience where supported.",
      },
    ],
    workflow: [
      {
        step: "01",
        title: "Create a theme",
        description:
          "Name the organization theme and set its supported colors.",
      },
      {
        step: "02",
        title: "Add identity assets",
        description: "Configure logo and favicon files for the workspace.",
      },
      {
        step: "03",
        title: "Activate and review",
        description:
          "Apply the theme and confirm the supported product surfaces.",
      },
    ],
    scenario:
      "Example: a property operator creates one theme for its organization, uses its logo and colors in supported workspaces, and checks which resident-facing or communication surfaces inherit those settings before rollout.",
    related: [
      {
        label: "Multi-site management",
        href: "/platform/multi-site-management",
      },
      { label: "Integration settings", href: "/platform/integrations" },
      { label: "Contact the team", href: "/contact" },
    ],
  },
  "connected-infrastructure": {
    illustration: "connected-infrastructure",
    overviewHeading:
      "Digital access records, with hardware compatibility stated plainly",
    overview:
      "VMS Core provides visitor authorization and checkpoint operations in software. A physical gate, barrier or controller only joins that workflow when a compatible, supported integration is available.",
    capabilities: [
      {
        title: "Visitor authorizations",
        description:
          "Manage the digital record of who is authorized to visit a site.",
      },
      {
        title: "Checkpoint validation",
        description:
          "Validate credentials against site checkpoint policies and record activity.",
      },
      {
        title: "Movement history",
        description:
          "Review entry, exit and checkpoint events in the site context.",
      },
      {
        title: "On-site edge device",
        description:
          "An edge-device approach is in development and is not available for deployment today.",
      },
    ],
    workflow: [
      {
        step: "01",
        title: "Create the authorization",
        description:
          "A host or operator records the visit in the site workflow.",
      },
      {
        step: "02",
        title: "Validate at a checkpoint",
        description:
          "An authorized operator checks the credential against the site policy.",
      },
      {
        step: "03",
        title: "Review the movement record",
        description:
          "The passage outcome is available in the site’s operational history.",
      },
    ],
    scenario:
      "Example: an estate is reviewing how its visitor invitation process could work with an existing gate. The digital authorization and checkpoint workflow can be evaluated today; barrier automation depends on confirming a supported controller connection.",
    related: [
      { label: "Visitor management", href: "/features/visitor-management" },
      { label: "Access operations", href: "/features/access-operations" },
      {
        label: "Integration readiness",
        href: "/resources/guides/integration-readiness",
      },
    ],
  },
};

export const featureDetails: Record<string, MarketingEnrichment> = {
  "visitor-management": {
    illustration: "visitor-management",
    overviewHeading: "An authorization can lead to a recorded checkpoint event",
    overview:
      "Visitor management connects the visit authorization to the site checkpoints where credentials are validated. Teams can review passage activity and movement history after the visit.",
    capabilities: [
      {
        title: "Visit authorizations",
        description:
          "Create and manage the record that identifies a visit and its authorization context.",
      },
      {
        title: "Checkpoint validation",
        description:
          "Allow authorized checkpoint operators to validate credentials according to site policies.",
      },
      {
        title: "Passage records",
        description:
          "Record entry and exit events for the relevant site and checkpoint.",
      },
      {
        title: "Movement history",
        description:
          "Review activity with the visit, site and checkpoint context together.",
      },
    ],
    workflow: [
      {
        step: "01",
        title: "Authorize the visit",
        description:
          "Create a visit record for the relevant site and host context.",
      },
      {
        step: "02",
        title: "Validate the credential",
        description:
          "A checkpoint operator reviews the credential under the site policy.",
      },
      {
        step: "03",
        title: "Review the passage",
        description: "Entry or exit activity appears in the movement record.",
      },
    ],
    scenario:
      "Example: a resident creates an invitation for a guest, then the gate operator validates the pass at the configured checkpoint and records the visitor’s arrival. The workflow maintains the authorization and passage history together.",
    related: [
      { label: "Access operations", href: "/features/access-operations" },
      { label: "Residential solution", href: "/solutions/residential" },
      { label: "Visitor flow guide", href: "/resources/guides/visitor-flow" },
    ],
  },
  "estate-billing": {
    illustration: "estate-billing",
    overviewHeading:
      "Define a charge, assign responsibility, follow the payment record",
    overview:
      "The charge workflow connects charge definitions and schedules with places, responsible parties and payment records. A configured payment gateway handles transaction processing and settlement under its agreement with the organization.",
    capabilities: [
      {
        title: "Charge definitions",
        description:
          "Set up the charge type and amount for the operating context.",
      },
      {
        title: "Place assignments",
        description:
          "Assign a charge to a place and record who is responsible for it.",
      },
      {
        title: "Schedules and balances",
        description:
          "Review scheduled charges, payments and remaining balances.",
      },
      {
        title: "Provider processing",
        description:
          "Use a supported configured gateway; its fees and settlement terms apply.",
      },
    ],
    workflow: [
      {
        step: "01",
        title: "Define the charge",
        description:
          "Set the amount, frequency and applicable property context.",
      },
      {
        step: "02",
        title: "Assign responsibility",
        description:
          "Connect the charge to the appropriate place and responsible party.",
      },
      {
        step: "03",
        title: "Review payment activity",
        description:
          "Use payment records to follow what has been paid and what remains due.",
      },
    ],
    scenario:
      "Example: a property manager defines a quarterly service charge, assigns it to the applicable places and reviews the resulting payment records. Transaction handling and settlement remain with the configured provider under its terms.",
    related: [
      {
        label: "Residential estate operations",
        href: "/solutions/residential",
      },
      {
        label: "Integration readiness guide",
        href: "/resources/guides/integration-readiness",
      },
      {
        label: "Payment provider integrations",
        href: "/platform/integrations",
      },
    ],
  },
  "occupancy-management": {
    illustration: "occupancy-management",
    overviewHeading: "Keep the relationship between a person and a place clear",
    overview:
      "Property operations depend on knowing which people or businesses are connected to a unit, office or room, and what responsibilities or workspace follow from that relationship.",
    capabilities: [
      {
        title: "Places",
        description:
          "Represent the apartments, offices, shops, rooms and assignable spaces in a managed site.",
      },
      {
        title: "Occupant relationships",
        description:
          "Connect people and businesses to the relevant place and relationship type.",
      },
      {
        title: "Responsible parties",
        description:
          "Maintain the party responsible for an operational or charge record where applicable.",
      },
      {
        title: "Role-based workspaces",
        description:
          "Give users access to the information and actions permitted by their role.",
      },
    ],
    workflow: [
      {
        step: "01",
        title: "Create the place",
        description: "Add the unit, office or room under the correct site.",
      },
      {
        step: "02",
        title: "Connect the occupant",
        description:
          "Record the person or business and its relationship to the place.",
      },
      {
        step: "03",
        title: "Use that context",
        description:
          "Support relevant access, billing and operational records with the place relationship.",
      },
    ],
    scenario:
      "Example: when a tenant changes, the site team can update the relationship for the place and review the operational records tied to that context, subject to the available workflow and permissions.",
    related: [
      {
        label: "Commercial property operations",
        href: "/solutions/commercial",
      },
      {
        label: "Multi-site management",
        href: "/platform/multi-site-management",
      },
      { label: "Estate associations", href: "/solutions/estate-associations" },
    ],
  },
  "maintenance-management": {
    illustration: "maintenance-management",
    overviewHeading:
      "Give each maintenance request a traceable operating context",
    overview:
      "A maintenance request is easier to coordinate when the affected site or place, the assigned team and the latest status stay with the record. VMS Core gives teams a shared request workflow for follow-up.",
    capabilities: [
      {
        title: "Request intake",
        description:
          "Record maintenance issues against the relevant site context.",
      },
      {
        title: "Assignment and status",
        description:
          "Coordinate work ownership and move requests through their available status flow.",
      },
      {
        title: "Place context",
        description:
          "Keep the affected place and related operational information close to the request.",
      },
      {
        title: "Follow-up history",
        description:
          "Review request changes and outcomes in the maintenance workspace.",
      },
    ],
    workflow: [
      {
        step: "01",
        title: "Record the issue",
        description:
          "Capture the request and the property context where it occurred.",
      },
      {
        step: "02",
        title: "Coordinate the work",
        description: "Assign responsibility and keep the status current.",
      },
      {
        step: "03",
        title: "Close the loop",
        description:
          "Record progress and resolution so the team can follow the outcome.",
      },
    ],
    scenario:
      "Example: an occupant reports a leaking tap in a unit. The site team records the request, assigns follow-up and updates the request status so the resident and operations team can refer to the same issue.",
    related: [
      { label: "Residential maintenance", href: "/solutions/residential" },
      { label: "Commercial facilities", href: "/solutions/commercial" },
      { label: "Mixed-use operations", href: "/solutions/mixed-use" },
    ],
  },
  "access-operations": {
    illustration: "access-operations",
    overviewHeading:
      "Digital checkpoint workflows with a clear integration boundary",
    overview:
      "VMS Core provides software workflows for visit authorization, checkpoint validation and movement history. Physical barriers and controllers require a compatible, supported integration and are not implied by the digital workflow.",
    capabilities: [
      {
        title: "Checkpoint setup",
        description:
          "Configure checkpoints and site policies for the operating team.",
      },
      {
        title: "Credential validation",
        description:
          "Validate visit credentials against the applicable site context.",
      },
      {
        title: "Passage history",
        description: "Record entry, exit and checkpoint activity for review.",
      },
      {
        title: "Physical access",
        description:
          "Confirm compatibility with a supported controller before expecting hardware actions.",
      },
    ],
    workflow: [
      {
        step: "01",
        title: "Set the checkpoint policy",
        description:
          "Configure the checkpoint and the responsibilities of its operators.",
      },
      {
        step: "02",
        title: "Validate the pass",
        description: "Check the credential using the site workflow.",
      },
      {
        step: "03",
        title: "Retain passage activity",
        description: "Review the access event in the movement record.",
      },
    ],
    scenario:
      "Example: a gate operator validates a visitor pass and records the arrival. If the estate also expects a barrier to open automatically, confirm that the installed controller has a supported integration.",
    related: [
      { label: "Visitor management", href: "/features/visitor-management" },
      {
        label: "Connected infrastructure",
        href: "/platform/connected-infrastructure",
      },
      {
        label: "Integration readiness",
        href: "/resources/guides/integration-readiness",
      },
    ],
  },
};

export function enrichPage<T>(
  base: T,
  details: Record<string, MarketingEnrichment>,
  slug: string,
): T & MarketingEnrichment {
  return { ...base, ...details[slug] } as T & MarketingEnrichment;
}
