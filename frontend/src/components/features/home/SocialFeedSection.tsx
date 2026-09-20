"use client";

import { useHomeContent } from "@/lib/services/home-content-service";
import { Reveal } from "@/components/ui/Reveal";
import { ProductImagePlaceholder } from "@/components/features/product/ProductImagePlaceholder";
import { InstagramIcon, FacebookIcon, TikTokIcon } from "@/components/layout/SocialIcons";

export function SocialFeedSection() {
  const { social } = useHomeContent();

  const channels = [
    { label: "Instagram", href: social.instagramUrl, Icon: InstagramIcon },
    { label: "TikTok", href: social.tiktokUrl, Icon: TikTokIcon },
    { label: "Facebook", href: social.facebookUrl, Icon: FacebookIcon },
  ].filter((c) => c.href);

  return (
    <section className="border-t border-border bg-cream/50 px-4 py-20 sm:px-6">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mx-auto mb-10 max-w-xl text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-gold">{social.eyebrow}</p>
          <h2 className="mt-3 text-3xl text-ink sm:text-4xl">{social.handle}</h2>
          <p className="mt-3 text-sm text-muted">{social.description}</p>
        </Reveal>

        {social.posts.length > 0 && (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
            {social.posts.map((post, i) => (
              <Reveal key={post.id} delay={(i % 6) * 60}>
                <a
                  href={post.url || social.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={post.caption}
                  className="group relative block aspect-square overflow-hidden rounded-(--radius-sm)"
                >
                  <ProductImagePlaceholder
                    id={`social-${post.id}`}
                    className="h-full w-full transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-ink/0 text-ivory opacity-0 transition-all duration-300 group-hover:bg-ink/55 group-hover:opacity-100">
                    <InstagramIcon size={26} />
                  </span>
                </a>
              </Reveal>
            ))}
          </div>
        )}

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {channels.map(({ label, href, Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-12 items-center gap-2 rounded-(--radius-sm) border border-gold px-6 text-sm text-ink transition-colors hover:bg-gold/10"
            >
              <Icon size={16} />
              {label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
