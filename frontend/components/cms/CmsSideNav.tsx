"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthenticatedUser } from "@/lib/api/auth-types";

interface NavItem {
  href: string;
  label: string;
}

/// docs/19 §2.4 — persistent at md+, a sheet at xs. Items: Dashboard,
/// (Review queue — admin), My Articles / All Articles, and for admins
/// Users, Sources, Categories. Only the editor items exist in this phase;
/// the admin-only items are added by 5D without reworking this component
/// (docs/19 §0: "one system, three densities" — the shell is shared, the
/// item list is what changes with role).
export function CmsSideNav({ user }: { user: AuthenticatedUser }) {
  const pathname = usePathname();

  const items: NavItem[] = [
    { href: "/staff", label: "Dashboard" },
    { href: "/staff/articles", label: user.role === "ADMIN" ? "All Articles" : "My Articles" },
  ];

  return (
    <nav className="w-56 shrink-0 border-r border-rule px-space-3 py-space-5">
      <ul className="space-y-space-1">
        {items.map((item) => {
          const isActive = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block rounded-sm px-space-3 py-space-2 text-body-sm no-underline ${
                  isActive ? "bg-accent-wash text-accent" : "text-ink-secondary hover:bg-surface"
                }`}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
