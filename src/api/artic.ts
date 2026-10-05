import type { ApiSearchResponse, Artwork } from '../types.ts'
import { API_MAX_RESULTS, PAGES_TO_SAMPLE, POOL_SIZE, type Band } from '../game/config.ts'
import { normalizeArtwork } from '../game/normalize.ts'

const SEARCH_URL = 'https://api.artic.edu/api/v1/artworks/search'
const IIIF_URL = 'https://www.artic.edu/iiif/2'

const MAX_PAGE = Math.floor(API_MAX_RESULTS / POOL_SIZE)

const FIELDS = ['id', 'title', 'artist_display', 'date_start', 'date_end', 'date_display', 'image_id', 'is_public_domain']

/** Width 843 is the size the API docs recommend for IIIF images (widely cached). */
export function imageUrl(imageId: string, width = 843): string {
  return `${IIIF_URL}/${imageId}/full/${width},/0/default.jpg`
}

/** Where to load an artwork's image from: the bundled copy for demo artworks, else the museum. */
export function artworkImageSrc(artwork: Pick<Artwork, 'imageId' | 'localImage'>): string {
  return artwork.localImage ?? imageUrl(artwork.imageId)
}

/** A random year window inside the band, so repeat games see different artworks. */
export function pickWindow(band: Band, rng: () => number): { from: number; to: number } {
  const slack = Math.max(0, band.to - band.from - band.windowSpan)
  const from = band.from + Math.floor(rng() * (slack + 1))
  return { from, to: Math.min(band.to, from + band.windowSpan) }
}

/** The Elasticsearch query for one year window. `filter` skips scoring, which we don't need. */
export function buildSearchBody(window: { from: number; to: number }, page: number) {
  return {
    query: {
      bool: {
        filter: [
          { term: { is_public_domain: true } },
          { exists: { field: 'image_id' } },
          // Both ends must fall inside the band so wide-spanning works are excluded early.
          { range: { date_start: { gte: window.from, lte: window.to } } },
          { range: { date_end: { gte: window.from, lte: window.to } } },
        ],
      },
    },
    fields: FIELDS,
    limit: POOL_SIZE,
    page,
  }
}

async function search(window: { from: number; to: number }, page: number, signal?: AbortSignal): Promise<ApiSearchResponse> {
  const response = await fetch(SEARCH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(buildSearchBody(window, page)),
    signal,
  })
  if (!response.ok) throw new Error(`Art Institute API returned ${response.status}`)
  return response.json() as Promise<ApiSearchResponse>
}

/**
 * Fetches one pool of usable artworks for a band: a random year window inside
 * the band, and a random one of its first few result pages. If that page is
 * past the end (a thin window), the response's total tells us a valid page.
 */
export async function fetchBandPool(
  band: Band,
  rng: () => number = Math.random,
  signal?: AbortSignal,
): Promise<Artwork[]> {
  const window = pickWindow(band, rng)
  let result = await search(window, 1 + Math.floor(rng() * PAGES_TO_SAMPLE), signal)

  if (result.data.length === 0 && result.pagination.total > 0) {
    const lastPage = Math.min(result.pagination.total_pages, MAX_PAGE)
    result = await search(window, 1 + Math.floor(rng() * lastPage), signal)
  }

  return result.data.flatMap((raw) => normalizeArtwork(raw, band) ?? [])
}
