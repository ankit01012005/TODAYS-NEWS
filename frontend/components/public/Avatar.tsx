/// A byline disc: the person's initials on an outlined circle. Staff
/// photos are not in the database (design handoff 2b), so the mark is
/// typographic — and it is the same disc the CMS header and staff list
/// use, so a byline reads as the same person in both places.
export function Avatar({
  name,
  size = 30,
  tone = "ink",
  className = "",
}: {
  name: string;
  size?: number;
  tone?: "ink" | "bone" | "dashed";
  className?: string;
}) {
  const initials = name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  const ring =
    tone === "bone"
      ? "border-bone/45 text-bone"
      : tone === "dashed"
        ? "border-dashed border-ink/40 text-ink-muted"
        : "border-rule-strong text-ink";
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center rounded-pill border font-semibold ${ring} ${className}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.36), letterSpacing: "0.02em" }}
    >
      {initials || "·"}
    </span>
  );
}
