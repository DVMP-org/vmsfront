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

  it("keeps first-place setup inside an authenticated tenant context", () => {
    const request = new NextRequest(
      "https://harbour.vmsfront.to/setup/first-place/",
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

  it("redirects the retired admin first-place URL to standalone setup", () => {
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
    const location = new URL(response.headers.get("location") || "");

    expect(location.pathname).toBe("/setup/first-place");
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
