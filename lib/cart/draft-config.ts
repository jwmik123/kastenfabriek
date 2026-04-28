import type { ClosetConfigSnapshot } from "./types";

function draftKey(product: string): string {
  return `kf-config-draft-${product}`;
}

export function getDraftConfig(product: string): ClosetConfigSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(draftKey(product));
    if (!raw) return null;
    return JSON.parse(raw) as ClosetConfigSnapshot;
  } catch {
    return null;
  }
}

export function saveDraftConfig(config: ClosetConfigSnapshot, product: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(draftKey(product), JSON.stringify(config));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function clearDraftConfig(product: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(draftKey(product));
}
