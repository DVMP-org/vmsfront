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
      <div className="gallery-top"><strong><span className="gallery-logo" aria-hidden="true">V</span> VMS <span className="gallery-top-label">/ DESIGN REFERENCE</span></strong><span>FOUNDATIONS <span aria-hidden="true">●</span> 01</span></div>
      <div className="gallery-inner">
        <header className="gallery-header">
          <div><p className="gallery-eyebrow">The operating toolkit / 01</p><h1>Clarity for<br/><em>everyday work.</em></h1><p>A practical visual language for the people who keep properties moving.</p></div>
          <div className="gallery-settings"><span className="gallery-settings-title">Make it yours</span><label>Appearance<select value={theme} onChange={e => setTheme(e.target.value as typeof theme)}><option value="light">Light</option><option value="dark">Dark</option></select></label><label>Density<select value={density} onChange={e => setDensity(e.target.value as typeof density)}><option value="comfortable">Comfortable</option><option value="compact">Compact</option></select></label></div>
        </header>
        <div className="gallery-grid">
          <section className="gallery-panel gallery-type" aria-labelledby="type-heading"><div className="gallery-panel-head"><span>01 / TYPE</span><span>↗</span></div><h2 id="type-heading">Information first.</h2><p>Clear labels, confident headings and a consistent rhythm make complex work easier to scan.</p><div className="gallery-type-sample"><strong>Aa</strong><span>Interface / Inter<br/>Display / Georgia</span></div></section>
          <section className="gallery-panel" aria-labelledby="colors-heading"><div className="gallery-panel-head"><span>02 / COLOR</span><span>↗</span></div><h2 id="colors-heading">A considered palette.</h2><p>Semantic color keeps emphasis purposeful and status clear.</p><div className="gallery-swatches"><div><i className="swatch primary"/>Action</div><div><i className="swatch text"/>Ink</div><div><i className="swatch surface"/>Canvas</div><div><i className="swatch danger"/>Critical</div></div></section>
          <section className="gallery-panel gallery-action" aria-labelledby="controls-heading"><div className="gallery-panel-head"><span>03 / INTERACTION</span><span>↗</span></div><div className="gallery-action-layout"><div><h2 id="controls-heading">Made for the task.</h2><p>Controls stay clear and predictable. Tab through to explore keyboard focus.</p><div className="gallery-controls"><button type="button" onClick={() => setSaved(true)}>Save changes <span aria-hidden="true">↗</span></button><button type="button" className="secondary" onClick={() => setSaved(false)}>Reset</button><button type="button" disabled>Unavailable</button></div><p role="status" className="gallery-status">{saved ? "Changes saved." : "No changes saved."}</p></div><div className="gallery-form"><label htmlFor="property-name">Property name</label><input id="property-name" placeholder="e.g. Cedar House" aria-describedby="property-help"/><small id="property-help">Shown to people with access to this property.</small></div></div></section>
        </div><footer className="gallery-footer"><span>VMS / DESIGN REFERENCE</span><span>BUILT FOR PEOPLE, PLACES &amp; WORK.</span></footer>
      </div>
    </main>
  );
}
