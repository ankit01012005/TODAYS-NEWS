/// A small word-level diff for the history page's "Compare with rev n"
/// (2l): not an endpoint — it diffs two revisions' plain text client-side.
/// Classic LCS over word tokens; fine for article-length text.
export type DiffOp = { kind: "same" | "added" | "removed"; text: string };

export function diffWords(before: string, after: string): DiffOp[] {
  const a = tokenize(before);
  const b = tokenize(after);
  const n = a.length;
  const m = b.length;
  // Guard: pathological sizes fall back to a whole-replace.
  if (n * m > 4_000_000) {
    return [
      { kind: "removed", text: before },
      { kind: "added", text: after },
    ];
  }
  const table: Uint32Array[] = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    const rowI = table[i]!;
    const rowNext = table[i + 1]!;
    for (let j = m - 1; j >= 0; j--) {
      rowI[j] = a[i] === b[j] ? rowNext[j + 1]! + 1 : Math.max(rowNext[j]!, rowI[j + 1]!);
    }
  }
  const ops: DiffOp[] = [];
  let i = 0;
  let j = 0;
  const push = (kind: DiffOp["kind"], text: string) => {
    const last = ops[ops.length - 1];
    if (last && last.kind === kind) last.text += text;
    else ops.push({ kind, text });
  };
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      push("same", a[i]!);
      i++;
      j++;
    } else if (table[i + 1]![j]! >= table[i]![j + 1]!) {
      push("removed", a[i]!);
      i++;
    } else {
      push("added", b[j]!);
      j++;
    }
  }
  while (i < n) push("removed", a[i++]!);
  while (j < m) push("added", b[j++]!);
  return ops;
}

function tokenize(text: string): string[] {
  return text.split(/(\s+)/).filter((t) => t.length > 0);
}
