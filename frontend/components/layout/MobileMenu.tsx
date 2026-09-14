"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Wordmark } from "@/components/brand/Wordmark";
import { SocialGlyph } from "@/components/brand/SocialGlyph";
import { SOCIAL_HANDLES } from "@/lib/site";
import { PublicCategoryRef } from "@/lib/api/public-types";

const SITE_LINKS = [
  { href: "/tv", label: "ANVAY TV" },
  { href: "/pr", label: "PR & Distribution" },
  { href: "/about", label: "About" },
  { href: "/editorial-policy", label: "Editorial policy" },
  { href: "/contact", label: "Contact" },
];

/// 1g — the hamburger sheet at phone width: every section, the site
/// pages, and the handles, on a dark panel that slides down from the
/// masthead. Closes itself on navigation and on Escape; focus returns to
/// the button that opened it.
export function MobileMenu({ categories, isLive }: { categories: PublicCategoryRef[]; isLive: boolean }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on navigation — the "store information from previous renders"
  // pattern rather than an effect, so there is no extra render.
  const [seenPath, setSeenPath] = useState(pathname);
  if (seenPath !== pathname) {
    setSeenPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-pill border border-rule-strong text-ink transition-colors duration-(--duration-fast) hover:border-ink"
      >
        {open ? <X size={16} aria-hidden="true" /> : <Menu size={16} aria-hidden="true" />}
      </button>

      <AnimatePresence>
        {open ? (
          <motion.div
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="band-dark fixed inset-0 z-(--z-overlay) overflow-y-auto"
          >
            <motion.div
              initial={{ y: -12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              transition={{ duration: 0.24, ease: [0.25, 1, 0.5, 1] }}
              className="px-space-4 pb-space-8 pt-space-4"
            >
              <div className="flex items-center justify-between border-b border-bone/15 pb-space-3">
                <Wordmark size="sm" tone="bone" />
                <button
                  type="button"
                  aria-label="Close menu"
                  onClick={() => {
                    setOpen(false);
                    buttonRef.current?.focus();
                  }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-pill border border-bone/30 text-bone"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </div>

              <p className="mt-space-5 text-label text-gold">Sections</p>
              <ul className="mt-space-2 divide-y divide-bone/10">
                <li>
                  <Link href="/" className="block py-space-3 text-heading-3 text-bone no-underline">
                    Home
                  </Link>
                </li>
                {categories.map((category) => (
                  <li key={category.slug}>
                    <Link
                      href={`/${category.slug}`}
                      className="block py-space-3 text-heading-3 text-bone no-underline"
                    >
                      {category.name}
                    </Link>
                  </li>
                ))}
              </ul>

              <p className="mt-space-6 text-label text-gold">ANVAY</p>
              <ul className="mt-space-2 divide-y divide-bone/10">
                {SITE_LINKS.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="flex items-center gap-x-space-2 py-space-3 text-body text-bone/85 no-underline">
                      {link.href === "/tv" && isLive ? (
                        <span className="live-dot live-dot-sm live-dot-red" aria-hidden="true" />
                      ) : null}
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>

              <p className="mt-space-6 text-label text-gold">Our handles</p>
              <ul className="mt-space-3 flex flex-wrap gap-space-2">
                {SOCIAL_HANDLES.map((handle) => (
                  <li key={handle.key}>
                    <a
                      href={handle.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 items-center gap-x-space-2 rounded-pill border border-bone/35 px-space-3 text-body-sm text-bone no-underline"
                    >
                      <SocialGlyph platform={handle.key} size={13} />
                      {handle.label}
                    </a>
                  </li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
