import { Download, FileText } from 'lucide-react'

import type { KennisbankFile } from '@/sanity/lib/kennisbank'
import { formatFileSize } from './mediaType'

/**
 * PDF block: a download card plus an inline preview. The preview iframe is
 * lazy so the document only downloads when it scrolls into view.
 */
export default function PdfPanel({
  file,
  title,
}: {
  file: KennisbankFile
  title: string
}) {
  const size = formatFileSize(file.size)
  const filename = file.originalFilename ?? `${title}.pdf`
  // `dl` makes the Sanity CDN send Content-Disposition: attachment.
  const downloadUrl = `${file.url}?dl=${encodeURIComponent(filename)}`

  return (
    <div className="space-y-4" data-testid="kennisbank-pdf">
      <a
        href={downloadUrl}
        className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--color-secondary)]/10 text-[var(--color-secondary)]">
          <FileText className="h-6 w-6" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium text-gray-900">{filename}</span>
          <span className="block text-sm text-gray-500">
            PDF{size ? ` · ${size}` : ''}
          </span>
        </span>
        <span className="inline-flex items-center gap-2 rounded-full bg-[var(--color-secondary)] px-5 py-2.5 text-sm font-medium text-white">
          <Download className="h-4 w-4" />
          Download
        </span>
      </a>

      <iframe
        src={`${file.url}#view=FitH`}
        title={`Voorbeeld van ${filename}`}
        loading="lazy"
        className="h-[70vh] w-full rounded-2xl border border-gray-200 bg-white"
      />
    </div>
  )
}
