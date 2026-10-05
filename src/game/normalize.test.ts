import { describe, expect, it } from 'vitest'
import type { ApiArtwork } from '../types.ts'
import { BANDS } from './config.ts'
import { normalizeArtwork } from './normalize.ts'

const nineteenth = BANDS.find((band) => band.id === 'nineteenth')!

function raw(overrides: Partial<ApiArtwork> = {}): ApiArtwork {
  return {
    id: 1,
    title: 'Water Lilies',
    artist_display: 'Claude Monet',
    date_start: 1850,
    date_end: 1855,
    date_display: '1850-55',
    image_id: 'abc',
    is_public_domain: true,
    ...overrides,
  }
}

describe('normalizeArtwork', () => {
  it('keeps a good record and uses the midpoint year', () => {
    expect(normalizeArtwork(raw(), nineteenth)).toMatchObject({ id: 1, year: 1853, imageId: 'abc' })
  })

  it('rejects records without an image or public-domain status', () => {
    expect(normalizeArtwork(raw({ image_id: null }), nineteenth)).toBeNull()
    expect(normalizeArtwork(raw({ is_public_domain: false }), nineteenth)).toBeNull()
  })

  it('rejects missing or inverted dates', () => {
    expect(normalizeArtwork(raw({ date_start: null }), nineteenth)).toBeNull()
    expect(normalizeArtwork(raw({ date_start: 1860, date_end: 1850 }), nineteenth)).toBeNull()
  })

  it('rejects dates spanning more than the band allows', () => {
    expect(normalizeArtwork(raw({ date_start: 1810, date_end: 1890 }), nineteenth)).toBeNull()
  })

  it('rejects records outside the band', () => {
    expect(normalizeArtwork(raw({ date_start: 1790, date_end: 1795 }), nineteenth)).toBeNull()
  })

  it('falls back to readable text for missing title and artist', () => {
    const artwork = normalizeArtwork(raw({ title: null, artist_display: null }), nineteenth)
    expect(artwork).toMatchObject({ title: 'Untitled', artist: 'Unknown artist' })
  })

  it('strips HTML tags from titles', () => {
    const artwork = normalizeArtwork(raw({ title: 'Celestial Beauty (<em>Apsara</em>)' }), nineteenth)
    expect(artwork?.title).toBe('Celestial Beauty (Apsara)')
  })
})
