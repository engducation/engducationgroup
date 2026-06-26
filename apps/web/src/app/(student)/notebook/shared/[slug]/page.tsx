import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

import { getCollectionByShareSlugAction } from "@/features/vocabulary";
import { SharedCollectionClient, type SharedCollectionData } from "./shared-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getCollectionByShareSlugAction(slug);
  if (!result) return { title: "Không tìm thấy bộ sưu tập" };
  return {
    title: `${result.collection.name} · Shared Collection`,
    description: result.collection.description ?? "Chia sẻ bộ sưu tập từ vựng",
  };
}

export default async function SharedCollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getCollectionByShareSlugAction(slug);
  if (!data) notFound();

  const session = await auth.api.getSession({ headers: await headers() });
  const currentUserId = session?.user?.id ?? null;

  const view: SharedCollectionData = {
    id: data.collection.id,
    name: data.collection.name,
    description: data.collection.description,
    color: data.collection.color,
    ownerName: null, // Anonymous in public view (privacy)
    createdAt:
      data.collection.createdAt instanceof Date
        ? data.collection.createdAt.toISOString()
        : String(data.collection.createdAt),
    items: data.items.map((i) => ({
      word: i.word,
      phonetic: i.phonetic ?? null,
      partOfSpeech: i.partOfSpeech,
      meaning: i.meaning,
      examples: null,
      level: i.level ?? null,
      topic: i.topic ?? null,
    })),
  };

  return (
    <SharedCollectionClient
      slug={slug}
      collection={view}
      currentUserId={currentUserId}
    />
  );
}