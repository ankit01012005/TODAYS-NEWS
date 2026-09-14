"use client";

import { motion, type Variants } from "framer-motion";
import type { ReactNode } from "react";

/// Entrance motion for content that mounts client-side or scrolls into
/// view: a short rise and fade, staggered across children when used as a
/// group. Deliberately small (12px, ~360ms) — motion that helps the eye
/// find what just changed, never a performance.
///
/// Server-rendered public content uses the CSS `.reveal` runtime instead
/// (nothing is hidden without JavaScript); this is for the CMS and for
/// client-only surfaces.
const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

const group: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.04 } },
};

export function Reveal({
  children,
  className = "",
  delay = 0,
  as = "div",
  once = true,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: "div" | "section" | "li" | "article";
  once?: boolean;
}) {
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once, margin: "0px 0px -8% 0px" }}
      variants={item}
      transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1], delay }}
    >
      {children}
    </Tag>
  );
}

export function RevealGroup({
  children,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "ul" | "ol";
}) {
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "0px 0px -8% 0px" }}
      variants={group}
    >
      {children}
    </Tag>
  );
}

export function RevealItem({
  children,
  className = "",
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li" | "article";
}) {
  const Tag = motion[as];
  return (
    <Tag className={className} variants={item} transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}>
      {children}
    </Tag>
  );
}
