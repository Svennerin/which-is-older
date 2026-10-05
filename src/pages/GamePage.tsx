import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { imageUrl } from '../api/artic.ts'
import ArtworkCard from '../components/ArtworkCard.tsx'
import { Button, ButtonLink } from '../components/Button.tsx'
import Layout from '../components/Layout.tsx'
import StatusMessage from '../components/StatusMessage.tsx'
import { ROUNDS_PER_GAME } from '../game/config.ts'
import { useGame } from '../game/useGame.ts'

export default function GamePage() {
  const { state, startGame, guess, nextRound } = useGame()
  const { status, rounds, roundIndex, guessedId, score } = state

  // Visiting /play with no game (first visit, or a page refresh) starts one.
  useEffect(() => {
    if (status === 'idle') startGame()
  }, [status, startGame])

  // Warm the browser cache with the next round's images so there's no wait after "Next".
  useEffect(() => {
    rounds[roundIndex + 1]?.pair.forEach((artwork) => {
      const preload = new Image()
      preload.referrerPolicy = 'no-referrer'
      preload.src = imageUrl(artwork.imageId)
    })
  }, [rounds, roundIndex])

  if (status === 'finished') return <Navigate to="/results" replace />

  if (status === 'idle' || status === 'loading') {
    return (
      <Layout>
        <StatusMessage title="Hanging the gallery…">
          <p>Fetching artworks from the Art Institute of Chicago.</p>
        </StatusMessage>
      </Layout>
    )
  }

  if (status === 'error') {
    return (
      <Layout>
        <StatusMessage title="Couldn't load the artworks" tone="error">
          <p>{state.error}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={startGame}>Try again</Button>
            <ButtonLink to="/">Back home</ButtonLink>
          </div>
        </StatusMessage>
      </Layout>
    )
  }

  const round = rounds[roundIndex]
  // Defensive: a "playing" game always has rounds, but an empty list shouldn't crash the page.
  if (!round) {
    return (
      <Layout>
        <StatusMessage title="No artworks to show" tone="error">
          <Button onClick={startGame}>Start a new game</Button>
        </StatusMessage>
      </Layout>
    )
  }

  const revealed = guessedId !== null
  const correct = guessedId === round.olderId
  const isLastRound = roundIndex === rounds.length - 1

  return (
    <Layout>
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-xl font-bold">
          Round {roundIndex + 1} <span className="font-normal text-stone-600">of {ROUNDS_PER_GAME}</span>
        </h1>
        <p className="text-stone-700">
          Score: <strong>{score}</strong>
        </p>
      </div>

      {!revealed && <p className="mb-4 text-lg">Which artwork is older?</p>}

      {/* Stacked on phones, side by side from the md breakpoint up. */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* key forces a fresh card (and image loading state) every round. */}
        {round.pair.map((artwork, index) => (
          <ArtworkCard
            key={`${roundIndex}-${artwork.id}`}
            artwork={artwork}
            position={index === 0 ? 'first' : 'second'}
            revealed={revealed}
            isOlder={artwork.id === round.olderId}
            isChosen={artwork.id === guessedId}
            onChoose={() => guess(artwork.id)}
          />
        ))}
      </div>

      {revealed && (
        <div
          role="status"
          className={`mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border-2 p-4 ${correct ? 'border-emerald-600 bg-emerald-50' : 'border-red-400 bg-red-50'}`}
        >
          <p className="text-xl font-bold">{correct ? 'Correct!' : 'Not quite.'}</p>
          {/* autoFocus moves keyboard users straight to the next action after guessing. */}
          <Button autoFocus onClick={nextRound}>
            {isLastRound ? 'See results' : 'Next round'}
          </Button>
        </div>
      )}
    </Layout>
  )
}
