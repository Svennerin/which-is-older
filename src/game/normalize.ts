import type { ApiArtwork, Artwork } from '../types.ts'
import type { Band } from './config.ts'

/** The API sometimes returns markup like "<em>Apsara</em>" in text fields. */
export function stripTags(text: string): string {
  return text.replace(/<[^>]*>/g, '').trim()
}

/**
 * Turns a raw API record into an Artwork, or null if it isn't good enough to
 * use. The API query filters most of this already, but we re-check here so
 * the game never relies on the server having applied our filters correctly.
 */
export function normalizeArtwork(raw: ApiArtwork, band: Band): Artwork | null {
  const { image_id, date_start, date_end } = raw
  if (!image_id || !raw.is_public_domain) return null
  if (date_start == null || date_end == null || date_end < date_start) return null
  // A wide range like "c. 1500-1600" tells the player nothing useful about "older".
  if (date_end - date_start > band.maxSpan) return null
  // Keep records inside the band so a pool really represents one era.
  if (date_start < band.from || date_end > band.to) return null

  return {
    id: raw.id,
    title: stripTags(raw.title ?? '') || 'Untitled',
    artist: stripTags(raw.artist_display ?? '') || 'Unknown artist',
    dateDisplay: raw.date_display?.trim() || String(date_start),
    year: Math.round((date_start + date_end) / 2),
    yearStart: date_start,
    yearEnd: date_end,
    imageId: image_id,
  }
}
