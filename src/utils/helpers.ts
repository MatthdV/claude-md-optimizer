/**
 * Shared utility functions used across engines.
 */

let idCounter = 0;

export function generateId(): string {
  return `opt_${Date.now().toString(36)}_${(idCounter++).toString(36)}`;
}

/**
 * Fast content hash for cache keying.
 * Uses a simple djb2 hash — not cryptographic, just for diffing.
 */
export function hashContent(content: string): string {
  let hash = 5381;
  for (let i = 0; i < content.length; i++) {
    hash = ((hash << 5) + hash + content.charCodeAt(i)) & 0xffffffff;
  }
  return hash.toString(16).padStart(8, "0");
}

/**
 * Debounce wrapper. Returns a debounced version of the callback
 * and a cancel function.
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  ms: number
): { call: (...args: Parameters<T>) => void; cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null;
  return {
    call(...args: Parameters<T>) {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    },
    cancel() {
      if (timer) clearTimeout(timer);
    },
  };
}

/**
 * Compute Jaccard similarity between two strings (word-level).
 */
export function jaccardSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/));
  const wordsB = new Set(b.toLowerCase().split(/\s+/));
  const intersection = [...wordsA].filter((w) => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;
  return union === 0 ? 0 : intersection / union;
}
