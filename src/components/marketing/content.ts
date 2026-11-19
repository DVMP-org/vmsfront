export type MarketingContent = {
  title: string;
  description: string;
  eyebrow: string;
  heading: string;
  intro: string;
  points: string[];
  sectionHeading: string;
  sectionText: string;
  status?: string;
};

export const solutions: Record<string, MarketingContent> = {
  residential: {
    title: "Residential Estate Operations",
    description:
      "Coordinate places, occupants, visitor access, service charges and maintenance for residential estates with VMS Core.",
    eyebrow: "Residential",
    heading: "Run a more organized estate.",
    intro:
      "Bring everyday estate operations into one workspace, from the people and places that make up the community to visitor and charge records.",
    points: [
      "Organize units and occupant relationships",
      "Manage visitor invitations and checkpoint activity",
      "Assign service charges and follow payment records",
      "Track maintenance requests and community updates",
    ],
    sectionHeading: "A clearer view of the estate day",
    sectionText:
      "Give administrators and site teams a shared operating picture while residents and other occupants use workspaces that reflect their role.",
  },
  commercial: {
    title: "Commercial Property Operations",
    description:
      "Manage commercial occupants, leases, charges, visitor access and facilities by site with VMS Core.",
    eyebrow: "Commercial",
    heading: "Keep commercial spaces and tenants organized.",
    intro:
      "Coordinate occupants, spaces and the work around them without losing sight of which building or team owns each record.",
    points: [
      "Keep business occupants connected to their places",
      "Track lease and charge workflows",
      "Coordinate visitor access and movement records",
      "Keep maintenance and facility work tied to a site",
    ],
    sectionHeading: "A workspace for each operating site",
    sectionText:
      "Use organization structure for portfolio oversight and site workspaces for the teams managing individual commercial locations.",
  },
  hospitality: {
    title: "Hospitality Property Operations",
    description:
      "Coordinate rooms, reservations, guest stays and daily property operations with VMS Core hospitality workflows.",
    eyebrow: "Hospitality",
    heading: "Coordinate rooms, guests and daily operations.",
    intro:
      "Give hospitality teams a connected place to manage room inventory and supported reservation and guest-stay workflows.",
    points: [
      "Organize rooms and room categories",
      "Work with reservation and booking flows",
      "Coordinate guest access and stay records",
      "Keep operational and maintenance work close to the property",
    ],
    sectionHeading: "Built around a property's daily rhythm",
    sectionText:
      "Hospitality workflows have distinct needs. VMS Core provides a domain-aware site workspace while keeping the location within the wider organization.",
  },
  "mixed-use": {
    title: "Mixed-Use Property Operations",
    description:
      "Coordinate varied spaces, occupants, charges and shared facilities across mixed-use developments with VMS Core.",
    eyebrow: "Mixed-use",
    heading: "One coordinated experience for complex developments.",
    intro:
      "Bring different property uses into an organization structure that can represent both the whole development and its constituent sites and places.",
    points: [
      "Represent different types of places and occupants",
      "Coordinate visitor and access workflows",
      "Manage charge and payment records in context",
      "Track shared facility and maintenance operations",
    ],
    sectionHeading: "Keep the parts connected",
    sectionText:
      "A mixed-use development can include residential, commercial and hospitality activity. VMS Core keeps their operating context visible under one organization.",
  },
  "estate-associations": {
    title: "Estate Association Operations",
    description:
      "Support estate association administration with structured occupant, visitor, charge, maintenance and communication workflows.",
    eyebrow: "Estate associations",
    heading: "Make estate administration easier to follow.",
    intro:
      "Give association leaders and estate teams a shared place to organize records and coordinate the work residents depend on.",
    points: [
      "Maintain structured place and occupant records",
      "Keep visitor invitations and checkpoint records connected",
      "Follow estate dues and service-charge balances",
      "Coordinate maintenance requests and notices",
    ],
    sectionHeading: "Clearer records for shared responsibilities",
    sectionText:
      "Keep operational activity tied to the estate and the people responsible for it, with access shaped around each role.",
  },
};

