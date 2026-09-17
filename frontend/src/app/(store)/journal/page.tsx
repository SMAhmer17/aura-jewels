import Link from "next/link";
import { journalArticles } from "@/lib/mock-data/journal";
import { ProductImagePlaceholder } from "@/components/features/product/ProductImagePlaceholder";
import { Reveal } from "@/components/ui/Reveal";

export default function JournalPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="mb-12 text-center">
        <p className="text-xs uppercase tracking-widest text-gold">Journal</p>
        <h1 className="mt-2 text-3xl text-ink sm:text-4xl">Stories & Styling</h1>
      </div>

      <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-3">
        {journalArticles.map((article, i) => (
          <Reveal key={article.slug} delay={(i % 3) * 80}>
            <Link href={`/journal/${article.slug}`} className="group flex flex-col gap-3">
              <div className="aspect-[4/3] overflow-hidden rounded-(--radius-md) border border-border">
                <ProductImagePlaceholder
                  id={article.slug}
                  className="h-full w-full transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <span className="text-xs text-muted">
                {new Date(article.publishedAt).toLocaleDateString("en-PK", { month: "long", day: "numeric", year: "numeric" })}
              </span>
              <h2 className="text-lg text-ink">{article.title}</h2>
              <p className="text-sm text-muted">{article.excerpt}</p>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
