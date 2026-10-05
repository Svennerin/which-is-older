/// <reference types="node" />
import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { Round } from '../types.ts'
import { ABSOLUTE_MIN_GAP, ROUNDS_PER_GAME } from './config.ts'
import { buildDemoRounds, DEMO_IMAGE_IDS, demoImagePath } from './demoRounds.ts'
import { chooseGame } from './loadGame.ts'
import { yearsBetween } from './pairing.ts'

const rng = () => 0.5

describe('demo rounds', () => {
  const rounds = buildDemoRounds(rng)

  it('is a full game', () => {
    expect(rounds).toHaveLength(ROUNDS_PER_GAME)
  })

  it('never repeats an artwork', () => {
    const ids = rounds.flatMap((round) => round.pair.map((artwork) => artwork.id))
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('marks the genuinely older artwork, with a fair and unambiguous gap', () => {
    for (const { pair, olderId } of rounds) {
      const [a, b] = pair
      const older = a.year < b.year ? a : b
      expect(olderId).toBe(older.id)
      expect(yearsBetween(a.year, b.year)).toBeGreaterThanOrEqual(ABSOLUTE_MIN_GAP)
      const overlap = a.yearStart <= b.yearEnd && b.yearStart <= a.yearEnd
      expect(overlap).toBe(false)
    }
  })

  it('points every artwork at a local image', () => {
    for (const { pair } of rounds) {
      for (const artwork of pair) expect(artwork.localImage).toBe(demoImagePath(artwork.imageId))
    }
  })

  it('has the bundled image files (save them with demo-helper.html)', () => {
    const missing = DEMO_IMAGE_IDS.filter((id) => !existsSync(join(process.cwd(), 'public', 'demo', `${id}.jpg`)))
    expect(missing).toEqual([])
  })
})

describe('chooseGame', () => {
  const live: Round[] = buildDemoRounds(rng).slice(0, 2)

  it('plays live rounds when images are reachable', () => {
    expect(chooseGame(true, live, rng)).toEqual({ rounds: live, isDemo: false })
  })

  it('falls back to the demo when images are not reachable, even if the API also failed', () => {
    const result = chooseGame(false, new Error('api down'), rng)
    expect(result.isDemo).toBe(true)
    expect(result.rounds).toHaveLength(ROUNDS_PER_GAME)
  })

  it('surfaces the API error when images work but live rounds failed', () => {
    expect(() => chooseGame(true, new Error('api down'), rng)).toThrow('api down')
  })
})
