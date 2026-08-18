export type DiffOp = 'equal' | 'add' | 'remove';

export interface DiffLine {
  op: DiffOp;
  left?: string;
  right?: string;
}

export function diffLines(a: string, b: string): DiffLine[] {
  const aLines = a.split('\n');
  const bLines = b.split('\n');
  const n = aLines.length;
  const m = bLines.length;
  const lcs: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      if (aLines[i] === bLines[j]) {
        lcs[i]![j] = (lcs[i + 1]![j + 1] ?? 0) + 1;
      } else {
        lcs[i]![j] = Math.max(lcs[i + 1]![j] ?? 0, lcs[i]![j + 1] ?? 0);
      }
    }
  }
  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (aLines[i] === bLines[j]) {
      out.push({ op: 'equal', left: aLines[i]!, right: bLines[j]! });
      i++;
      j++;
    } else if ((lcs[i + 1]?.[j] ?? 0) >= (lcs[i]?.[j + 1] ?? 0)) {
      out.push({ op: 'remove', left: aLines[i]! });
      i++;
    } else {
      out.push({ op: 'add', right: bLines[j]! });
      j++;
    }
  }
  while (i < n) {
    out.push({ op: 'remove', left: aLines[i]! });
    i++;
  }
  while (j < m) {
    out.push({ op: 'add', right: bLines[j]! });
    j++;
  }
  return out;
}
