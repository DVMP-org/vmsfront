import { describe, expect, it } from "vitest";

import * as Kit from "./index";

describe("VMS Core UI kit entry point", () => {
  it("exports the approved atomic and composite component surface", () => {
    for (const name of [
      "ActionCard",
      "Avatar",
      "Badge",
      "Breadcrumbs",
      "Button",
      "Card",
      "Checkbox",
      "DataTable",
      "EmptyState",
      "FilterBar",
      "InlineAlert",
      "Input",
      "Modal",
      "PageHeader",
      "PaginationBar",
      "PropertyImage",
      "SearchField",
      "SearchableSelect",
      "SlideOver",
      "StatusBadge",
      "WorkflowTimeline",
    ]) {
      expect(Kit[name as keyof typeof Kit]).toBeDefined();
    }
  });
});
