import { useEffect, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button, ButtonLink } from '../components/Button.tsx'
import DemoNotice from '../components/DemoNotice.tsx'
import Layout from '../components/Layout.tsx'
import { ROUNDS_PER_GAME } from '../game/config.ts'
import { useGame } from '../game/useGame.ts'
import { readHighScore, saveHighScore } from '../game/highScore.ts'

function verdict(score: number, total: number): string {
  const share = score / total
  if (share === 1) return 'A perfect eye.'
  if (share >= 0.8) return 'Impressive. You know your art history.'
  if (share >= 0.6) return 'Solid. Better than a coin flip.'
  if (share >= 0.4) return 'About what chance would give you.'
  return 'Tricky collection. Try again!'
}

export default function ResultsPage() {
  const { state, startGame } = useGame()
  const navigate = useNavigate()
  const { status, score, rounds, guesses, isDemo } = state
  // Read the stored best once, before this game's score is saved, so we can tell if it's a new record.
  const [previousBest] = useState(readHighScore)
  const isNewBest = !isDemo && score > (previousBest ?? 0)

  // Saving is a side effect on an external system (localStorage), which is what effects are for.
  useEffect(() => {
    // The demo is the same 10 pairs every time, so its scores would not be a fair personal best.
    if (status === 'finished' && !isDemo) saveHighScore(score)
  }, [status, score, isDemo])

  // Reaching /results without finishing a game (e.g. after a refresh) has nothing to show.
  if (status !== 'finished') return <Navigate to="/" replace />

  const playAgain = () => {
    startGame()
    navigate('/play')
  }

  return (
    <Layout>
      {isDemo && <DemoNotice />}
      <section className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold">
          {score} / {rounds.length}
        </h1>
        <p className="mt-2 text-lg text-stone-700">{verdict(score, rounds.length)}</p>
        {isNewBest ? (
          <p className="mt-2 font-semibold text-emerald-800">New personal best!</p>
        ) : (
          previousBest !== null && (
            <p className="mt-2 text-stone-700">
              Personal best: {previousBest} / {ROUNDS_PER_GAME}
            </p>
          )
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button onClick={playAgain}>Play again</Button>
          <ButtonLink to="/">Home</ButtonLink>
        </div>
      </section>

      <section className="mt-10" aria-labelledby="review-heading">
        <h2 id="review-heading" className="mb-3 text-xl font-bold">
          Round by round
        </h2>
        <ol className="space-y-3">
          {rounds.map((round, index) => {
            const wasCorrect = guesses[index] === round.olderId
            const older = round.pair.find((artwork) => artwork.id === round.olderId)!
            const newer = round.pair.find((artwork) => artwork.id !== round.olderId)!
            return (
              <li key={older.id} className="rounded-lg border border-stone-300 bg-white p-4">
                <p className={`font-semibold ${wasCorrect ? 'text-emerald-800' : 'text-red-800'}`}>
                  Round {index + 1}: {wasCorrect ? 'Correct' : 'Missed'}
                </p>
                <p className="mt-1">
                  <strong>Older:</strong> {older.title} <span className="text-stone-600">({older.dateDisplay})</span>
                </p>
                <p>
                  <strong>Newer:</strong> {newer.title} <span className="text-stone-600">({newer.dateDisplay})</span>
                </p>
              </li>
            )
          })}
        </ol>
      </section>
    </Layout>
  )
}
