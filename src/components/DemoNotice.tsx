/** Explains why the player is seeing a fixed set of artworks instead of a random game. */
export default function DemoNotice() {
  return (
    <p className="mb-4 rounded-lg border border-amber-400 bg-amber-50 px-3 py-2 text-sm text-amber-950">
      <strong>Demo set:</strong> the museum's image server isn't reachable from your network, so this is a fixed
      10-round game with saved images. Where those images load, games are random.
    </p>
  )
}
