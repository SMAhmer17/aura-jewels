import { policies } from "@/lib/content/policies";
import { ComingSoon } from "@/components/ui/ComingSoon";
import { Reveal } from "@/components/ui/Reveal";

export default async function PolicyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const policy = policies[slug];

  if (!policy) {
    return (
      <ComingSoon
        eyebrow="Policies"
        title="Policy not found"
        description="This policy page doesn't exist yet."
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
      <p className="text-xs uppercase tracking-widest text-gold">Policy</p>
      <h1 className="mt-2 text-3xl text-ink sm:text-4xl">{policy.title}</h1>
      <p className="mt-2 text-xs text-muted">Last updated: {policy.updated}</p>

      <div className="mt-10 flex flex-col gap-8">
        {policy.sections.map((section, i) => (
          <Reveal key={section.heading} delay={i * 80}>
            <h2 className="mb-2 text-lg text-ink">{section.heading}</h2>
            <p className="text-sm leading-relaxed text-muted">{section.body}</p>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
