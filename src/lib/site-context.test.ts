import { beforeEach, describe, expect, it } from "vitest";
import { storedSiteId, siteIdFromSearch, withSite } from "./site-context";

describe("Site navigation hints", () => {
  beforeEach(() => {
    document.cookie = "selected-site=site-a; path=/";
    document.cookie = "selected-site-organization=acme; path=/";
  });
  it("never restores another organization's Site cookie", () => {
    expect(storedSiteId("acme")).toBe("site-a");
    expect(storedSiteId("other")).toBeNull();
    expect(storedSiteId(null)).toBeNull();
  });
  it("preserves filters, explicit Site scope and hash fragments", () => {
    expect(withSite("/admin/places?page=2#details", "site-a")).toBe(
      "/admin/places?page=2&site_id=site-a#details",
    );
    expect(withSite("/admin?site_id=site-b", "site-a")).toBe(
      "/admin?site_id=site-b",
    );
    expect(withSite("/organization/settings", "site-a")).toBe(
      "/organization/settings",
    );
    expect(withSite("/administrator", "site-a")).toBe("/administrator");
  });
  it("reads canonical and supported direct-link Site parameters", () => {
    expect(siteIdFromSearch("?site_id=first&site=second")).toBe("first");
    expect(siteIdFromSearch("?site=second")).toBe("second");
    expect(siteIdFromSearch("?page=2")).toBeNull();
  });
});
