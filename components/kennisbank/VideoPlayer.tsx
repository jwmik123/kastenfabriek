'use client'

import Image from 'next/image'
import { useState } from 'react'
import { Play } from 'lucide-react'

/**
 * Turn a YouTube/Vimeo watch URL into its embed URL, or null when the URL is
 * from another host (then we fall back to a plain link).
 */
export function toEmbedUrl(raw: string): string | null {
  let url: URL
  try {
    url = new URL(raw)
  } catch {
    return null
  }
  const host = url.hostname.replace(/^www\./, '')

  if (host === 'youtu.be') {
    const id = url.pathname.slice(1)
    return id ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0` : null
  }
  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const id = url.searchParams.get('v') ?? url.pathname.split('/').pop()
    return id ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0` : null
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = url.pathname.split('/').filter(Boolean).pop()
    return id ? `https://player.vimeo.com/video/${id}?autoplay=1` : null
  }
  return null
}

/**
 * Video block for a kennisbank item.
 *
 * An uploaded file plays inline from the Sanity CDN with `preload="none"`, so
 * the page costs a poster image until the visitor presses play. An external
 * video shows the same poster and only injects the provider's iframe on click,
 * which keeps YouTube/Vimeo scripts off the initial load.
 */
export default function VideoPlayer({
  fileUrl,
  externalUrl,
  posterUrl,
  title,
}: {
  fileUrl?: string
  externalUrl?: string
  posterUrl: string
  title: string
}) {
  const [playing, setPlaying] = useState(false)
  const embedUrl = externalUrl ? toEmbedUrl(externalUrl) : null

  if (fileUrl) {
    return (
      <video
        controls
        preload="none"
        playsInline
        poster={posterUrl}
        className="aspect-video w-full rounded-2xl bg-black"
        data-testid="kennisbank-video-file"
      >
        <source src={fileUrl} type="video/mp4" />
        Je browser kan deze video niet afspelen.{' '}
        <a href={fileUrl}>Download de video</a>.
      </video>
    )
  }

  if (!embedUrl) {
    if (!externalUrl) return null
    return (
      <a
        href={externalUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-full bg-[var(--color-secondary)] px-6 py-3 text-sm font-medium text-white"
      >
        <Play className="h-4 w-4" />
        Video bekijken
      </a>
    )
  }

  if (playing) {
    return (
      <iframe
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className="aspect-video w-full rounded-2xl bg-black"
        data-testid="kennisbank-video-embed"
      />
    )
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      aria-label={`${title} afspelen`}
      data-testid="kennisbank-video-facade"
      className="group relative aspect-video w-full overflow-hidden rounded-2xl bg-black"
    >
      <Image
        src={posterUrl}
        alt=""
        fill
        sizes="(max-width: 1024px) 100vw, 800px"
        className="object-cover opacity-90 transition-opacity group-hover:opacity-100"
      />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-gray-900 transition-transform group-hover:scale-110">
          <Play className="h-7 w-7 translate-x-0.5 fill-current" />
        </span>
      </span>
    </button>
  )
}
