import type { ClosetConfigSnapshot } from "./types";

const DRAFT_KEY = "kf-config-draft";

export function getDraftConfig(): ClosetConfigSnapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as ClosetConfigSnapshot;
  } catch {
    return null;
  }
}

export function saveDraftConfig(config: ClosetConfigSnapshot): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(config));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function clearDraftConfig(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(DRAFT_KEY);
}
