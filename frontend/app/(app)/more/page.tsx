"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Archive, LogOut, Search, UserRound } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { useAuth } from "@/features/auth/AuthProvider";

const links = [
  { href: "/follow-ups", label: "Follow Ups", description: "People and open loops", icon: UserRound },
  { href: "/search", label: "Search", description: "Find anything you captured", icon: Search },
  { href: "/memories", label: "Memories", description: "Daily reflections", icon: Archive }
];

export default function MorePage() {
  const { logout, user } = useAuth();
  const router = useRouter();

  return (
    <div className="mx-auto max-w-3xl py-4 md:py-10">
      <header className="mb-8">
        <p className="text-xs uppercase tracking-[0.2em] text-paper-100/38">More</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-[-0.035em] text-paper-50">Your space.</h1>
        <p className="mt-3 text-sm text-paper-100/56">{user?.email}</p>
      </header>

      <div className="space-y-3">
        {links.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className="glass-panel flex items-center gap-4 rounded-[1.75rem] p-4 transition hover:bg-white/[0.08]">
              <div className="grid h-12 w-12 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-accent-100">
                <Icon className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <p className="font-medium text-paper-50">{item.label}</p>
                <p className="mt-1 text-sm text-paper-100/46">{item.description}</p>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-8">
        <Button
          variant="danger"
          icon={LogOut}
          onClick={async () => {
            await logout();
            router.replace("/login");
          }}
        >
          Logout
        </Button>
      </div>
    </div>
  );
}

