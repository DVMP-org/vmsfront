const baseDomain = process.env.VMS_BASE_DOMAIN || "lvh.me";
const webPort = process.env.E2E_WEB_PORT || "3116";
const webBaseURL =
  process.env.VMS_BASE_URL || `http://${baseDomain}:${webPort}`;

export const vmsConfig = {
  apiOrigin: process.env.API_BASE_URL || "https://vmscore.to",
  webBaseURL,
  webPort,
  baseDomain,
  mode: process.env.E2E_MODE === "live" ? "live" : "fixture",
  adminEmail: process.env.ADMIN_E2E_EMAIL || "admin@admin.com",
  adminPassword: process.env.ADMIN_E2E_PASSWORD || "password",
  memberEmail: process.env.MEMBER_E2E_EMAIL || "member@example.com",
  memberPassword: process.env.MEMBER_E2E_PASSWORD || "password",
  occupantEmail: process.env.OCCUPANT_E2E_EMAIL || "occupant@example.com",
  occupantPassword: process.env.OCCUPANT_E2E_PASSWORD || "password",
  tenantURL(slug: string) {
    return `http://${slug}.${baseDomain}:${webPort}`;
  },
};
