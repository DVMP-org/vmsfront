"use client";

import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Info,
  Search,
  XCircle,
} from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import { Button } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { FilterBar } from "@/components/ui/FilterBar";
import { Modal } from "@/components/ui/Modal";
import { PropertyImage } from "@/components/ui/PropertyImage";
import { SearchField } from "@/components/ui/SearchField";
import { SlideOver } from "@/components/ui/SlideOver";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { WorkflowTimeline } from "@/components/ui/WorkflowTimeline";

import "./styles.css";

const swatches = [
  ["Canvas", "--vms-canvas", "Page field"],
  ["Surface", "--vms-surface", "Working area"],
  ["Action", "--vms-action", "Primary action"],
  ["Ink", "--vms-ink", "Primary text"],
  ["Active", "--vms-active-accent", "Focus and selection"],
  ["Coral accent", "--vms-coral-accent", "Indicator fill"],
  ["Success", "--vms-success", "Confirmed"],
  ["Success accent", "--vms-success-accent", "Healthy indicator"],
  ["Warning", "--vms-warning", "Needs attention"],
  ["Warning accent", "--vms-warning-accent", "Attention indicator"],
  ["Danger", "--vms-danger", "Failed or destructive"],
  ["Danger accent", "--vms-danger-accent", "Failure indicator"],
] as const;

