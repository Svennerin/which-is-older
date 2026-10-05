import { fetchBandPool } from '../api/artic.ts'
import type { Artwork, Round } from '../types.ts'
import { BANDS, ROUNDS_PER_GAME, type Band } from './config.ts'
import { buildRounds, type Rng } from './pairing.ts'

/** Fetching one band again picks a new random page, so a retry isn't just a repeat. */
async function fetchWithOneRetry(band: Band, rng: Rng, signal?: AbortSignal) {
  try {
    const pool = await fetchBandPool(band, rng, signal)
    if (pool.length > 0) return pool
  } catch (error) {
    if (signal?.aborted) throw error
  }
  return fetchBandPool(band, rng, signal)
}

/**
 * Loads everything a game needs: one request per era band, in parallel
 * (5 requests per game, to stay well under the API's 60/minute limit),
 * then pairs them up. A band that fails twice is skipped and its rounds are
 * given to other bands. Throws only if we can't make a full game at all.
 */
export async function loadGame(rng: Rng = Math.random, signal?: AbortSignal): Promise<Round[]> {
  const results = await Promise.allSettled(BANDS.map((band) => fetchWithOneRetry(band, rng, signal)))
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')

  const pools = new Map<string, Artwork[]>()
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') pools.set(BANDS[index].id, result.value)
  })

  const rounds = buildRounds(pools, BANDS, ROUNDS_PER_GAME, rng)
  if (rounds.length < ROUNDS_PER_GAME) {
    throw new Error('Could not load enough artworks to start a game. Please try again.')
  }
  return rounds
}
