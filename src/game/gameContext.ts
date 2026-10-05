import { createContext } from 'react'
import type { GameState } from '../types.ts'

export interface GameContextValue {
  state: GameState
  /** Fetch artworks and begin a new game. Ignored if a load is already running. */
  startGame: () => void
  guess: (artworkId: number) => void
  nextRound: () => void
}

export const GameContext = createContext<GameContextValue | null>(null)
