import type { Artwork } from '../types.ts'
import ArtworkImage from './ArtworkImage.tsx'

interface Props {
  artwork: Artwork
  /** "first" is the top/left artwork; used only for accessible labels. */
  position: 'first' | 'second'
  /** Once true, details are shown and the card stops being clickable. */
  revealed: boolean
  isOlder: boolean
  isChosen: boolean
  onChoose: () => void
}

/**
 * Before a guess the whole card is one big button showing only the image:
 * titles and artist lines often contain dates, which would give the answer away.
 * After the guess it becomes a plain figure with all the details.
 */
export default function ArtworkCard({ artwork, position, revealed, isOlder, isChosen, onChoose }: Props) {
  if (!revealed) {
    // The alt text deliberately avoids the title for the same spoiler reason.
    const name = position === 'first' ? 'first' : 'second'
    return (
      <button
        type="button"
        onClick={onChoose}
        aria-label={`Choose the ${name} artwork as the older one`}
        className="group rounded-xl border-2 border-transparent bg-white p-3 text-left shadow-sm transition hover:border-amber-500 hover:shadow-md focus-visible:border-amber-600 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-amber-600"
      >
        <ArtworkImage imageId={artwork.imageId} alt={`The ${name} artwork. Details are hidden until you guess.`} />
        <span className="mt-3 block rounded-lg bg-stone-900 py-2 text-center font-medium text-white group-hover:bg-amber-700 group-focus-visible:bg-amber-700">
          This one is older
        </span>
      </button>
    )
  }

  // Artist strings are multi-line ("Name (Nationality, 1840-1926)\nPlace"), so show the first line prominently.
  const [artistName, ...artistRest] = artwork.artist.split('\n')
  const border = isOlder ? 'border-emerald-600' : 'border-stone-300'

  return (
    <figure className={`rounded-xl border-2 bg-white p-3 shadow-sm ${border}`}>
      <ArtworkImage imageId={artwork.imageId} alt={artwork.title} allowLink />
      <figcaption className="mt-3 space-y-1">
        <p className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${isOlder ? 'bg-emerald-100 text-emerald-900' : 'bg-stone-200 text-stone-800'}`}>
            {isOlder ? 'Older' : 'Newer'}
          </span>
          {isChosen && <span className="text-sm font-medium text-stone-700">Your pick</span>}
        </p>
        <p className="text-xl font-bold text-stone-900">{artwork.dateDisplay}</p>
        <p className="font-semibold text-stone-900">{artwork.title}</p>
        <p className="text-stone-700">{artistName}</p>
        {artistRest.length > 0 && <p className="text-sm text-stone-600">{artistRest.join(', ')}</p>}
      </figcaption>
    </figure>
  )
}
