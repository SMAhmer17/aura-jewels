"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuthStore } from "@/store/admin-auth-store";
import { adminLogin } from "@/lib/services/auth-service";
import { errorMessage } from "@/lib/api/client";
import { Logo } from "@/components/layout/Logo";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function AdminLoginPage() {
  const router = useRouter();
  const isAuthenticated = useAdminAuthStore((s) => s.isAuthenticated);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Someone who is already signed in goes straight to the dashboard.
  useEffect(() => {
    useAdminAuthStore.persist.rehydrate();
  }, []);
  useEffect(() => {
    if (isAuthenticated) router.replace("/dashboard");
  }, [isAuthenticated, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await adminLogin(email, password);
      router.push("/dashboard");
    } catch (err) {
      setError(errorMessage(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-cream px-6">
      <div className="w-full max-w-sm rounded-(--radius-md) border border-border bg-surface p-8 shadow-(--shadow-soft)">
        <div className="mb-6 flex justify-center">
          <Logo />
        </div>
        <p className="mb-6 text-center text-xs uppercase tracking-widest text-gold">Admin Login</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Email" placeholder="Enter your email address"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Password" placeholder="Enter your password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <p role="alert" className="text-sm text-error">
              {error}
            </p>
          )}
          <Button type="submit" variant="primary" size="lg" className="mt-2" disabled={submitting}>
            {submitting ? "Signing in..." : "Sign In"}
          </Button>
        </form>
      </div>
    </div>
  );
}
