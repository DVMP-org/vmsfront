import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

type LegacyRedirect = {
  source: string;
  destination: string;
  permanent: boolean;
};

const require = createRequire(import.meta.url);
const {
  legacyRedirects,
}: { legacyRedirects: LegacyRedirect[] } = require(
  "../../config/legacy-redirects",
);

describe("legacy route convergence", () => {
  it.each([
    ["/admin/dues", "/admin/charges?legacy=dues"],
    ["/admin/residencies", "/admin/properties?legacy=residencies"],
    ["/admin/residents", "/admin/people?legacy=residents"],
    ["/admin/gate", "/admin/checkpoints?legacy=gate"],
    ["/residency", "/select?legacy=residency"],
    ["/visit", "/auth/login?next=%2Fselect&legacy=visit"],
  ])("redirects %s to %s", (source, destination) => {
    const redirect = legacyRedirects.find(
      (item) => item.source === `${source}/:path*`,
    );

    expect(redirect).toEqual({
      source: `${source}/:path*`,
      destination,
      permanent: false,
    });
  });
});
