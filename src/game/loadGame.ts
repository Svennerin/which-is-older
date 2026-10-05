import { fetchBandPool } from '../api/artic.ts'
import { canReachImageHost } from '../api/imageHost.ts'
import type { Artwork, Round } from '../types.ts'
import { BANDS, ROUNDS_PER_GAME, type Band } from './config.ts'
import { buildDemoRounds } from './demoRounds.ts'
import { buildRounds, type Rng } from './pairing.ts'

export interface LoadedGame {
  rounds: Round[]
  /** True when these are the bundled demo rounds rather than live ones. */
  isDemo: boolean
}

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
 * Fetches live rounds: one request per era band, in parallel (5 requests per
 * game, to stay well under the API's 60/minute limit), then pairs them up.
 * A band that fails twice is skipped and its rounds are given to other bands.
 * Throws only if we can't make a full game at all.
 */
export async function loadLiveRounds(rng: Rng, signal?: AbortSignal): Promise<Round[]> {
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

/**
 * Decides which game to play. Without reachable images, live rounds would be
 * unplayable, so we use the bundled demo set instead. Pure so it can be tested.
 */
export function chooseGame(imagesReachable: boolean, live: Round[] | Error, rng: Rng): LoadedGame {
  if (!imagesReachable) return { rounds: buildDemoRounds(rng), isDemo: true }
  if (live instanceof Error) throw live
  return { rounds: live, isDemo: false }
}

/**
 * Loads everything a game needs. The image check and the API calls run at the
 * same time, so players with working images wait no longer than before.
 */
export async function loadGame(rng: Rng = Math.random, signal?: AbortSignal): Promise<LoadedGame> {
  const [imagesReachable, live] = await Promise.all([
    canReachImageHost(),
    loadLiveRounds(rng, signal).catch((error: unknown) => (error instanceof Error ? error : new Error(String(error)))),
  ])
  if (signal?.aborted) throw new DOMException('Aborted', 'AbortError')
  return chooseGame(imagesReachable, live, rng)
}
