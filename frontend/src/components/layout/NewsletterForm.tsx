"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { toast } from "@/store/toast-store";

export function NewsletterForm() {
  const [email, setEmail] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email) return;
    toast({ title: "You're subscribed", description: "Thank you for joining Aura Jewels.", variant: "success" });
    setEmail("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-3 sm:flex-row">
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Your email address"
        aria-label="Email address"
        className="h-12 flex-1 rounded-(--radius-sm) border border-border-dark bg-transparent px-4 text-base text-ivory placeholder:text-muted focus:border-gold focus:outline-none"
      />
      <Button type="submit" variant="gold" size="md">
        Subscribe
      </Button>
    </form>
  );
}
