"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, Sparkle } from "lucide-react";

import { ErrorState } from "@/components/feedback/InlineState";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/features/auth/AuthProvider";
import { friendlyError } from "@/lib/utils";

export default function RegisterPage() {
  const { register, user, loading } = useAuth();
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [timezone, setTimezone] = useState("Asia/Calcutta");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  }, []);

  useEffect(() => {
    if (!loading && user) router.replace("/home");
  }, [loading, router, user]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register({ name, email, password, timezone });
      router.replace("/home");
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="glass-panel-strong rounded-[2rem] p-6 shadow-ambient">
      <div className="mb-8">
        <div className="mb-5 grid h-11 w-11 place-items-center rounded-2xl border border-accent-300/20 bg-accent-300/12 text-accent-100">
          <Sparkle className="h-5 w-5" aria-hidden />
        </div>
        <p className="text-sm uppercase tracking-[0.18em] text-paper-100/42">ClearSpace</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-paper-50">Start with a blank mind.</h1>
        <p className="mt-3 text-sm leading-6 text-paper-100/58">Capture first. Organize second. Think less.</p>
      </div>

      <form className="space-y-4" onSubmit={onSubmit}>
        <label className="block">
          <span className="mb-2 block text-sm text-paper-100/62">Name</span>
          <Input value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" required />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm text-paper-100/62">Email</span>
          <Input type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />
        </label>
        <label className="block">
          <span className="mb-2 block text-sm text-paper-100/62">Password</span>
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        {error ? <ErrorState message={error} /> : null}
        <Button type="submit" variant="primary" size="lg" icon={ArrowRight} disabled={submitting} className="w-full">
          {submitting ? "Creating..." : "Create ClearSpace"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-paper-100/54">
        Already have a space?{" "}
        <Link className="text-accent-100 hover:text-accent-300" href="/login">
          Sign in
        </Link>
      </p>
    </section>
  );
}

