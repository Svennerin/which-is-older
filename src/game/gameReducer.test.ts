import { describe, expect, it } from 'vitest'
import type { Artwork, GameState, Round } from '../types.ts'
import { gameReducer, initialState, type GameAction } from './gameReducer.ts'

function art(id: number, year: number): Artwork {
  return { id, title: 'T', artist: 'A', dateDisplay: String(year), year, yearStart: year, yearEnd: year, imageId: 'x' }
}

// Round 1: artwork 1 (1800) is older than 2 (1850). Round 2: artwork 4 (1500) is older than 3 (1600).
const rounds: Round[] = [
  { pair: [art(1, 1800), art(2, 1850)], olderId: 1 },
  { pair: [art(3, 1600), art(4, 1500)], olderId: 4 },
]

function run(actions: GameAction[], from: GameState = initialState) {
  return actions.reduce(gameReducer, from)
}

const playing = run([{ type: 'loadStarted' }, { type: 'loadSucceeded', rounds, isDemo: false }])

describe('gameReducer', () => {
  it('moves through loading to playing', () => {
    expect(run([{ type: 'loadStarted' }]).status).toBe('loading')
    expect(playing).toMatchObject({ status: 'playing', roundIndex: 0, score: 0 })
  })

  it('remembers whether the game is the bundled demo', () => {
    const demo = run([{ type: 'loadStarted' }, { type: 'loadSucceeded', rounds, isDemo: true }])
    expect(demo.isDemo).toBe(true)
    expect(gameReducer(demo, { type: 'loadStarted' }).isDemo).toBe(false)
  })

  it('records a failure message', () => {
    const state = run([{ type: 'loadStarted' }, { type: 'loadFailed', message: 'nope' }])
    expect(state).toMatchObject({ status: 'error', error: 'nope' })
  })

  it('scores a correct guess and ignores a second guess in the same round', () => {
    const state = run([{ type: 'guessed', artworkId: 1 }, { type: 'guessed', artworkId: 2 }], playing)
    expect(state.score).toBe(1)
    expect(state.guessedId).toBe(1)
    expect(state.guesses).toEqual([1])
  })

  it('does not score a wrong guess', () => {
    expect(run([{ type: 'guessed', artworkId: 2 }], playing).score).toBe(0)
  })

  it('will not advance before the player has guessed', () => {
    expect(run([{ type: 'nextRound' }], playing).roundIndex).toBe(0)
  })

  it('advances and clears the guess', () => {
    const state = run([{ type: 'guessed', artworkId: 1 }, { type: 'nextRound' }], playing)
    expect(state).toMatchObject({ roundIndex: 1, guessedId: null, status: 'playing' })
  })

  it('finishes after the last round with the final score', () => {
    const state = run(
      [{ type: 'guessed', artworkId: 1 }, { type: 'nextRound' }, { type: 'guessed', artworkId: 3 }, { type: 'nextRound' }],
      playing,
    )
    expect(state).toMatchObject({ status: 'finished', score: 1, guesses: [1, 3] })
  })

  it('starting a new load resets the previous game', () => {
    const finished = run([{ type: 'guessed', artworkId: 1 }], playing)
    expect(gameReducer(finished, { type: 'loadStarted' })).toMatchObject({ status: 'loading', score: 0, guesses: [] })
  })
})
