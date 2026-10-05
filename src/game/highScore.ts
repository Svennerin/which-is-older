const KEY = 'which-is-older:high-score'

// localStorage can throw (private windows, blocked storage), and the game
// must still work without it, so every access is wrapped.

export function readHighScore(): number | null {
  try {
    const value = Number(localStorage.getItem(KEY))
    return Number.isInteger(value) && value > 0 ? value : null
  } catch {
    return null
  }
}

/** Saves the score if it beats the stored best. Returns true when it did. */
export function saveHighScore(score: number): boolean {
  const best = readHighScore() ?? 0
  if (score <= best) return false
  try {
    localStorage.setItem(KEY, String(score))
  } catch {
    return false
  }
  return true
}
