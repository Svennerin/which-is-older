import { describe, expect, it } from 'vitest'
import { BANDS } from '../game/config.ts'
import { buildSearchBody, pickWindow } from './artic.ts'

describe('pickWindow', () => {
  it('always stays inside the band and has the configured width', () => {
    for (const band of BANDS) {
      for (const roll of [0, 0.25, 0.5, 0.999999]) {
        const window = pickWindow(band, () => roll)
        expect(window.from).toBeGreaterThanOrEqual(band.from)
        expect(window.to).toBeLessThanOrEqual(band.to)
        expect(window.to - window.from).toBeLessThanOrEqual(band.windowSpan)
      }
    }
  })

  it('gives different windows for different random rolls', () => {
    const band = BANDS.find((b) => b.id === 'ancient')!
    expect(pickWindow(band, () => 0)).not.toEqual(pickWindow(band, () => 0.9))
  })
})

describe('buildSearchBody', () => {
  it('asks only for public-domain artworks with images, within the window', () => {
    const body = buildSearchBody({ from: -300, to: -100 }, 2)
    const text = JSON.stringify(body)
    expect(text).toContain('"is_public_domain":true')
    expect(text).toContain('"image_id"')
    expect(text).toContain('"gte":-300')
    expect(body.page).toBe(2)
  })
})
