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
});
