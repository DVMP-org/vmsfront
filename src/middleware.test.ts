import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { middleware } from "./middleware";

describe("organization routing", () => {
  it("does not redirect the authenticated organizations index to itself", () => {
    const request = new NextRequest("https://vmsfront.to/organizations/", {
      headers: {
        host: "vmsfront.to",
        cookie: "auth-token=valid-token",
      },
    });

    const response = middleware(request);

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("allows the organizations index to resolve initial auth on the client", () => {
    const request = new NextRequest("https://vmsfront.to/organizations/", {
      headers: { host: "vmsfront.to" },
    });

    const response = middleware(request);

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("keeps first-Site setup inside an authenticated tenant context", () => {
    const request = new NextRequest(
      "https://harbour.vmsfront.to/setup/first-site/",
      {
        headers: {
          host: "harbour.vmsfront.to",
          cookie: "auth-token=valid-token",
        },
      },
    );

    const response = middleware(request);

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("does not redirect the retired admin first-place query into setup", () => {
    const request = new NextRequest(
      "https://harbour.vmsfront.to/admin/properties/new/?setup=first-place",
      {
        headers: {
          host: "harbour.vmsfront.to",
          cookie: "auth-token=valid-token",
        },
      },
    );

    const response = middleware(request);

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("does not redirect the old first-place setup URL to first-site", () => {
    const request = new NextRequest(
      "https://harbour.vmsfront.to/setup/first-place",
      {
        headers: {
          host: "harbour.vmsfront.to",
          cookie: "auth-token=valid-token",
        },
      },
    );

    const response = middleware(request);

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("sends an authenticated subdomain root to the workspace lobby", () => {
    const request = new NextRequest("https://harbour.vmsfront.to/", {
      headers: {
        host: "harbour.vmsfront.to",
        cookie: "auth-token=valid-token",
      },
    });

    const response = middleware(request);

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-rewrite")).toBe(
      "https://harbour.vmsfront.to/lobby",
    );
  });

  it("sends anonymous subdomain root visitors to login with the lobby as their destination", () => {
    const request = new NextRequest("https://harbour.vmsfront.to/", {
      headers: { host: "harbour.vmsfront.to" },
    });

    const response = middleware(request);
    const location = new URL(response.headers.get("location") || "");

    expect(location.pathname).toBe("/auth/login");
    expect(location.searchParams.get("redirect_to")).toBe("/");
  });

  it("keeps the base-domain root on the public landing page", () => {
    const request = new NextRequest("https://vmsfront.to/", {
      headers: {
        host: "vmsfront.to",
        cookie: "auth-token=valid-token",
      },
    });

    const response = middleware(request);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("serves the base-domain landing page to anonymous visitors", () => {
    const request = new NextRequest("https://vmsfront.to/", {
      headers: { host: "vmsfront.to" },
    });

    const response = middleware(request);

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("keeps localhost development on the public landing page", () => {
    const request = new NextRequest("http://localhost:3000/", {
      headers: {
        host: "localhost:3000",
        cookie: "auth-token=valid-token",
      },
    });

    const response = middleware(request);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("ignores a forwarded internal port on the public base domain", () => {
    const request = new NextRequest("https://vmsfront.to/", {
      headers: {
        host: "vmsfront.to",
        "x-forwarded-proto": "https",
        "x-forwarded-host": "vmsfront.to",
        "x-forwarded-port": "3000",
        cookie: "auth-token=valid-token",
      },
    });

    const response = middleware(request);
    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("redirects a tenant host to the public base domain without the proxy port", () => {
    const request = new NextRequest(
      "https://harbour.vmsfront.to/organizations",
      {
        headers: {
          host: "harbour.vmsfront.to",
          "x-forwarded-proto": "https",
          "x-forwarded-host": "harbour.vmsfront.to",
          "x-forwarded-port": "3000",
          cookie: "auth-token=valid-token",
        },
      },
    );

    const response = middleware(request);
    const location = new URL(response.headers.get("location") || "");

    expect(location.host).toBe("vmsfront.to");
    expect(location.pathname).toBe("/organizations");
  });

  it("redirects tenant registration to the base domain", () => {
    const request = new NextRequest(
      "https://harbour.vmsfront.to/auth/register?source=invite",
      { headers: { host: "harbour.vmsfront.to" } },
    );

    const response = middleware(request);
    const location = new URL(response.headers.get("location") || "");

    expect(location.origin).toBe("https://vmsfront.to");
    expect(location.pathname).toBe("/auth/register");
    expect(location.searchParams.get("source")).toBe("invite");
  });

  it("allows login on a tenant domain", () => {
    const request = new NextRequest(
      "https://harbour.vmsfront.to/auth/login",
      { headers: { host: "harbour.vmsfront.to" } },
    );

    const response = middleware(request);

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("allows the canonical trailing-slash login on a tenant domain", () => {
    const request = new NextRequest(
      "https://harbour.vmsfront.to/auth/login/",
      { headers: { host: "harbour.vmsfront.to" } },
    );

    const response = middleware(request);

    expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("x-middleware-next")).toBe("1");
  });

  it("redirects a tenant landing alias to the base-domain homepage", () => {
    const request = new NextRequest(
      "https://harbour.vmsfront.to/landing",
      { headers: { host: "harbour.vmsfront.to" } },
    );

    const response = middleware(request);
    const location = new URL(response.headers.get("location") || "");

    expect(location.origin).toBe("https://vmsfront.to");
    expect(location.pathname).toBe("/");
  });

  it("preserves the local port when authenticated auth routes leave the base domain", () => {
    const request = new NextRequest("http://lvh.me:3116/auth/login", {
      headers: {
        host: "lvh.me:3116",
        cookie: "auth-token=valid-token",
      },
    });

    const response = middleware(request);
    const location = new URL(response.headers.get("location") || "");

    expect(location.port).toBe("3116");
    expect(location.pathname).toBe("/organizations");
  });
});
