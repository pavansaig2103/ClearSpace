"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/features/auth/AuthProvider";

export default function IndexPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? "/home" : "/login");
  }, [loading, router, user]);

  return (
    <main className="grid min-h-screen place-items-center px-6 text-paper-50">
      <p className="text-sm text-paper-100/70">Opening ClearSpace...</p>
    </main>
  );
}

