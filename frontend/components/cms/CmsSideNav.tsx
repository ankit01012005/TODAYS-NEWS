"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { AuthenticatedUser } from "@/lib/api/auth-types";

interface NavItem {
  href: string;
  label: string;
  count?: number;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

/// 1i/1k — DESK and NEWSROOM groups. The current item carries a 3px red
/// left rule on the red wash. Editors see the desk items only (no Users,
/// Categories, Review — capability, not role); admins get the review
/// queue with its count and the newsroom group. Persistent column at md+,
/// a horizontal rail beneath the header below 900px.
export function CmsSideNav({ user, reviewCount }: { user: AuthenticatedUser; reviewCount?: number }) {
  const pathname = usePathname();
  const isAdmin = user.role === "ADMIN";

  const groups: NavGroup[] = [
    {
      label: "Desk",
      items: [
        { href: "/staff", label: "Dashboard" },
        ...(isAdmin ? [{ href: "/staff/review", label: "Review queue", count: reviewCount }] : []),
        { href: "/staff/articles", label: isAdmin ? "All articles" : "My articles" },
        { href: "/staff/media", label: "Media" },
        ...(isAdmin ? [] : [{ href: "/staff/sources", label: "Sources" }]),
      ],
    },
    ...(isAdmin
      ? [
          {
            label: "Newsroom",
            items: [
              { href: "/staff/users", label: "Staff" },
              { href: "/staff/sources", label: "Sources" },
              { href: "/staff/categories", label: "Sections" },
              { href: "/staff/social", label: "Social picks" },
              { href: "/staff/audit", label: "Audit log" },
            ],
          },
        ]
      : []),
  ];

  const isActive = (href: string) =>
    href === "/staff" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);

  return (
    <nav
      aria-label="Newsroom"
      className="no-scrollbar shrink-0 overflow-x-auto border-b border-rule bg-surface md:sticky md:top-14 md:h-[calc(100vh-56px)] md:w-[188px] md:overflow-y-auto md:border-b-0 md:border-r"
    >
      <div className="flex gap-x-space-5 px-space-3 md:flex-col md:gap-y-space-5 md:px-space-3 md:py-space-4">
        {groups.map((group) => (
          <div key={group.label} className="flex items-center gap-x-space-1 md:block">
            <p className="hidden px-space-2 pb-space-2 text-label text-ink-muted md:block">{group.label}</p>
            <ul className="flex gap-x-space-1 md:flex-col md:gap-y-px">
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href} className="shrink-0">
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`relative flex items-center justify-between gap-x-space-3 py-space-2 pl-[11px] pr-space-2 text-body-sm no-underline transition-colors duration-(--duration-fast) md:py-[7px] ${
                        active ? "text-brand" : "text-ink-muted hover:bg-surface-sunken hover:text-ink"
                      }`}
                    >
                      {active ? (
                        <motion.span
                          layoutId="cms-nav-active"
                          className="absolute inset-0 border-l-[3px] border-brand bg-brand-wash"
                          transition={{ type: "spring", stiffness: 420, damping: 38 }}
                          aria-hidden="true"
                        />
                      ) : null}
                      <span className="relative">{item.label}</span>
                      {typeof item.count === "number" && item.count > 0 ? (
                        <span className={`relative text-mono-sm tabular-nums ${active ? "text-brand" : "text-ink-muted"}`}>{item.count}</span>
                      ) : null}
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
