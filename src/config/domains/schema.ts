import { z } from "zod";

const navigationChildSchema = z.object({
  label: z.string().min(1),
  href: z.string().startsWith("/"),
  icon: z.string().min(1),
  module: z.string().min(1),
  permission: z.string().optional(),
});

const navigationItemSchema = navigationChildSchema.extend({
  children: z.array(navigationChildSchema).optional(),
});

const navigationGroupSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  items: z.array(navigationItemSchema).min(1),
});

export const domainExperienceSchema = z.object({
  domain: z.enum(["residential", "commercial", "hospitality", "mixed_use"]),
  label: z.string().min(1),
  terminology: z.record(z.string()),
  navigation: z.array(navigationGroupSchema).min(1),
  workspace_navigation: z
    .array(
      z.object({
        id: z.string().min(1),
        label: z.string().min(1),
        items: z
          .array(
            navigationChildSchema.extend({
              place_admin_only: z.boolean().optional(),
            }),
          )
          .min(1),
      }),
    )
    .min(1),
  workspace_dashboard: z
    .array(
      z.object({
        section: z.enum([
          "announcements",
          "charges",
          "maintenance",
          "invitations",
          "stay",
        ]),
        module: z.string().min(1),
      }),
    )
    .min(1),
  dashboard: z.object({
    component: z.enum([
      "residential",
      "commercial",
      "hospitality",
      "mixed_use",
    ]),
    priorities: z.array(z.string()).min(1),
  }),
  views: z.record(
    z.object({
      columns: z.array(z.string()).min(1),
      filters: z.array(z.string()).min(1),
    }),
  ),
  maintenance: z.object({
    categories: z.array(z.string()).min(1),
    workflow: z.array(z.string()).min(1),
    requires_access_authorization: z.boolean().optional(),
    requires_contractor_permit: z.boolean().optional(),
    affects_room_availability: z.boolean().optional(),
    requires_expense_allocation: z.boolean().optional(),
  }),
});

export type DomainExperience = z.infer<typeof domainExperienceSchema>;
export type DomainUseCase = DomainExperience["domain"];
export type DomainNavigationGroup = DomainExperience["navigation"][number];
export type DomainNavigationItem = DomainNavigationGroup["items"][number];
