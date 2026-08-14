import { FileText, Play, Newspaper, type LucideIcon } from 'lucide-react'
import type { KennisbankMediaType } from '@/sanity/lib/kennisbank'

export const MEDIA_TYPE_META: Record<
  KennisbankMediaType,
  { label: string; plural: string; icon: LucideIcon }
> = {
  artikel: { label: 'Artikel', plural: 'Artikelen', icon: Newspaper },
  video: { label: 'Video', plural: "Video's", icon: Play },
  pdf: { label: 'Handleiding', plural: 'Handleidingen', icon: FileText },
}

export const MEDIA_TYPES: KennisbankMediaType[] = ['artikel', 'video', 'pdf']

export function formatPublishedAt(iso: string): string {
  return new Date(iso).toLocaleDateString('nl-NL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

/** Human-readable file size for download links. */
export function formatFileSize(bytes?: number): string | null {
  if (!bytes || bytes <= 0) return null
  const mb = bytes / (1024 * 1024)
  if (mb >= 1) return `${mb.toFixed(1).replace('.', ',')} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} kB`
}
