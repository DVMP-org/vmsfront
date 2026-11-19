import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, ArrowUpRight, Check, ChevronRight } from "lucide-react";
import {
  CTA,
  Eyebrow,
  MarketingFrame,
} from "@/components/marketing/MarketingFrame";
import { MarketingPageIllustration } from "@/components/marketing/MarketingPageIllustration";
import { getGuide, guides } from "@/components/marketing/guides";

export function generateStaticParams() {
  return guides.map(({ slug }) => ({ slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) return {};
  return {
    title: `${guide.title} | VMS Core Guides`,
    description: guide.description,
    alternates: { canonical: `/resources/guides/${slug}/` },
    openGraph: {
      title: `${guide.title} | VMS Core Guides`,
      description: guide.description,
      url: `/resources/guides/${slug}/`,
      type: "article",
    },
  };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const guide = getGuide(slug);
  if (!guide) notFound();
  return (
    <MarketingFrame>
      <main className="mk-guide-page">
        <section className="mk-guide-hero">
          <div>
            <div className="mk-breadcrumb">
              <Link href="/">Home</Link>
              <ChevronRight size={14} />
              <Link href="/resources">Resources</Link>
              <ChevronRight size={14} />
              <span>{guide.category}</span>
            </div>
            <Eyebrow>{guide.category}</Eyebrow>
            <h1>{guide.title}</h1>
            <p className="mk-lead">{guide.intro}</p>
            <div className="mk-hero-actions">
              <CTA>Get started</CTA>
              <CTA href="/contact" secondary>
                Talk to our team
              </CTA>
            </div>
          </div>
          <MarketingPageIllustration
            variant={guide.illustration}
            title={guide.title}
          />
        </section>
        <div className="mk-guide-layout">
          <article className="mk-guide-article">
            {guide.sections.map((section, index) => (
              <section key={section.heading}>
                <span className="mk-guide-section-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h2>{section.heading}</h2>
                <p>{section.body}</p>
                {section.bullets && (
                  <ul>
                    {section.bullets.map((bullet) => (
                      <li key={bullet}>
                        <Check size={15} />
                        {bullet}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </article>
          <aside className="mk-guide-aside">
            <Eyebrow>Key takeaways</Eyebrow>
            <ul>
              {guide.takeaways.map((item) => (
                <li key={item}>
                  <Check size={14} />
                  {item}
                </li>
              ))}
            </ul>
            <b>Explore next</b>
            {guide.related.map(({ label, href }) => (
              <Link key={href} href={href}>
                {label}
                <ArrowUpRight size={14} />
              </Link>
            ))}
          </aside>
        </div>
        <section className="mk-guide-cta">
          <div>
            <Eyebrow>Put the workflow in context</Eyebrow>
            <h2>See how VMS Core fits your property operation.</h2>
            <p>
              Review the relevant product capabilities or share your operating
              requirements with the team.
            </p>
          </div>
          <div className="mk-hero-actions">
            <CTA>Get started</CTA>
            <CTA href="/contact" secondary>
              Talk to our team
            </CTA>
          </div>
        </section>
        <section className="mk-guide-back">
          <Link href="/resources">
            <ArrowRight size={15} /> Browse all guides
          </Link>
        </section>
      </main>
    </MarketingFrame>
  );
}
