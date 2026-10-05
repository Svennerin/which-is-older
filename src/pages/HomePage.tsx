import { ButtonLink } from '../components/Button.tsx'
import Layout from '../components/Layout.tsx'
import { ROUNDS_PER_GAME } from '../game/config.ts'
import { demoImagePath } from '../game/demoRounds.ts'
import { readHighScore } from '../game/highScore.ts'

// Two bundled demo paintings, used purely as decoration so the home page has
// something to look at. They ship with the app, so they load for every visitor.
const HERO_IMAGES = [
  { imageId: '95be2572-b53d-8e7b-abc9-10eb48d4fa5d', rotate: '-rotate-2' },
  { imageId: '2d484387-2509-5e8e-2c43-22f9981972eb', rotate: 'rotate-2' },
]

const STEPS = [
  { title: 'Look', text: 'Two artworks appear with no titles, artists or dates. Just the images.' },
  { title: 'Guess', text: 'Click the one you think was made first. Some pairs are only a few years apart.' },
  { title: 'Learn', text: 'Both works are revealed with their dates, so every round teaches you something.' },
]

export default function HomePage() {
  const highScore = readHighScore()

  return (
    <Layout>
      <section className="mx-auto max-w-3xl text-center">
        {/* Decorative: the images say nothing the headline doesn't, so their alt text is empty. */}
        <div className="mb-8 flex items-center justify-center gap-4 sm:gap-6" aria-hidden="true">
          {HERO_IMAGES.map(({ imageId, rotate }) => (
            <div key={imageId} className={`rounded-xl bg-white p-2 shadow-lg ${rotate}`}>
              <img
                src={demoImagePath(imageId)}
                alt=""
                className="h-32 w-40 rounded-lg object-cover sm:h-44 sm:w-56"
              />
            </div>
          ))}
        </div>

        <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">Which Is Older?</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-stone-700">
          A guessing game with {ROUNDS_PER_GAME} rounds of public-domain art from the Art Institute of Chicago, from
          ancient sculpture to the 1930s.
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

      <section className="mx-auto mt-16 max-w-4xl" aria-labelledby="how-heading">
        <h2 id="how-heading" className="mb-6 text-center text-2xl font-bold">
          How it works
        </h2>
        <ol className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((step, index) => (
            <li key={step.title} className="rounded-xl border border-stone-300 bg-white p-5">
              <p className="text-sm font-semibold text-amber-800">Step {index + 1}</p>
              <p className="mt-1 text-xl font-bold">{step.title}</p>
              <p className="mt-2 text-stone-700">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>
    </Layout>
  )
}
