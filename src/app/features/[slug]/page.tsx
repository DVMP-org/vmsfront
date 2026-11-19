import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DetailPage } from "@/components/marketing/DetailPage";
import { featureSlugs, features } from "@/components/marketing/content";
import {
  enrichPage,
  featureDetails,
} from "@/components/marketing/page-details";

export function generateStaticParams() {
  return featureSlugs.map((slug) => ({ slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = features[slug];
  if (!data) return {};
  return {
    title: `${data.title} | VMS Core`,
    description: data.description,
    alternates: { canonical: `/features/${slug}/` },
    openGraph: {
      title: `${data.title} | VMS Core`,
      description: data.description,
      url: `/features/${slug}/`,
      type: "article",
    },
  };
}
export default async function FeaturePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = features[slug];
  if (!data) notFound();
  return (
    <DetailPage data={enrichPage(data, featureDetails, slug)} kind="feature" />
  );
}
