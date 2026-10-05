import type { GameState, Round } from '../types.ts'

// The reducer is the single place where game state changes. Each action
// describes something that happened; the reducer decides the new state.
// Keeping it a pure function means we can unit test the whole game flow.

export type GameAction =
  | { type: 'loadStarted' }
  | { type: 'loadSucceeded'; rounds: Round[] }
  | { type: 'loadFailed'; message: string }
  | { type: 'guessed'; artworkId: number }
  | { type: 'nextRound' }

export const initialState: GameState = {
  status: 'idle',
  rounds: [],
  roundIndex: 0,
  score: 0,
  guessedId: null,
  guesses: [],
  error: null,
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'loadStarted':
      return { ...initialState, status: 'loading' }

    case 'loadSucceeded':
      return { ...initialState, status: 'playing', rounds: action.rounds }

    case 'loadFailed':
      return { ...initialState, status: 'error', error: action.message }

    case 'guessed': {
      // Ignore a second click in the same round (e.g. a double-click).
      if (state.status !== 'playing' || state.guessedId !== null) return state
      const round = state.rounds[state.roundIndex]
      const correct = action.artworkId === round.olderId
      return {
        ...state,
        guessedId: action.artworkId,
        score: state.score + (correct ? 1 : 0),
        guesses: [...state.guesses, action.artworkId],
      }
    }

    case 'nextRound': {
      if (state.status !== 'playing' || state.guessedId === null) return state
      const isLastRound = state.roundIndex === state.rounds.length - 1
      return isLastRound
        ? { ...state, status: 'finished' }
        : { ...state, roundIndex: state.roundIndex + 1, guessedId: null }
    }
  }
}
