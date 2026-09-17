import { Diamond } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { LinkButton } from "@/components/ui/LinkButton";

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="flex justify-center border-b border-border px-6 py-6">
        <Logo />
      </header>

      <main className="mx-auto flex w-full max-w-lg flex-1 flex-col items-center justify-center gap-5 px-6 py-20 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-gold text-gold">
          <Diamond size={20} />
        </span>
        <p className="text-xs uppercase tracking-widest text-gold">Error 404</p>
        <h1 className="text-3xl text-ink sm:text-4xl">This page has wandered off</h1>
        <p className="text-sm text-muted">
          The page you&apos;re looking for doesn&apos;t exist or may have been moved. Let&apos;s
          get you back to something beautiful.
        </p>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row">
          <LinkButton href="/" variant="primary" size="md">
            Return Home
          </LinkButton>
          <LinkButton href="/shop" variant="outline" size="md">
            Continue Shopping
          </LinkButton>
        </div>
      </main>

      <footer className="border-t border-border px-6 py-6 text-center text-xs text-muted">
        &copy; {new Date().getFullYear()} Aura Jewels. All rights reserved.
      </footer>
    </div>
  );
}
