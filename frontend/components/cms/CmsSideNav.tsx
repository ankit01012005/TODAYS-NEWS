"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthenticatedUser } from "@/lib/api/auth-types";

interface NavItem {
  href: string;
  label: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

/// docs/19 §2.4 — persistent at md+, a horizontal rail at xs. Items:
/// Dashboard, (Review queue — admin), My Articles / All Articles, and for
/// admins Users, Sources, Categories (docs/19 §0: "one system, three
/// densities" — the shell is shared, the item list is what changes with
/// role). Admin items are grouped so the desk (editorial) and the
/// platform (management) read as two jobs.
export function CmsSideNav({ user }: { user: AuthenticatedUser }) {
  const pathname = usePathname();
  const isAdmin = user.role === "ADMIN";

  const groups: NavGroup[] = [
    {
      label: "Desk",
      items: [
        { href: "/staff", label: "Dashboard" },
        ...(isAdmin ? [{ href: "/staff/review", label: "Review queue" }] : []),
        { href: "/staff/articles", label: isAdmin ? "All articles" : "My articles" },
      ],
    },
    ...(isAdmin
      ? [
          {
            label: "Newsroom",
            items: [
              { href: "/staff/users", label: "Users" },
              { href: "/staff/sources", label: "Sources" },
              { href: "/staff/categories", label: "Categories" },
              { href: "/staff/social", label: "Social picks" },
            ],
          },
        ]
      : []),
  ];

  const isActive = (href: string) => (href === "/staff" ? pathname === href : pathname.startsWith(href));

  return (
    <nav
      aria-label="Back-office"
      className="no-scrollbar shrink-0 overflow-x-auto border-b border-rule bg-paper md:sticky md:top-14 md:h-[calc(100vh-56px)] md:w-60 md:overflow-y-auto md:border-b-0 md:border-r"
    >
      <div className="flex gap-x-space-5 px-space-4 md:flex-col md:gap-y-space-6 md:px-space-3 md:py-space-5">
        {groups.map((group) => (
          <div key={group.label} className="flex items-center gap-x-space-1 md:block">
            <p className="hidden px-space-3 pb-space-2 text-label text-ink-faint md:block">{group.label}</p>
            <ul className="flex gap-x-space-1 md:flex-col md:gap-y-px">
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href} className="shrink-0">
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`relative block rounded-sm px-space-3 py-space-2 text-body-sm no-underline transition-colors duration-(--duration-fast) md:py-[7px] ${
                        active
                          ? "bg-accent-wash font-medium text-accent md:before:absolute md:before:top-1.5 md:before:bottom-1.5 md:before:left-0 md:before:w-[3px] md:before:rounded-r-sm md:before:bg-accent"
                          : "text-ink-secondary hover:bg-surface hover:text-ink"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
