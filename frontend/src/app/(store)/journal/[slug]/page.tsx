import Link from "next/link";
import { notFound } from "next/navigation";
import { journalArticles } from "@/lib/mock-data/journal";
import { ProductImagePlaceholder } from "@/components/features/product/ProductImagePlaceholder";

export default async function JournalArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = journalArticles.find((a) => a.slug === slug);

  if (!article) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <Link href="/journal" className="text-xs text-muted hover:text-ink">
        &larr; Back to Journal
      </Link>

      <p className="mt-6 text-xs text-muted">
        {new Date(article.publishedAt).toLocaleDateString("en-PK", { month: "long", day: "numeric", year: "numeric" })}
      </p>
      <h1 className="mt-2 text-3xl text-ink sm:text-4xl">{article.title}</h1>

      <div className="my-8 aspect-[16/9] overflow-hidden rounded-(--radius-md) border border-border">
        <ProductImagePlaceholder id={article.slug} className="h-full w-full" />
      </div>

      <div className="flex flex-col gap-5">
        {article.content.map((paragraph, i) => (
          <p key={i} className="text-base leading-relaxed text-ink">
            {paragraph}
          </p>
        ))}
      </div>
    </div>
  );
}
