import { useState } from 'react'
import { imageUrl } from '../api/artic.ts'

interface Props {
  imageId: string
  alt: string
  /** Offer an escape-hatch link when loading fails. Off inside buttons, where a nested link is invalid HTML. */
  allowLink?: boolean
}

/** Shows a pulsing placeholder while the image loads, and a message if it can't. */
export default function ArtworkImage({ imageId, alt, allowLink = false }: Props) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'failed'>('loading')

  return (
    <div className="relative flex h-72 items-center justify-center overflow-hidden rounded-lg bg-stone-200 sm:h-96">
      {status === 'loading' && <div className="absolute inset-0 animate-pulse bg-stone-300" aria-hidden="true" />}
      {status === 'failed' ? (
        <div className="px-4 text-center text-stone-700">
          <p>This image couldn't be loaded. You can still make your guess.</p>
          {/* The link opens only the image, so it doesn't reveal any title or date. */}
          {allowLink && (
            <a
              href={imageUrl(imageId)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block rounded font-medium text-amber-900 underline focus-visible:outline-4 focus-visible:outline-amber-600"
            >
              Open the image in a new tab
            </a>
          )}
        </div>
      ) : (
        <img
          src={imageUrl(imageId)}
          alt={alt}
          // Sending no Referer: the image host may reject requests that come from other sites' pages.
          referrerPolicy="no-referrer"
          onLoad={() => setStatus('loaded')}
          onError={() => setStatus('failed')}
          className={`max-h-full max-w-full object-contain transition-opacity duration-300 ${status === 'loaded' ? 'opacity-100' : 'opacity-0'}`}
        />
      )}
    </div>
  )
}
