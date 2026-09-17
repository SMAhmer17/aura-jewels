"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuthStore } from "@/store/admin-auth-store";
import { Logo } from "@/components/layout/Logo";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function AdminLoginPage() {
  const router = useRouter();
  const login = useAdminAuthStore((s) => s.login);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    login(email);
    router.push("/dashboard");
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
            label="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Button type="submit" variant="primary" size="lg" className="mt-2">
            Sign In
          </Button>
        </form>
        <p className="mt-6 text-center text-xs text-muted">
          Demo mode: any email and password will work.
        </p>
      </div>
    </div>
  );
}
