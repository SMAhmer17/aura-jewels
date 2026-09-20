import Link from "next/link";
import { NewsletterForm } from "@/components/layout/NewsletterForm";
import { InstagramIcon, FacebookIcon, TikTokIcon } from "@/components/layout/SocialIcons";
import { Logo } from "@/components/layout/Logo";

const socialLinks = [
  { label: "Instagram", href: "https://www.instagram.com/aurajewelsbyzas/", Icon: InstagramIcon },
  { label: "Facebook", href: "https://www.facebook.com/aurajewelsbyzas/", Icon: FacebookIcon },
  { label: "TikTok", href: "https://www.tiktok.com/@aurajewelsbyzas", Icon: TikTokIcon },
];

const shopLinks = [
  { label: "Rings", href: "/shop/rings" },
  { label: "Necklaces", href: "/shop/necklaces" },
  { label: "Earrings", href: "/shop/earrings" },
  { label: "Bracelets", href: "/shop/bracelets" },
];

const helpLinks = [
  { label: "Track Your Order", href: "/track-order" },
  { label: "Contact", href: "/contact" },
  { label: "FAQ", href: "/faq" },
  { label: "Shipping & Returns", href: "/policies/shipping-returns" },
  { label: "Care Guide", href: "/policies/care-guide" },
];

const companyLinks = [
  { label: "Our Story", href: "/about" },
  { label: "Journal", href: "/journal" },
  { label: "Privacy Policy", href: "/policies/privacy" },
  { label: "Terms of Service", href: "/policies/terms" },
];

export function Footer() {
  return (
    <footer className="border-t border-border-dark bg-ink text-ivory">
      <div className="mx-auto max-w-7xl px-6 py-16">
        {/* Single column through tablet widths, then straight to the full
            5-column desktop layout — an intermediate 2-3 column state
            splits Brand/Shop/Help/Company unevenly and looks unfinished. */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-5">
          <div className="flex flex-col items-start gap-4 lg:col-span-2">
            <Logo className="items-start text-ivory" />
            <p className="max-w-xs text-sm text-muted">
              Premium jewellery crafted for every moment. Based in Pakistan, made to last a
              lifetime.
            </p>
            <NewsletterForm />
            <div className="mt-2 flex items-center gap-4">
              {socialLinks.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-ivory hover:text-gold"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          <FooterColumn title="Shop" links={shopLinks} />
          <FooterColumn title="Help" links={helpLinks} />
          <FooterColumn title="Company" links={companyLinks} />
        </div>

        <div className="mt-16 flex items-center justify-center border-t border-border-dark pt-6 text-xs text-muted">
          <span>&copy; {new Date().getFullYear()} Aura Jewels. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: { label: string; href: string }[] }) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-xs uppercase tracking-widest text-gold">{title}</span>
      {links.map((link) => (
        <Link key={link.href} href={link.href} className="text-sm text-muted hover:text-ivory">
          {link.label}
        </Link>
      ))}
    </div>
  );
}
