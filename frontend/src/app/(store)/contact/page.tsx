"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Mail, Phone } from "lucide-react";
import { useSettings } from "@/lib/services/settings-service";
import { sendMessage } from "@/lib/services/messages-service";
import { errorMessage } from "@/lib/api/client";
import { useCustomerAuthStore } from "@/store/customer-auth-store";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/ui/Reveal";

const blank = { name: "", email: "", phone: "", orderNumber: "", message: "", website: "" };

function ContactForm() {
  const settings = useSettings();
  const params = useSearchParams();
  const account = useCustomerAuthStore((s) => s.customer);
  const [form, setForm] = useState({ ...blank, orderNumber: params.get("order") ?? "" });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  // Signed-in customers start with their details filled in (only into fields still empty).
  useEffect(() => {
    if (!account) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm((prev) => ({ ...prev, name: prev.name || account.name, email: prev.email || account.email, phone: prev.phone || (account.phone ?? "") }));
  }, [account]);

  const update = (field: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSending(true);
    setError("");
    try {
      await sendMessage({ ...form, orderNumber: form.orderNumber.trim() });
      setSent(true);
    } catch (err) {
      setError(errorMessage(err, "We could not send your message. Please try again."));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="mb-12 text-center">
        <p className="text-xs uppercase tracking-widest text-gold">Get in Touch</p>
        <h1 className="mt-2 text-3xl text-ink sm:text-4xl">We&apos;d love to hear from you</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted">
          Questions about an order, sizing, or a custom request? Reach out and our team will respond shortly.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
        <Reveal className="flex flex-col gap-6 lg:col-span-1">
          <div className="flex items-start gap-3">
            <Mail size={18} className="mt-0.5 text-gold" />
            <div>
              <p className="text-sm text-ink">Email</p>
              <p className="text-sm text-muted">{settings.supportEmail}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone size={18} className="mt-0.5 text-gold" />
            <div>
              <p className="text-sm text-ink">Phone</p>
              <p className="text-sm text-muted">{settings.supportPhone}</p>
            </div>
          </div>
          <p className="text-xs text-muted">We typically respond within 1-2 business days.</p>
          <p className="text-xs text-muted">
            Just want to know where your order is?{" "}
            <Link href="/track-order" className="text-ink underline underline-offset-4">
              Track it here
            </Link>
            .
          </p>
        </Reveal>

        <Reveal delay={100} className="lg:col-span-2">
          {sent ? (
            <div role="status" className="flex flex-col items-start gap-3 rounded-(--radius-md) border border-border p-8">
              <CheckCircle2 size={28} className="text-gold" />
              <h2 className="text-2xl text-ink">Thank you, we have your message</h2>
              <p className="text-sm text-muted">
                We will reply to {form.email} within 1-2 business days. For anything urgent, call us on {settings.supportPhone}.
              </p>
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  setForm({ ...blank });
                  setSent(false);
                }}
              >
                Send another message
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Input label="Name" placeholder="Enter your name" required maxLength={100} value={form.name} onChange={update("name")} />
                <Input label="Email" placeholder="Enter your email address" type="email" required value={form.email} onChange={update("email")} hint="We reply to this address" />
              </div>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Input label="Phone (optional)" placeholder="e.g. 0300 1234567" type="tel" value={form.phone} onChange={update("phone")} />
                <Input label="Order number (optional)" placeholder="e.g. AJ-2026-1001" value={form.orderNumber} onChange={update("orderNumber")} hint="If your question is about an order" />
              </div>
              <Textarea label="Message" placeholder="How can we help you?" required rows={5} minLength={10} maxLength={2000} value={form.message} onChange={update("message")} hint="At least 10 characters" />

              {/* Hidden from people. Bots fill it in, and messages that have it are ignored. */}
              <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <label>
                  Website
                  <input type="text" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={update("website")} />
                </label>
              </div>

              {error && (
                <p role="alert" className="text-sm text-error">
                  {error}
                </p>
              )}
              <Button type="submit" variant="primary" size="lg" className="self-start" disabled={sending}>
                {sending ? "Sending..." : "Send Message"}
              </Button>
            </form>
          )}
        </Reveal>
      </div>
    </div>
  );
}

export default function ContactPage() {
  return (
    <Suspense fallback={null}>
      <ContactForm />
    </Suspense>
  );
}
