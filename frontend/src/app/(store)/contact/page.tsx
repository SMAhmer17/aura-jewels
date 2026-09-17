"use client";

import { useState, type FormEvent } from "react";
import { Mail, Phone } from "lucide-react";
import { useSettings } from "@/lib/services/settings-service";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { toast } from "@/store/toast-store";
import { Reveal } from "@/components/ui/Reveal";

export default function ContactPage() {
  const settings = useSettings();
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    toast({ title: "Message sent", description: "We'll get back to you within 1-2 business days.", variant: "success" });
    setSent(true);
    setForm({ name: "", email: "", message: "" });
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
      <div className="mb-12 text-center">
        <p className="text-xs uppercase tracking-widest text-gold">Get in Touch</p>
        <h1 className="mt-2 text-3xl text-ink sm:text-4xl">We&apos;d love to hear from you</h1>
        <p className="mx-auto mt-3 max-w-md text-sm text-muted">
          Questions about an order, sizing, or a custom request? Reach out and our team will
          respond shortly.
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
        </Reveal>

        <Reveal delay={100} className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <Input
              label="Name"
              required
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            />
            <Input
              label="Email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            />
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-ink">Message</label>
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))}
                className="rounded-(--radius-sm) border border-border bg-surface px-4 py-3 text-base text-ink placeholder:text-muted focus:border-gold focus:outline-none"
              />
            </div>
            <Button type="submit" variant="primary" size="lg" className="self-start">
              Send Message
            </Button>
            {sent && <p className="text-sm text-success">Thanks! Your message has been sent.</p>}
          </form>
        </Reveal>
      </div>
    </div>
  );
}
