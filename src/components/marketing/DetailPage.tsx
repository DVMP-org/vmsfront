import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, ChevronRight } from "lucide-react";
import type { MarketingContent } from "./content";
import { CTA, Eyebrow, MarketingFrame } from "./MarketingFrame";
import type { MarketingEnrichment } from "./page-details";
import { MarketingPageIllustration } from "./MarketingPageIllustration";

export function DetailPage({
  data,
  kind,
}: {
  data: MarketingContent & MarketingEnrichment;
  kind: "solution" | "feature" | "platform";
}) {
  const related: { label: string; href: string }[] = data.related?.length
    ? data.related
    : [
        { label: "Product overview", href: "/product" },
        { label: "Integrations", href: "/platform/integrations" },
        { label: "Pricing", href: "/pricing" },
      ];
  return (
    <MarketingFrame>
      <main className="mk-detail">
        <section className="mk-detail-hero mk-detail-hero-grid">
          <div>
            <div className="mk-breadcrumb">
              <Link href="/">Home</Link>
              <ChevronRight size={14} />
              <span>{data.eyebrow}</span>
            </div>
            <Eyebrow>{data.eyebrow}</Eyebrow>
            <h1>{data.heading}</h1>
            <p className="mk-lead">{data.intro}</p>
            <div className="mk-hero-actions">
              <CTA>Get started</CTA>
              <CTA href="/contact" secondary>
                Talk to our team
              </CTA>
            </div>
            <p className="mk-status-note">
              <Check size={15} /> Product capabilities are described according
              to current availability.
            </p>
          </div>
          <MarketingPageIllustration
            variant={data.illustration}
            title={data.title}
          />
        </section>
        <section className="mk-detail-body">
          <div className="mk-detail-main">
            <Eyebrow>
              {kind === "solution"
                ? "Domain capabilities"
                : kind === "platform"
                  ? "Platform capabilities"
                  : "Product capabilities"}
            </Eyebrow>
            <h2>{data.overviewHeading || data.sectionHeading}</h2>
            <p className="mk-body">{data.overview || data.sectionText}</p>
            <div className="mk-capability-grid">
              {(
                data.capabilities ||
                data.points.map((title) => ({
                  title,
                  description: data.sectionText,
                }))
              ).map(({ title, description }, i) => (
                <article key={title}>
                  <span>0{i + 1}</span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </article>
              ))}
            </div>
            <div className="mk-example-scenario">
              <span>Example operating scenario</span>
              <p>{data.scenario || data.sectionText}</p>
            </div>
            <div className="mk-availability">
              <b>Availability and fit</b>
              <p>
                Configuration can vary by organization, provider and enabled
                modules. Confirm provider-specific requirements and supported
                connections with your team before rollout.
              </p>
            </div>
          </div>
          <aside className="mk-detail-aside">
            <Eyebrow>Typical workflow</Eyebrow>
            <h3>{data.sectionHeading}</h3>
            <p>{data.sectionText}</p>
            <div className="mk-detail-points">
              {data.points.map((point, i) => (
                <div key={point}>
                  <span>0{i + 1}</span>
                  <Check size={17} />
                  <p>{point}</p>
                </div>
              ))}
            </div>
            <Link href="/product">
              Explore the product <ArrowUpRight size={15} />
            </Link>
          </aside>
        </section>
        <section className="mk-workflow-section">
          <div>
            <Eyebrow>How the work moves</Eyebrow>
            <h2>One step leads into the next.</h2>
            <p>
              Keep records and responsibilities connected as the work moves
              between people and teams.
            </p>
          </div>
          <div className="mk-workflow-steps">
            {data.workflow.map(({ step, title, description }, i) => (
              <article key={step}>
                <span>{step}</span>
                <h3>{title}</h3>
                <p>{description}</p>
                {i < data.workflow.length - 1 && <ArrowRight />}
              </article>
            ))}
          </div>
        </section>
        <section className="mk-related">
          <div>
            <Eyebrow>Continue exploring</Eyebrow>
            <h2>Related VMS Core pages</h2>
          </div>
          <div>
            {related.map(({ label, href }) => (
              <Link href={href} key={href}>
                {label}
                <ArrowRight size={16} />
              </Link>
            ))}
          </div>
        </section>
        <section className="mk-small-cta">
          <h2>
            {kind === "platform"
              ? "Discuss your operating requirements."
              : "Bring your property operations together."}
          </h2>
          <p>
            {kind === "platform"
              ? "Talk with the team about provider availability, multi-site needs and current product support."
              : "Start with an organization and add the workflows that fit your sites."}
          </p>
          <div className="mk-hero-actions">
            <CTA>Get started</CTA>
            <CTA href="/contact" secondary>
              Talk to our team
            </CTA>
          </div>
        </section>
      </main>
    </MarketingFrame>
  );
}
