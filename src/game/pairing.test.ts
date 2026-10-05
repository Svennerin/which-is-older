import { describe, expect, it } from 'vitest'
import type { Artwork } from '../types.ts'
import { ABSOLUTE_MIN_GAP, BANDS, ROUNDS_PER_GAME } from './config.ts'
import { buildRounds, findPair, findPairWithRelaxation, isValidPair, relaxGap, shuffle, yearsBetween, type Rng } from './pairing.ts'

/** Small seeded generator (mulberry32) so tests are repeatable. */
function seeded(seed: number): Rng {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

let nextId = 1
function art(yearStart: number, yearEnd = yearStart): Artwork {
  return {
    id: nextId++,
    title: 'T',
    artist: 'A',
    dateDisplay: String(yearStart),
    year: Math.round((yearStart + yearEnd) / 2),
    yearStart,
    yearEnd,
    imageId: 'img',
  }
}

/** A pool of evenly spaced artworks across a band, like a healthy API response. */
function richPool(from: number, to: number, count = 100): Artwork[] {
  const step = (to - from) / (count - 1)
  return Array.from({ length: count }, (_, i) => art(Math.round(from + i * step)))
}

function richPools() {
  return new Map(BANDS.map((band) => [band.id, richPool(Math.max(band.from, -1000), Math.min(band.to, 1939))]))
}

describe('isValidPair', () => {
  const gap = { min: 5, max: 20 }

  it('accepts a gap inside the rule', () => {
    expect(isValidPair(art(1900), art(1910), gap)).toBe(true)
  })

  it('rejects a gap that is too small or too large', () => {
    expect(isValidPair(art(1900), art(1902), gap)).toBe(false)
    expect(isValidPair(art(1900), art(1950), gap)).toBe(false)
  })

  it('rejects pairing an artwork with itself', () => {
    const a = art(1900)
    expect(isValidPair(a, a, gap)).toBe(false)
  })

  it('rejects overlapping date ranges even when the midpoints are far apart enough', () => {
    // Midpoints 1910 and 1930 are 20 apart, but 1895-1925 and 1915-1945 overlap.
    expect(isValidPair(art(1895, 1925), art(1915, 1945), gap)).toBe(false)
  })

  it('handles BCE years', () => {
    expect(isValidPair(art(-300), art(-100), { min: 100, max: 500 })).toBe(true)
    expect(isValidPair(art(-30), art(30), { min: 100, max: 500 })).toBe(false)
    // 1 BCE and 1 CE are one year apart (no year 0), not two.
    expect(yearsBetween(-1, 1)).toBe(1)
    expect(yearsBetween(-100, 100)).toBe(199)
  })
})

describe('relaxGap', () => {
  it('step 0 returns the band rule unchanged', () => {
    expect(relaxGap({ min: 10, max: 40 }, 0)).toEqual({ min: 10, max: 40 })
  })

  it('never goes below the absolute minimum gap', () => {
    for (let step = 0; step < 4; step++) {
      expect(relaxGap({ min: 5, max: 20 }, step).min).toBeGreaterThanOrEqual(ABSOLUTE_MIN_GAP)
    }
  })

  it('only ever widens the maximum', () => {
    expect(relaxGap({ min: 10, max: 40 }, 3).max).toBeGreaterThan(40)
  })
})

describe('findPair', () => {
  it('returns null when nothing fits', () => {
    expect(findPair([art(1900), art(1901)], { min: 5, max: 20 }, new Set(), seeded(1))).toBeNull()
  })

  it('skips artworks that were already used', () => {
    const a = art(1900)
    const b = art(1910)
    expect(findPair([a, b], { min: 5, max: 20 }, new Set([a.id]), seeded(1))).toBeNull()
  })
})

describe('findPairWithRelaxation', () => {
  const modern = BANDS.find((band) => band.id === 'modern')!

  it('relaxes the gap when the strict rule finds nothing', () => {
    // 50 years apart exceeds the strict 5-20 rule but fits a relaxed one.
    const pair = findPairWithRelaxation([art(1900), art(1940)], modern, new Set(), seeded(1))
    expect(pair).not.toBeNull()
  })

  it('still refuses pairs closer than the absolute minimum', () => {
    expect(findPairWithRelaxation([art(1900), art(1901)], modern, new Set(), seeded(1))).toBeNull()
  })
})

describe('shuffle', () => {
  it('keeps all items and does not mutate the input', () => {
    const input = [1, 2, 3, 4, 5]
    const result = shuffle(input, seeded(7))
    expect([...result].sort()).toEqual(input)
    expect(input).toEqual([1, 2, 3, 4, 5])
  })
})

describe('buildRounds', () => {
  it('builds a full game from healthy pools, across many seeds', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const rounds = buildRounds(richPools(), BANDS, ROUNDS_PER_GAME, seeded(seed))
      expect(rounds).toHaveLength(ROUNDS_PER_GAME)
    }
  })

  it('never reuses an artwork within a game', () => {
    for (let seed = 1; seed <= 50; seed++) {
      const rounds = buildRounds(richPools(), BANDS, ROUNDS_PER_GAME, seeded(seed))
      const ids = rounds.flatMap((round) => round.pair.map((artwork) => artwork.id))
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('marks the genuinely older artwork as the answer and never pairs within 1 year', () => {
    for (let seed = 1; seed <= 50; seed++) {
      for (const round of buildRounds(richPools(), BANDS, ROUNDS_PER_GAME, seeded(seed))) {
        const [left, right] = round.pair
        const older = left.year < right.year ? left : right
        expect(round.olderId).toBe(older.id)
        expect(Math.abs(left.year - right.year)).toBeGreaterThanOrEqual(ABSOLUTE_MIN_GAP)
      }
    }
  })

  it('draws each band its configured share when pools are healthy', () => {
    const rounds = buildRounds(richPools(), BANDS, ROUNDS_PER_GAME, seeded(3))
    // Ancient and 1900+ rounds are identifiable by year; check the extremes.
    const years = rounds.map((round) => Math.min(round.pair[0].year, round.pair[1].year))
    expect(years.filter((year) => year < 500)).toHaveLength(1)
    expect(years.filter((year) => year >= 1900)).toHaveLength(2)
  })

  it('shuffles which side holds the older artwork', () => {
    const olderOnLeft = new Set<boolean>()
    for (let seed = 1; seed <= 30; seed++) {
      for (const round of buildRounds(richPools(), BANDS, ROUNDS_PER_GAME, seeded(seed))) {
        olderOnLeft.add(round.pair[0].id === round.olderId)
      }
    }
    expect(olderOnLeft.size).toBe(2)
  })

  it('gives a failed band\'s rounds to other bands', () => {
    const pools = richPools()
    pools.set('ancient', [])
    pools.set('medieval', [])
    const rounds = buildRounds(pools, BANDS, ROUNDS_PER_GAME, seeded(5))
    expect(rounds).toHaveLength(ROUNDS_PER_GAME)
  })

  it('returns fewer rounds instead of looping forever when pools are exhausted', () => {
    const pools = new Map([['modern', [art(1900), art(1912), art(1925), art(1938)]]])
    const rounds = buildRounds(pools, BANDS, ROUNDS_PER_GAME, seeded(2))
    expect(rounds.length).toBeLessThan(ROUNDS_PER_GAME)
  })

  it('orders BCE pairs correctly', () => {
    const bce = new Map([['ancient', [art(-600), art(-300)]]])
    const [round] = buildRounds(bce, BANDS, 1, seeded(9))
    const older = round.pair.find((artwork) => artwork.id === round.olderId)!
    expect(older.year).toBe(-600)
  })
})
