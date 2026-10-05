// All tuning knobs live here. If games feel too easy or too unfair, edit this file.

export const ROUNDS_PER_GAME = 10

/** Results requested per era band. The API caps `limit` at 100. */
export const POOL_SIZE = 100

/** Allowed gap (in years) between the two artworks' dates. */
export interface GapRule {
  min: number
  max: number
}

/**
 * An era we fetch one pool for. We split by era instead of fetching one random
 * pool because the collection is dominated by 1800s-1900s work; a single pool
 * would leave ancient pieces with no sensible partner.
 */
export interface Band {
  id: string
  label: string
  /** Inclusive year range of artworks to request. Negative = BCE. */
  from: number
  to: number
  /** Share of the game's rounds drawn from this band. Must sum to ROUNDS_PER_GAME. */
  rounds: number
  /** Wide gaps for old art (dates are fuzzy), narrow for recent art. */
  gap: GapRule
  /** Artworks whose date range is wider than this are too vague to judge. */
  maxSpan: number
  /**
   * Width of the random year window requested for this band. The API only
   * lets us reach the first 1,000 results of any query, so querying the whole
   * band would show the same artworks every game. A random sub-window per
   * game exposes a different slice each time.
   */
  windowSpan: number
}

export const BANDS: Band[] = [
  { id: 'ancient', label: 'Ancient', from: -1500, to: 499, rounds: 1, gap: { min: 100, max: 500 }, maxSpan: 100, windowSpan: 1000 },
  { id: 'medieval', label: 'Medieval', from: 500, to: 1399, rounds: 1, gap: { min: 75, max: 250 }, maxSpan: 75, windowSpan: 500 },
  { id: 'early-modern', label: '1400-1799', from: 1400, to: 1799, rounds: 3, gap: { min: 25, max: 100 }, maxSpan: 40, windowSpan: 150 },
  { id: 'nineteenth', label: '1800s', from: 1800, to: 1899, rounds: 3, gap: { min: 10, max: 40 }, maxSpan: 25, windowSpan: 50 },
  // Almost nothing after 1939 is public domain (copyright), so this band stops there.
  { id: 'modern', label: '1900-1939', from: 1900, to: 1939, rounds: 2, gap: { min: 5, max: 20 }, maxSpan: 15, windowSpan: 30 },
]

/** The API refuses queries where page * limit exceeds this (HTTP 403), measured Oct 2026. */
export const API_MAX_RESULTS = 1000

/** Result pages we randomly choose between. Kept small so the page almost always exists. */
export const PAGES_TO_SAMPLE = 3

/** Never pair artworks closer than this, however far we relax the gap rule. */
export const ABSOLUTE_MIN_GAP = 2

/**
 * When a band's pool has no pair within its gap rule, we retry with these
 * progressively looser versions. Factors multiply the band's own min/max.
 */
export const GAP_RELAXATIONS = [
  { minFactor: 1, maxFactor: 1 },
  { minFactor: 1, maxFactor: 2 },
  { minFactor: 0.5, maxFactor: 3 },
  { minFactor: 0.25, maxFactor: 5 },
]
