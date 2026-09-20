"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useCustomerAuthStore } from "@/store/customer-auth-store";
import { customerLogin, customerLogout, customerRegister } from "@/lib/services/auth-service";
import { errorMessage } from "@/lib/api/client";
import { toast } from "@/store/toast-store";
import { cn } from "@/lib/utils/cn";

type Mode = "signin" | "register";

const BENEFITS = [
  "See everything you have bought, all in one place",
  "Follow your active orders from placed to delivered",
  "Check out faster with your details filled in",
];

export function AccountPanel({ onClose }: { onClose: () => void }) {
  const { isAuthenticated, customer } = useCustomerAuthStore();
  const [mode, setMode] = useState<Mode>("signin");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const account =
        mode === "register"
          ? await customerRegister({ name: form.name.trim(), email: form.email, password: form.password })
          : await customerLogin(form.email, form.password);
      toast({ title: mode === "register" ? "Account created" : "Signed in", description: `Welcome, ${account.name}`, variant: "success" });
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSubmitting(false);
    }
  }

  if (isAuthenticated) {
    return (
      <div className="flex flex-col gap-6 px-6 py-8">
        <div>
          <p className="text-xs uppercase tracking-widest text-gold">Signed in</p>
          <p className="mt-1 text-2xl text-ink">{customer?.name}</p>
          <p className="text-sm text-muted">{customer?.email}</p>
        </div>
        <div className="flex flex-col divide-y divide-ink/10 border-y border-ink/10 text-base">
          <Link href="/account" onClick={onClose} className="py-4 text-ink hover:text-gold">
            My Orders
          </Link>
          <Link href="/track-order" onClick={onClose} className="py-4 text-ink hover:text-gold">
            Track an Order
          </Link>
          <Link href="/wishlist" onClick={onClose} className="py-4 text-ink hover:text-gold">
            My Wishlist
          </Link>
          <Link href="/cart" onClick={onClose} className="py-4 text-ink hover:text-gold">
            My Cart
          </Link>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            customerLogout();
            toast({ title: "Signed out" });
            onClose();
          }}
        >
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 px-6 py-8">
      <div className="grid grid-cols-2 border-b border-ink/10">
        {(["signin", "register"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m);
              setError("");
            }}
            className={cn(
              "-mb-px border-b-2 pb-3 text-sm uppercase tracking-widest transition-colors",
              mode === m ? "border-gold text-ink" : "border-transparent text-muted hover:text-ink",
            )}
          >
            {m === "signin" ? "Sign In" : "Create Account"}
          </button>
        ))}
      </div>

      {mode === "register" && (
        <div className="rounded-(--radius-md) border border-gold/40 bg-gold/10 p-4">
          <p className="text-sm text-ink">Why create an account?</p>
          <ul className="mt-2 flex flex-col gap-1.5 text-xs text-muted">
            {BENEFITS.map((benefit) => (
              <li key={benefit} className="flex gap-2">
                <Check size={14} className="mt-px shrink-0 text-gold" />
                {benefit}
              </li>
            ))}
          </ul>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {mode === "register" && (
          <Input
            label="Full Name" placeholder="Enter your full name"
            required
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
          />
        )}
        <Input
          label="Email" placeholder="Enter your email address"
          type="email"
          required
          value={form.email}
          onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
        />
        <Input
          label="Password"
          type="password"
          required
          placeholder={mode === "register" ? "Create a password" : "Enter your password"}
          minLength={mode === "register" ? 8 : undefined}
          hint={mode === "register" ? "At least 8 characters" : undefined}
          value={form.password}
          onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
        />
        {error && (
          <p role="alert" className="text-sm text-error">
            {error}
          </p>
        )}
        <Button type="submit" variant="primary" size="md" className="mt-2 w-full" disabled={submitting}>
          {submitting ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
        </Button>
      </form>
      <p className="text-center text-xs text-muted">
        An account is optional. You can always check out as a guest and follow your order with its order number on the{" "}
        <Link href="/track-order" onClick={onClose} className="text-ink underline underline-offset-4">
          Track Order
        </Link>{" "}
        page.
      </p>
    </div>
  );
}

export function AccountDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Drawer open={open} onClose={onClose} title="Account">
      <AccountPanel onClose={onClose} />
    </Drawer>
  );
}
