import { ButtonLink } from '../components/Button.tsx'
import Layout from '../components/Layout.tsx'
import { ROUNDS_PER_GAME } from '../game/config.ts'
import { readHighScore } from '../game/highScore.ts'

export default function HomePage() {
  const highScore = readHighScore()

  return (
    <Layout>
      <section className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Which Is Older?</h1>
        <p className="mt-4 text-lg text-stone-700">
          Two artworks from the Art Institute of Chicago appear side by side. Click the one you think was made first.
          Titles, artists and dates are revealed after you guess.
        </p>
        <p className="mt-2 text-stone-700">
          {ROUNDS_PER_GAME} rounds, from ancient coins to 1930s photographs. Some pairs are only a few years apart.
        </p>
        <div className="mt-8">
          <ButtonLink to="/play">Start playing</ButtonLink>
        </div>
        {highScore !== null && (
          <p className="mt-6 text-stone-700">
            Your best score: <strong>{highScore}</strong> / {ROUNDS_PER_GAME}
          </p>
        )}
      </section>
    </Layout>
  )
}
