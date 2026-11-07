import { describe, expect, it } from "vitest";

import { createCookieUtilities, createSubdomainUtilities } from "../src";

describe("browser context helpers", () => {
  it("shares production cookies across tenant subdomains", () => {
    const document = { cookie: "" };
    const cookies = createCookieUtilities({
      baseDomain: "vmsfront.to",
      document,
      location: { hostname: "acme.vmsfront.to", protocol: "https:" },
    });

    cookies.setCookie("auth-token", "session-token");
    expect(document.cookie).toContain("domain=.vmsfront.to");
    expect(document.cookie).toContain("Secure");
    expect(cookies.getCookie("auth-token")).toBe("session-token");
  });

  it("omits cookie domains for localhost", () => {
    const document = { cookie: "" };
    const cookies = createCookieUtilities({
      baseDomain: "vmsfront.to",
      document,
      location: { hostname: "acme.localhost", protocol: "http:" },
    });

    cookies.setCookie("auth-token", "local-token");
    expect(document.cookie).not.toContain("domain=");
  });

  it("recognizes tenant and base hosts without leaking ports", () => {
    const tenant = createSubdomainUtilities({
      baseDomain: "vmsfront.to",
      location: {
        hostname: "acme.vmsfront.to",
        protocol: "https:",
        port: "",
      },
    });
    const base = createSubdomainUtilities({
      baseDomain: "vmsfront.to",
      location: {
        hostname: "vmsfront.to",
        protocol: "https:",
        port: "",
      },
    });

    expect(tenant.getSubdomain()).toBe("acme");
    expect(tenant.buildSubdomainUrl("north", "/admin")).toBe(
      "https://north.vmsfront.to/admin",
    );
    expect(base.getSubdomain()).toBeNull();
    expect(base.buildSubdomainUrl("admin", "/admin")).toBe("/admin");
  });

  it("keeps the local development port", () => {
    const local = createSubdomainUtilities({
      baseDomain: "vmsfront.to",
      location: {
        hostname: "localhost",
        protocol: "http:",
        port: "3000",
      },
    });

    expect(local.buildSubdomainUrl("acme", "/select")).toBe(
      "http://acme.localhost:3000/select",
    );
  });
});
