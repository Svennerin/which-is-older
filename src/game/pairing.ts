import type { Artwork, Pair, Round } from '../types.ts'
import { ABSOLUTE_MIN_GAP, GAP_RELAXATIONS, type Band, type GapRule } from './config.ts'

// Everything here is a pure function of its inputs (including the random
// number generator), which is what makes it testable with a seeded RNG.

/** Returns a number in [0, 1), like Math.random. */
export type Rng = () => number

/** Fisher-Yates shuffle. Returns a new array and leaves the input alone. */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/**
 * True if the two artworks make a fair, answerable question: their date
 * ranges must not overlap (otherwise "which is older" has no clear answer),
 * and the gap between their representative years must fit the rule.
 */
export function isValidPair(a: Artwork, b: Artwork, gap: GapRule): boolean {
  if (a.id === b.id) return false
  const rangesOverlap = a.yearStart <= b.yearEnd && b.yearStart <= a.yearEnd
  if (rangesOverlap) return false
  const distance = yearsBetween(a.year, b.year)
  return distance >= gap.min && distance <= gap.max
}

/**
 * Whole years between two years. There is no year 0 (1 BCE is followed by
 * 1 CE), so a pair that crosses the BCE/CE line is one year closer than
 * plain subtraction suggests.
 */
export function yearsBetween(a: number, b: number): number {
  const crossesEra = (a < 0) !== (b < 0)
  return Math.abs(a - b) - (crossesEra ? 1 : 0)
}

/** A looser version of a band's gap rule. `step` indexes GAP_RELAXATIONS. */
export function relaxGap(rule: GapRule, step: number): GapRule {
  const { minFactor, maxFactor } = GAP_RELAXATIONS[step]
  return {
    min: Math.max(ABSOLUTE_MIN_GAP, Math.round(rule.min * minFactor)),
    max: Math.round(rule.max * maxFactor),
  }
}

/**
 * Finds a random valid pair in the pool, skipping artworks already used in
 * this game. We shuffle first so the same artwork isn't always tried first.
 */
export function findPair(pool: readonly Artwork[], gap: GapRule, usedIds: ReadonlySet<number>, rng: Rng): [Artwork, Artwork] | null {
  const candidates = shuffle(
    pool.filter((artwork) => !usedIds.has(artwork.id)),
    rng,
  )
  for (const first of candidates) {
    const partners = candidates.filter((other) => isValidPair(first, other, gap))
    if (partners.length > 0) {
      return [first, partners[Math.floor(rng() * partners.length)]]
    }
  }
  return null
}

/** Tries the band's own gap rule first, then looser ones, so a thin pool still yields a pair. */
export function findPairWithRelaxation(pool: readonly Artwork[], band: Band, usedIds: ReadonlySet<number>, rng: Rng) {
  for (let step = 0; step < GAP_RELAXATIONS.length; step++) {
    const pair = findPair(pool, relaxGap(band.gap, step), usedIds, rng)
    if (pair) return pair
  }
  return null
}

/** Wraps a pair as a Round: shuffles left/right placement and records the answer. */
export function makeRound(pair: readonly [Artwork, Artwork], rng: Rng): Round {
  const shuffled = shuffle(pair, rng) as unknown as Pair
  const older = pair[0].year < pair[1].year ? pair[0] : pair[1]
  return { pair: shuffled, olderId: older.id }
}

/**
 * Builds a game's rounds from per-band pools.
 *
 * Each band is allotted its configured number of rounds. If a band can't
 * supply a pair (empty pool because its request failed, or no valid pair),
 * that round falls back to another band instead of failing the game. May
 * return fewer rounds than requested if every band runs dry; the caller
 * decides whether that's good enough.
 */
export function buildRounds(pools: ReadonlyMap<string, readonly Artwork[]>, bands: readonly Band[], roundCount: number, rng: Rng): Round[] {
  const slots = shuffle(bands.flatMap((band) => Array<Band>(band.rounds).fill(band)), rng).slice(0, roundCount)
  const usedIds = new Set<number>()
  const rounds: Round[] = []

  for (const slotBand of slots) {
    // Preferred band first, then the others in random order as fallbacks.
    const attempts = [slotBand, ...shuffle(bands.filter((band) => band !== slotBand), rng)]
    for (const band of attempts) {
      const pair = findPairWithRelaxation(pools.get(band.id) ?? [], band, usedIds, rng)
      if (pair) {
        usedIds.add(pair[0].id)
        usedIds.add(pair[1].id)
        rounds.push(makeRound(pair, rng))
        break
      }
    }
  }
  return rounds
}
