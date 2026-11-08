import { describe, expect, it } from "vitest";
import { findPluginRouteAndType } from "./plugin-utils";

const plugin = {
  basePath: "/camera",
  adminRoutes: [{ path: "/admin", title: "Dashboard" }],
  residentRoutes: [{ path: "/", title: "Camera" }],
};

describe("plugin route resolution", () => {
  it("uses explicit admin and resident route tables", () => {
    expect(
      findPluginRouteAndType("/camera/admin", plugin),
    ).toMatchObject({ layoutType: "admin", route: { path: "/admin" } });
    expect(findPluginRouteAndType("/camera", plugin)).toMatchObject({
      layoutType: "resident",
      route: { path: "/" },
    });
  });

  it("does not fall back to retired shared legacy routes", () => {
    const retiredShape = {
      basePath: "/camera",
      routes: [{ path: "/admin", title: "Legacy dashboard" }],
    };

    expect(findPluginRouteAndType("/camera/admin", retiredShape)).toBeNull();
  });
});
