import { useCallback, useMemo, useReducer, useRef, type ReactNode } from 'react'
import { GameContext } from './gameContext.ts'
import { gameReducer, initialState } from './gameReducer.ts'
import { loadGame } from './loadGame.ts'

/** Holds the game state above the router so it survives moving between pages. */
export function GameProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, initialState)
  // A ref, not state: we need the answer immediately, and React StrictMode
  // runs effects twice in development, which would otherwise double our API calls.
  const loadingRef = useRef(false)

  const startGame = useCallback(() => {
    if (loadingRef.current) return
    loadingRef.current = true
    dispatch({ type: 'loadStarted' })
    loadGame()
      .then(({ rounds, isDemo }) => dispatch({ type: 'loadSucceeded', rounds, isDemo }))
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : 'Something went wrong loading the artworks.'
        dispatch({ type: 'loadFailed', message })
      })
      .finally(() => {
        loadingRef.current = false
      })
  }, [])

  const guess = useCallback((artworkId: number) => dispatch({ type: 'guessed', artworkId }), [])
  const nextRound = useCallback(() => dispatch({ type: 'nextRound' }), [])

  const value = useMemo(() => ({ state, startGame, guess, nextRound }), [state, startGame, guess, nextRound])
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}