export default function DesignSystemGallery() {
  const [density, setDensity] = useState<"comfortable" | "compact">(
    "comfortable",
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [gallerySearch, setGallerySearch] = useState("");

  return (
    <main className="gallery" data-vms-theme="light" data-vms-density={density}>
      <header className="gallery-top">
        <a
          className="gallery-mark"
          href="#foundations"
          aria-label="VMS foundations home"
        >
          <span aria-hidden="true">V</span>
          <strong>VMS</strong>
          <span className="gallery-top-context">
            Operations Hub / Foundations
          </span>
        </a>
        <div className="gallery-density" aria-label="Control density">
          <span>Density</span>
          <Button
            size="sm"
            variant={density === "comfortable" ? "light" : "light-outlined"}
            aria-pressed={density === "comfortable"}
            onClick={() => setDensity("comfortable")}
          >
            Default
          </Button>
          <Button
            size="sm"
            variant={density === "compact" ? "light" : "light-outlined"}
            aria-pressed={density === "compact"}
            onClick={() => setDensity("compact")}
          >
            Compact
          </Button>
        </div>
      </header>

      <div className="gallery-inner" id="foundations">
        <section className="gallery-hero" aria-labelledby="page-title">
          <div>
            <p className="gallery-eyebrow">Operating toolkit / 01</p>
            <h1 id="page-title">
              Clear decisions,
              <br />
              less interface noise.
            </h1>
            <p>
              Foundations for property operations: black actions, restrained
              coral attention, and charcoal data that stays readable while work
              is moving.
            </p>
          </div>
          <dl className="gallery-principles">
            <div>
              <dt>Theme</dt>
              <dd>Light only</dd>
            </div>
            <div>
              <dt>Contrast</dt>
              <dd>WCAG 2.2 AA target</dd>
            </div>
            <div>
              <dt>Inputs</dt>
              <dd>16px on mobile</dd>
            </div>
            <div>
              <dt>Touch</dt>
              <dd>44px on coarse pointers</dd>
            </div>
          </dl>
        </section>

        <section className="gallery-section" aria-labelledby="tokens-heading">
          <div className="gallery-section-head">
            <div>
              <p className="gallery-eyebrow">01 / Semantic tokens</p>
              <h2 id="tokens-heading">One language for state.</h2>
            </div>
            <p>
              Green, amber and red describe outcomes. They are never decorative
              series.
            </p>
          </div>
          <div className="gallery-swatches">
            {swatches.map(([label, token, purpose]) => (
              <div key={token}>
                <span
                  className="gallery-swatch"
                  style={{ background: `var(${token})` }}
                  aria-hidden="true"
                />
                <strong>{label}</strong>
                <code>{token}</code>
                <span>{purpose}</span>
              </div>
            ))}
          </div>
        </section>

        <div className="gallery-columns">
          <section
            className="gallery-section"
            aria-labelledby="actions-heading"
          >
            <div className="gallery-section-head">
              <div>
                <p className="gallery-eyebrow">02 / Actions</p>
                <h2 id="actions-heading">Next step, clearly.</h2>
              </div>
            </div>
            <div className="gallery-actions">
              <Button
                rightNode={
                  <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
                }
              >
                Review exception
              </Button>
              <Button variant="outline">View property</Button>
              <Button variant="ghost">Dismiss</Button>
              <Button variant="destructive-outlined">Archive</Button>
              <Button isLoading loadingLabel="Saving decision…">
                Save decision
              </Button>
              <Button disabled>Unavailable</Button>
            </div>
            <p role="status" className="gallery-status">
              {saved ? "Decision saved." : "No decision saved in this gallery."}
            </p>
          </section>

          <section className="gallery-section" aria-labelledby="fields-heading">
            <div className="gallery-section-head">
              <div>
                <p className="gallery-eyebrow">03 / Fields</p>
                <h2 id="fields-heading">Labels stay visible.</h2>
              </div>
            </div>
            <div className="gallery-form">
              <Input
                label="Property name"
                description="Shown to people with access to this property."
                placeholder="e.g. Cedar Court"
              />
              <Input
                label="Search people"
                icon={Search}
                placeholder="Name, unit or email"
                inputMode="search"
              />
              <Input
                label="Workspace URL"
                defaultValue="cedar-court"
                error="That URL is already used by another property."
                showAsterisk
              />
            </div>
          </section>
        </div>

        <div className="gallery-columns">
          <section className="gallery-section" aria-labelledby="status-heading">
            <div className="gallery-section-head">
              <div>
                <p className="gallery-eyebrow">04 / Status</p>
                <h2 id="status-heading">Text carries the meaning.</h2>
              </div>
            </div>
            <div className="gallery-badges">
              <Badge variant="success">
                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                Paid
              </Badge>
              <Badge variant="warning">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                Awaiting approval
              </Badge>
              <Badge variant="danger">
                <XCircle className="h-3.5 w-3.5" aria-hidden="true" />
                Access denied
              </Badge>
              <Badge variant="info">
                <Info className="h-3.5 w-3.5" aria-hidden="true" />
                Read only
              </Badge>
              <Badge variant="neutral">Draft</Badge>
              <Badge variant="outline">Archived</Badge>
            </div>
          </section>

          <section
            className="gallery-section"
            aria-labelledby="surface-heading"
          >
            <div className="gallery-section-head">
              <div>
                <p className="gallery-eyebrow">05 / Surfaces</p>
                <h2 id="surface-heading">One object, one boundary.</h2>
              </div>
            </div>
            <Card>
              <CardHeader>
                <div className="gallery-card-kicker">
                  <Badge variant="warning">Needs review</Badge>
                  <span>Updated 4 minutes ago</span>
                </div>
                <CardTitle>Visitor approval for Unit 14</CardTitle>
                <CardDescription>
                  Ada Nwosu arrives through the main gate at 18:30. Host: Chidi
                  Okafor.
                </CardDescription>
              </CardHeader>
              <CardContent className="gallery-card-facts">
                <span>
                  <strong>Gate</strong>Main entrance
                </span>
                <span>
                  <strong>Attempt</strong>First visit
                </span>
                <span>
                  <strong>Validity</strong>Today, 18:30–21:00
                </span>
              </CardContent>
              <CardFooter>
                <Button variant="ghost" onClick={() => setSaved(false)}>
                  Decline
                </Button>
                <Button onClick={() => setSaved(true)}>Approve visitor</Button>
              </CardFooter>
            </Card>
          </section>
        </div>

        <div className="gallery-columns">
          <section
            className="gallery-section"
            aria-labelledby="identity-heading"
          >
            <div className="gallery-section-head">
              <div>
                <p className="gallery-eyebrow">07 / Identity and place</p>
                <h2 id="identity-heading">
                  Recognition without stock imagery.
                </h2>
              </div>
            </div>
            <div className="space-y-4">
              <Breadcrumbs
                items={[
                  { label: "Harbour Group", href: "/organization" },
                  { label: "Properties", href: "/admin/properties" },
                  { label: "Anchor House" },
                ]}
              />
              <div className="flex items-center gap-3">
                <Avatar name="Ada Okafor" size="lg" tone="coral" />
                <PropertyImage name="Anchor House" />
                <StatusBadge tone="success">Active</StatusBadge>
              </div>
            </div>
          </section>

          <section
            className="gallery-section"
            aria-labelledby="workflow-heading"
          >
            <div className="gallery-section-head">
              <div>
                <p className="gallery-eyebrow">08 / Progress</p>
                <h2 id="workflow-heading">State stays explicit.</h2>
              </div>
            </div>
            <WorkflowTimeline
              steps={[
                {
                  id: "details",
                  label: "Property details",
                  description: "Name, type and operating context.",
                  state: "complete",
                },
                {
                  id: "review",
                  label: "Review",
                  description: "Confirm the place hierarchy.",
                  state: "current",
                },
                {
                  id: "create",
                  label: "Create property",
                  description: "Available after review.",
                  state: "pending",
                },
              ]}
            />
          </section>
        </div>

        <section
          className="gallery-section"
          aria-labelledby="collection-heading"
        >
          <div className="gallery-section-head">
            <div>
              <p className="gallery-eyebrow">09 / Collection controls</p>
              <h2 id="collection-heading">
                Search and filters share one toolbar.
              </h2>
            </div>
          </div>
          <FilterBar
            activeCount={gallerySearch ? 1 : 0}
            onClear={() => setGallerySearch("")}
          >
            <SearchField
              label="Search properties"
              placeholder="Search properties"
              value={gallerySearch}
              onValueChange={setGallerySearch}
              className="min-w-[14rem] flex-1 sm:max-w-sm"
            />
            <select
              aria-label="Property type"
              className="h-9 rounded-[var(--vms-radius-control)] border border-[var(--vms-line-strong)] bg-[var(--vms-surface)] px-3 text-sm"
            >
              <option>All types</option>
              <option>Residential</option>
              <option>Mixed use</option>
            </select>
          </FilterBar>
        </section>

        <section className="gallery-section" aria-labelledby="overlays-heading">
          <div className="gallery-section-head">
            <div>
              <p className="gallery-eyebrow">06 / Concentrated work</p>
              <h2 id="overlays-heading">Containers match the task.</h2>
            </div>
            <p>
              A short confirmation stays centered. Contextual editing keeps the
              source record visible beside it.
            </p>
          </div>
          <div className="gallery-overlay-actions">
            <Button variant="outline" onClick={() => setModalOpen(true)}>
              Open confirmation
            </Button>
            <Button variant="outline" onClick={() => setDrawerOpen(true)}>
              Open property details
            </Button>
          </div>
        </section>

        <footer className="gallery-footer">
          <span>Operations Hub / Foundations</span>
          <span>Black action. Charcoal data. Coral attention.</span>
        </footer>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Archive Cedar Court?"
        description="The property and its active relationships will no longer be available here."
        size="sm"
      >
        <p className="gallery-dialog-copy">
          This action can be reversed from the archived property filter.
        </p>
        <div className="gallery-dialog-actions">
          <Button variant="outline" onClick={() => setModalOpen(false)}>
            Keep property
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              setModalOpen(false);
              setSaved(false);
            }}
          >
            Archive property
          </Button>
        </div>
      </Modal>

      <SlideOver
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        title="Cedar Court"
        description="Site · Residential operations · Lagos"
      >
        <div className="gallery-drawer-content">
          <Input label="Display name" defaultValue="Cedar Court" />
          <Input label="Address" defaultValue="14 Cedar Avenue, Lagos" />
          <Card>
            <CardContent>
              <strong>Hierarchy context</strong>
              <p>Residential estate → Site → Main gate</p>
            </CardContent>
          </Card>
        </div>
        <div className="gallery-dialog-actions gallery-drawer-actions">
          <Button variant="outline" onClick={() => setDrawerOpen(false)}>
            Close
          </Button>
          <Button onClick={() => setSaved(true)}>Save changes</Button>
        </div>
      </SlideOver>
    </main>
  );
}
