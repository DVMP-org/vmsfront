import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DetailPage } from "@/components/marketing/DetailPage";
import { platformSlugs, platform } from "@/components/marketing/content";
import {
  enrichPage,
  platformDetails,
} from "@/components/marketing/page-details";

export function generateStaticParams() {
  return platformSlugs.map((slug) => ({ slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = platform[slug];
  if (!data) return {};
  return {
    title: `${data.title} | VMS Core`,
    description: data.description,
    alternates: { canonical: `/platform/${slug}/` },
    openGraph: {
      title: `${data.title} | VMS Core`,
      description: data.description,
      url: `/platform/${slug}/`,
      type: "article",
    },
  };
}
export default async function PlatformPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = platform[slug];
  if (!data) notFound();
  return (
    <DetailPage
      data={enrichPage(data, platformDetails, slug)}
      kind="platform"
    />
  );
}
