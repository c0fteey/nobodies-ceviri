"use client";

import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Avatar from "@radix-ui/react-avatar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu } from "lucide-react";
import { signOut } from "next-auth/react";
import { navItems } from "@/lib/mock-data";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils";

type NavbarProps = {
  user?: {
    name?: string | null;
    image?: string | null;
  } | null;
};

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--nav-bg)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link
          href="/"
          className="shrink-0 text-sm font-semibold tracking-tight text-[var(--foreground)] sm:text-base"
        >
          <span className="text-[var(--accent)]">NBDS</span>xStaffTracker
        </Link>

        <NavigationMenu.Root className="hidden flex-1 md:flex md:justify-center">
          <NavigationMenu.List className="flex items-center gap-1">
            <NavigationMenu.Item>
              <Link
                href="/"
                className={cn(
                  "rounded-lg px-3 py-2 text-sm transition",
                  pathname === "/"
                    ? "bg-white/10 text-[var(--foreground)]"
                    : "text-[var(--muted)] hover:bg-white/5 hover:text-[var(--foreground)]",
                )}
              >
                Dashboard
              </Link>
            </NavigationMenu.Item>
            {navItems.map((item) => (
              <NavigationMenu.Item key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm transition",
                    pathname === item.href
                      ? "bg-white/10 text-[var(--foreground)]"
                      : "text-[var(--muted)] hover:bg-white/5 hover:text-[var(--foreground)]",
                  )}
                >
                  {item.label}
                </Link>
              </NavigationMenu.Item>
            ))}
          </NavigationMenu.List>
        </NavigationMenu.Root>

        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] md:hidden"
                aria-label="Menü"
              >
                <Menu className="h-4 w-4" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                className="z-50 min-w-48 rounded-xl border border-[var(--border)] bg-[var(--card)] p-1 shadow-xl"
              >
                <DropdownMenu.Item asChild>
                  <Link
                    href="/"
                    className="block rounded-lg px-3 py-2 text-sm outline-none hover:bg-white/5"
                  >
                    Dashboard
                  </Link>
                </DropdownMenu.Item>
                {navItems.map((item) => (
                  <DropdownMenu.Item key={item.href} asChild>
                    <Link
                      href={item.href}
                      className="block rounded-lg px-3 py-2 text-sm outline-none hover:bg-white/5"
                    >
                      {item.label}
                    </Link>
                  </DropdownMenu.Item>
                ))}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>

          <ThemeToggle />

          {user && (
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] py-1 pl-1 pr-2"
                >
                  <Avatar.Root className="inline-flex h-8 w-8 overflow-hidden rounded-lg">
                    <Avatar.Image src={user.image || undefined} alt="" />
                    <Avatar.Fallback className="flex h-full w-full items-center justify-center bg-[var(--accent)]/20 text-xs text-[var(--accent)]">
                      {(user.name || "A").slice(0, 1).toUpperCase()}
                    </Avatar.Fallback>
                  </Avatar.Root>
                  <span className="hidden max-w-28 truncate text-sm sm:inline">
                    {user.name}
                  </span>
                </button>
              </DropdownMenu.Trigger>
              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  align="end"
                  className="z-50 min-w-44 rounded-xl border border-[var(--border)] bg-[var(--card)] p-1 shadow-xl"
                >
                  <DropdownMenu.Item
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm outline-none hover:bg-white/5"
                    onSelect={() => signOut({ callbackUrl: "/login" })}
                  >
                    <LogOut className="h-4 w-4" />
                    Çıkış yap
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          )}
        </div>
      </div>
    </header>
  );
}
