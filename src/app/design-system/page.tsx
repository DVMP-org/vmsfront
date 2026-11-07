"use client";

import { useState } from "react";
import "../../../packages/ui/src/tokens.css";
import "./styles.css";

/** A route-preserving reference for the shared semantic tokens and control states. */
export default function DesignSystemGallery() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [density, setDensity] = useState<"comfortable" | "compact">("comfortable");
  const [saved, setSaved] = useState(false);
  return (
    <main className="gallery" data-vms-theme={theme} data-vms-density={density}>
      <div className="gallery-inner">
        <header className="gallery-header">
          <div><p className="gallery-eyebrow">VMS / Foundations</p><h1>Design system</h1><p>Shared tokens and accessible control states for property operations.</p></div>
          <div className="gallery-settings">
            <label>Appearance<select value={theme} onChange={e => setTheme(e.target.value as typeof theme)}><option value="light">Light</option><option value="dark">Dark</option></select></label>
            <label>Density<select value={density} onChange={e => setDensity(e.target.value as typeof density)}><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></label>
          </div>
        </header>
        <section aria-labelledby="type-heading"><p className="gallery-eyebrow">01 / Typography</p><h2 id="type-heading">A clear hierarchy</h2><p>Operational information stays readable at every density. Display type gives orientation; interface type supports the work.</p></section>
        <section aria-labelledby="colors-heading"><p className="gallery-eyebrow">02 / Color</p><h2 id="colors-heading">Semantic palette</h2><div className="gallery-swatches"><div><i className="swatch surface"/>Surface</div><div><i className="swatch text"/>Text</div><div><i className="swatch primary"/>Primary / focus</div><div><i className="swatch danger"/>Danger</div></div></section>
        <section aria-labelledby="controls-heading"><p className="gallery-eyebrow">03 / Controls</p><h2 id="controls-heading">Actions and fields</h2><p>Use keyboard Tab to inspect focus. Labels and status remain visible in both themes.</p><div className="gallery-controls"><button type="button" onClick={() => setSaved(true)}>Save changes</button><button type="button" className="secondary" onClick={() => setSaved(false)}>Reset</button><button type="button" disabled>Unavailable</button></div><p role="status" className="gallery-status">{saved ? "Changes saved." : "No changes saved."}</p><div className="gallery-form"><label htmlFor="property-name">Property name</label><input id="property-name" placeholder="e.g. Cedar House" aria-describedby="property-help"/><small id="property-help">Shown to people with access to this property.</small></div></section>
      </div>
    </main>
  );
}
