"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Archive, CalendarCheck, Home, Inbox, Lightbulb, LogOut, MoreHorizontal, Plus, Search, Sparkle, UserRound } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { useAuth } from "@/features/auth/AuthProvider";
import { cn } from "@/lib/utils";

const primaryNav = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/today", label: "Today", icon: CalendarCheck },
  { href: "/ideas", label: "Ideas", icon: Lightbulb },
  { href: "/follow-ups", label: "People", icon: UserRound }
];

const secondaryNav = [
  { href: "/search", label: "Search", icon: Search },
  { href: "/memories", label: "Memories", icon: Archive }
];

const mobileNav = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/inbox", label: "Inbox", icon: Inbox },
  { href: "/today", label: "Today", icon: CalendarCheck },
  { href: "/ideas", label: "Ideas", icon: Lightbulb },
  { href: "/more", label: "More", icon: MoreHorizontal }
];

function NavItem({ href, label, icon: Icon }: { href: string; label: string; icon: typeof Home }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex min-h-12 items-center gap-3 rounded-2xl px-3 text-sm transition",
        active ? "bg-white/[0.1] text-paper-50" : "text-paper-100/54 hover:bg-white/[0.07] hover:text-paper-50"
      )}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="h-5 w-5 shrink-0" aria-hidden />
      <span className="hidden xl:block">{label}</span>
      {active ? <span className="absolute right-3 h-1.5 w-1.5 rounded-full bg-accent-300 xl:right-4" /> : null}
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [loading, router, user]);

  if (loading || !user) {
    return (
      <main className="relative z-10 grid min-h-screen place-items-center px-6 text-paper-100/70">
        <div className="glass-panel rounded-3xl px-5 py-4 text-sm">Opening your space...</div>
      </main>
    );
  }

  return (
    <div className="relative z-10 min-h-screen pb-24 md:pb-0">
      <aside className="fixed left-4 top-4 z-30 hidden h-[calc(100vh-2rem)] w-[5.25rem] flex-col rounded-[2rem] border border-white/10 bg-ink-950/42 p-3 shadow-glass backdrop-blur-glass transition-all duration-300 hover:w-56 xl:w-56 md:flex">
        <Link href="/home" className="mb-6 flex min-h-12 items-center gap-3 rounded-2xl px-3 text-paper-50">
          <span className="grid h-9 w-9 place-items-center rounded-2xl border border-accent-300/18 bg-accent-300/12 text-accent-100">
            <Sparkle className="h-4 w-4" aria-hidden />
          </span>
          <span className="hidden text-sm font-semibold xl:block">ClearSpace</span>
        </Link>
        <nav className="space-y-1" aria-label="Primary">
          {primaryNav.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </nav>
        <div className="my-5 h-px bg-white/10" />
        <nav className="space-y-1" aria-label="Secondary">
          {secondaryNav.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}
        </nav>
        <div className="mt-auto">
          <Button
            variant="ghost"
            className="w-full justify-start px-3 text-paper-100/54 hover:text-paper-50"
            icon={LogOut}
            onClick={async () => {
              await logout();
              router.replace("/login");
            }}
          >
            <span className="hidden xl:block">Logout</span>
          </Button>
        </div>
      </aside>

      <main className="mx-auto w-full max-w-7xl px-4 pb-8 pt-5 sm:px-6 md:pl-28 md:pr-6 xl:pl-64">
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {pathname !== "/home" ? (
        <Link
          href="/home"
          aria-label="Capture a thought"
          className="fixed bottom-[5.75rem] right-5 z-40 grid h-14 w-14 place-items-center rounded-full border border-accent-300/35 bg-accent-300 text-ink-950 shadow-[0_16px_46px_rgba(34,211,238,0.24)] md:hidden"
        >
          <Plus className="h-6 w-6" aria-hidden />
        </Link>
      ) : null}

      <nav
        className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-5 rounded-[1.65rem] border border-white/10 bg-ink-950/72 p-1.5 shadow-glass backdrop-blur-glass md:hidden"
        aria-label="Mobile navigation"
      >
        {mobileNav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl text-[11px] transition",
                active ? "bg-white/[0.1] text-paper-50" : "text-paper-100/52"
              )}
            >
              <Icon className="h-5 w-5" aria-hidden />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

