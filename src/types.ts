// Types for the API response and the game. Reading this file is the quickest
// way to understand the data that flows through the app.

/** The subset of an Art Institute artwork record that we request via `fields`. */
export interface ApiArtwork {
  id: number
  title: string | null
  artist_display: string | null
  date_start: number | null
  date_end: number | null
  date_display: string | null
  image_id: string | null
  is_public_domain: boolean
}

/** Shape of the search endpoint's response (only the parts we use). */
export interface ApiSearchResponse {
  pagination: { total: number; limit: number; total_pages: number; current_page: number }
  data: ApiArtwork[]
}

/** An artwork that passed our quality filters. Years are negative for BCE. */
export interface Artwork {
  id: number
  title: string
  artist: string
  dateDisplay: string
  /** Single representative year (midpoint of start/end) used for comparisons. */
  year: number
  yearStart: number
  yearEnd: number
  imageId: string
  /** Set only for bundled demo artworks: a local path used instead of the museum's image server. */
  localImage?: string
}

/** Two artworks shown side by side. Order is already shuffled for display. */
export type Pair = readonly [Artwork, Artwork]

export interface Round {
  pair: Pair
  /** The id of the artwork that is actually older. */
  olderId: number
}

/**
 * idle     - no game yet (or the page was refreshed)
 * loading  - fetching artworks
 * error    - loading failed; the player can retry
 * playing  - a round is on screen (guessedId says whether it's been answered)
 * finished - all rounds done; show results
 */
export type GameStatus = 'idle' | 'loading' | 'error' | 'playing' | 'finished'

export interface GameState {
  status: GameStatus
  rounds: Round[]
  roundIndex: number
  score: number
  /** The player's pick in the current round; null until they guess. */
  guessedId: number | null
  /** Every guess made so far, in round order, for the results review. */
  guesses: number[]
  error: string | null
  /** True when playing the bundled demo set because the museum's images can't be reached. */
  isDemo: boolean
}
