import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { DetailPage } from "@/components/marketing/DetailPage";
import { solutionSlugs, solutions } from "@/components/marketing/content";
import {
  enrichPage,
  solutionDetails,
} from "@/components/marketing/page-details";

export function generateStaticParams() {
  return solutionSlugs.map((slug) => ({ slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = solutions[slug];
  if (!data) return {};
  return {
    title: `${data.title} | VMS Core`,
    description: data.description,
    alternates: { canonical: `/solutions/${slug}/` },
    openGraph: {
      title: `${data.title} | VMS Core`,
      description: data.description,
      url: `/solutions/${slug}/`,
      type: "article",
    },
  };
}
export default async function SolutionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = solutions[slug];
  if (!data) notFound();
  return (
    <DetailPage
      data={enrichPage(data, solutionDetails, slug)}
      kind="solution"
    />
  );
}