export const features: Record<string, MarketingContent> = {
  "visitor-management": {
    title: "Visitor Management",
    description:
      "Manage visitor invitations, checkpoint validation and movement history with VMS Core visitor operations.",
    eyebrow: "Visitor management",
    heading: "Keep invitations and entry records connected.",
    intro:
      "Coordinate visitor authorization and checkpoint activity with records tied to the right site and place.",
    points: [
      "Create and manage visit authorizations",
      "Validate credentials at configured checkpoints",
      "Record entry, exit and checkpoint activity",
      "Review movement history in the relevant site context",
    ],
    sectionHeading: "From invitation to movement record",
    sectionText:
      "An access workflow can connect the authorization, the checkpoint and the resulting activity without relying only on a paper register.",
  },
  "estate-billing": {
    title: "Property Charges and Payments",
    description:
      "Define charges, assign responsibility, schedule billing and review payments and outstanding balances in VMS Core.",
    eyebrow: "Charges and payments",
    heading: "Make property charges easier to follow.",
    intro:
      "Keep charge definitions, assignments, schedules and payment records together in a property operations workflow.",
    points: [
      "Define recurring or one-off charges",
      "Assign charges to the relevant places and responsible parties",
      "Use a configured supported payment gateway",
      "Review payment records and outstanding balances",
    ],
    sectionHeading: "Billing workflow with provider-specific settlement",
    sectionText:
      "VMS Core organizes billing records. The configured payment provider processes transactions and settlement under its own arrangement with the organization; provider fees and terms apply.",
  },
  "occupancy-management": {
    title: "Occupancy Management",
    description:
      "Maintain structured place and occupant relationships for residential, commercial, hospitality and mixed-use properties.",
    eyebrow: "People and places",
    heading: "Know who is connected to each place.",
    intro:
      "Keep the relationship between a place and the people or businesses using it structured and available to the teams who need that context.",
    points: [
      "Represent apartments, offices, rooms and other places",
      "Maintain occupant and responsible-party relationships",
      "Support role-based workspaces",
      "Keep records within their organization and site context",
    ],
    sectionHeading: "A property record with useful context",
    sectionText:
      "Organization, site and place structure gives operating teams a consistent way to locate the people and spaces connected to their work.",
  },
  "maintenance-management": {
    title: "Property Maintenance Management",
    description:
      "Record maintenance requests, assignments and resolution in the relevant VMS Core property workspace.",
    eyebrow: "Maintenance",
    heading: "Keep service work close to the place it affects.",
    intro:
      "Track requests and operational follow-up against the site and place where the work is needed.",
    points: [
      "Record and review maintenance requests",
      "Coordinate assignments and status changes",
      "Keep requests visible to the relevant operating team",
      "Use site context to coordinate follow-up",
    ],
    sectionHeading: "From request to resolution",
    sectionText:
      "Give operational teams a shared record to follow instead of splitting each maintenance issue across calls and chat messages.",
  },
  "access-operations": {
    title: "Access Operations",
    description:
      "Coordinate visitor invitations, checkpoint policies, credential validation and movement records with VMS Core.",
    eyebrow: "Digital and physical access",
    heading: "Bring visitor management closer to your gates.",
    intro:
      "Connect digital visitor workflows with checkpoint operations and movement records at each site.",
    points: [
      "Manage visit authorizations",
      "Configure site checkpoint operations",
      "Record passage activity",
      "Explore compatible physical access integrations where supported",
    ],
    sectionHeading: "Connected infrastructure, with clear availability",
    sectionText:
      "VMS Core supports digital access workflows. Physical controller compatibility depends on the device and available integration. An on-site edge-device approach remains in development.",
  },
};

export const platform: Record<string, MarketingContent> = {
  "multi-site-management": {
    title: "Multi-Site Property Management",
    description:
      "Manage multiple estates, buildings and facilities through one VMS Core organization with dedicated site workspaces.",
    eyebrow: "Centralized operations",
    heading: "Every site. One operating platform.",
    intro:
      "Manage multiple estates, buildings and facilities through one organization, with site workspaces and role-based access for local teams.",
    points: [
      "Group managed locations under an organization",
      "Keep site settings and teams in context",
      "Represent sites and nested places",
      "Give people workspaces based on their role",
    ],
    sectionHeading: "One portfolio, distinct locations",
    sectionText:
      "A property operator can manage a residential estate, commercial building and hospitality property under one organization without flattening them into one place list.",
  },
  integrations: {
    title: "VMS Core Integrations",
    description:
      "Configure supported payment, email and plugin capabilities for your VMS Core organization and property operations.",
    eyebrow: "Extensible platform",
    heading: "Connect the services your operations use.",
    intro:
      "VMS Core supports configurable integration points for payment processing, email delivery and enabled plugins. Availability depends on the provider and the product setup.",
    points: [
      "Configure supported payment gateway credentials",
      "Set organization email delivery through SMTP settings",
      "Enable and configure supported plugins",
      "Explore compatible access and building integrations as they become available",
    ],
    sectionHeading: "Integration categories and current availability",
    sectionText:
      "Payment gateways, email settings and plugins have configuration surfaces in the product. WhatsApp/SMS routing, broad access-controller coverage and utility integrations should be confirmed for the intended provider before purchase.",
  },
  "white-label": {
    title: "Organization Branding",
    description:
      "Create and apply VMS Core branding themes with organization names, colours and logo assets.",
    eyebrow: "Your organization, your identity",
    heading: "Make the workspace feel more familiar.",
    intro:
      "Create organization branding themes to align supported VMS Core application surfaces with your identity.",
    points: [
      "Create and manage branding themes",
      "Set primary and secondary colors",
      "Configure logo and favicon assets",
      "Apply a branding theme to the application",
    ],
    sectionHeading: "Branding that reflects the organization",
    sectionText:
      "The current product includes branding theme controls for colors and image assets. Custom domains and visitor-page or email-template branding depend on available product support and are not represented here as guaranteed features.",
  },
  "connected-infrastructure": {
    title: "Connected Property Infrastructure",
    description:
      "Understand VMS Core digital access workflows and the status of planned physical infrastructure integrations.",
    eyebrow: "Connected infrastructure",
    heading: "Connect operational records with on-site work.",
    intro:
      "VMS Core connects visitor authorization and checkpoint activity in software. Physical access integration depends on compatible devices and supported connections.",
    points: [
      "Coordinate visitor invitations and checkpoint policies",
      "Keep passage activity in a site context",
      "Assess compatible access controllers before integration",
      "Follow future on-site connectivity development",
    ],
    sectionHeading:
      "Digital workflows are available; hardware work is in development",
    sectionText:
      "An edge-device approach is being explored to improve communication with compatible on-site systems. The device and self-hosted deployment are planned or in development, not currently available.",
  },
};

export const solutionSlugs = Object.keys(solutions);
export const featureSlugs = Object.keys(features);
export const platformSlugs = Object.keys(platform);
