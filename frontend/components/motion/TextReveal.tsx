"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { ElementType } from "react";

/// A headline that arrives word by word — each word rises out of its own
/// clipped line, staggered left to right. Used for the front page lead,
/// the section title, the dark heroes and the static page titles: the
/// one place motion is allowed to carry the brand's confidence. Short
/// (the whole line lands inside ~600ms), once, and never under reduced
/// motion. The full text stays in the accessible name; the word spans
/// are decorative.
export function TextReveal({
  text,
  as: Tag = "span",
  className = "",
  delay = 0,
  stagger = 0.045,
  once = true,
}: {
  text: string;
  as?: ElementType;
  className?: string;
  delay?: number;
  stagger?: number;
  once?: boolean;
}) {
  const reduce = useReducedMotion();
  const words = text.split(/\s+/).filter(Boolean);

  if (reduce) {
    return <Tag className={className}>{text}</Tag>;
  }

  return (
    <Tag className={className} aria-label={text}>
      <motion.span
        aria-hidden="true"
        initial="hidden"
        whileInView="show"
        viewport={{ once, margin: "0px 0px -5% 0px" }}
        variants={{ hidden: {}, show: { transition: { staggerChildren: stagger, delayChildren: delay } } }}
        className="inline"
      >
        {words.map((word, i) => (
          <span key={`${word}-${i}`}>
            <span className="inline-block overflow-hidden align-bottom pb-[0.1em] -mb-[0.1em]">
              <motion.span
                className="inline-block will-change-transform"
                variants={{
                  hidden: { y: "105%", opacity: 0 },
                  show: { y: "0%", opacity: 1, transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] } },
                }}
              >
                {word}
              </motion.span>
            </span>
            {i < words.length - 1 ? " " : null}
          </span>
        ))}
      </motion.span>
    </Tag>
  );
}
