export type GuideContent = {
  slug: string;
  title: string;
  description: string;
  category: string;
  intro: string;
  illustration: string;
  sections: { heading: string; body: string; bullets?: string[] }[];
  takeaways: string[];
  related: { label: string; href: string }[];
};

export const guides: GuideContent[] = [
  {
    slug: "property-hierarchy",
    title: "How to model a property portfolio",
    category: "Platform guide",
    description:
      "Learn how VMS Core represents organizations, sites, places and role-based workspaces.",
    intro:
      "A clear property model starts by separating who manages a portfolio, which locations they operate and the spaces people use. This guide explains how to map that structure into VMS Core.",
    illustration: "property-hierarchy",
    sections: [
      {
        heading: "Start with the organization",
        body: "The organization represents the operator or association responsible for the portfolio. It is the shared administrative context for the sites managed through VMS Core.",
      },
      {
        heading: "Represent each managed site",
        body: "Create a site for each estate, building, hotel or other managed location. Site teams can work in the context of the location they manage.",
      },
      {
        heading: "Add places within the site",
        body: "Places represent the assignable spaces that matter to operations: apartments, offices, shops, rooms or shared facilities. The exact place model depends on the property.",
      },
      {
        heading: "Give people the right workspace",
        body: "A workspace is shaped by a person's role and their active organization, site or place relationship. Map responsibilities before inviting a large operating team.",
        bullets: [
          "Who owns portfolio settings?",
          "Which administrators manage each site?",
          "Which occupants need place-level access?",
          "Which staff roles operate checkpoints or maintenance workflows?",
        ],
      },
    ],
    takeaways: [
      "Keep the organization as the portfolio owner.",
      "Create a distinct site for each operational location.",
      "Use places for assignable property spaces.",
      "Grant workspace access according to real responsibilities.",
    ],
    related: [
      {
        label: "Multi-site management",
        href: "/platform/multi-site-management",
      },
      { label: "Occupancy management", href: "/features/occupancy-management" },
    ],
  },
  {
    slug: "visitor-flow",
    title: "From visitor invitation to checkpoint record",
    category: "Operations guide",
    description:
      "Understand how VMS Core connects visitor authorization, checkpoint validation and movement history.",
    intro:
      "A visitor workflow spans the person inviting a guest, the credential presented at the site and the record of what happened at the checkpoint. This guide helps teams map each step and responsibility.",
    illustration: "visitor-flow",
    sections: [
      {
        heading: "Create the authorization",
        body: "The visit starts with a digital authorization associated with the site and its relevant host or operating context. Review the visitor details and the site policy before the visitor arrives.",
      },
      {
        heading: "Validate at the checkpoint",
        body: "A checkpoint operator uses the configured validation workflow to check the presented credential. Make sure the people operating the checkpoint have the appropriate site access.",
      },
      {
        heading: "Retain the movement record",
        body: "Entry, exit and checkpoint activity are recorded for later review. These records can help site teams follow an access question in its context.",
      },
      {
        heading: "Plan for the physical gate separately",
        body: "Digital credential validation does not automatically operate a physical barrier. Confirm controller compatibility and product support before promising automatic gate actions.",
      },
    ],
    takeaways: [
      "Define who can issue and approve invitations.",
      "Train checkpoint operators on the site's validation policy.",
      "Decide how the site reviews movement records.",
      "Treat physical controller integration as a separate compatibility check.",
    ],
    related: [
      { label: "Visitor management", href: "/features/visitor-management" },
      {
        label: "Connected infrastructure",
        href: "/platform/connected-infrastructure",
      },
    ],
  },
  {
    slug: "integration-readiness",
    title: "A practical checklist for property integrations",
    category: "Buyer guide",
    description:
      "Questions to answer about provider support, accounts, transaction paths and compatibility before connecting an integration.",
    intro:
      "An integration is useful when it fits the operating workflow and its responsibilities are understood. Use this checklist to assess payment, communication and physical-access connections before rollout.",
    illustration: "integration-readiness",
    sections: [
      {
        heading: "Define the workflow first",
        body: "Write down what should happen, which record starts the action, who approves it and what teams need to see the result. This separates an operational requirement from a vendor or hardware preference.",
      },
      {
        heading: "Confirm product and provider support",
        body: "Check the exact provider, connection method and environment required. A configuration field or product category does not guarantee that every provider account or device is ready to use.",
      },
      {
        heading: "Understand account ownership and money movement",
        body: "For payments, confirm which organization account is configured, who processes the transaction, how fees apply and how settlement occurs. VMS Core organizes billing records; the configured provider controls transaction processing under its terms.",
      },
      {
        heading: "Plan for credentials and operational ownership",
        body: "Determine who can securely provide and maintain provider credentials, who receives integration alerts and who handles failures or reconciliation.",
      },
      {
        heading: "Test a bounded rollout",
        body: "Start with a defined site and a small set of operating users. Verify the expected workflow and record before expanding to other locations.",
      },
    ],
    takeaways: [
      "Name the operational problem before selecting a provider.",
      "Verify support for the exact account, channel or hardware.",
      "Confirm fees, settlement and credential ownership.",
      "Pilot the connection with one site before broader rollout.",
    ],
    related: [
      { label: "Integrations", href: "/platform/integrations" },
      { label: "Charges and payments", href: "/features/estate-billing" },
      { label: "Talk to the VMS Core team", href: "/contact" },
    ],
  },
];

export function getGuide(slug: string) {
  return guides.find((guide) => guide.slug === slug);
}
