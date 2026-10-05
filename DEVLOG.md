# Dev log

One entry per step: what I did, and why.

## 1. Probe the Art Institute API before designing anything
Called the live search endpoint to confirm field names, BCE handling and limits, because the brief's details were from memory. Findings: POST search with `bool`/`range` filters works and negative years are real numbers; `random_score` is rejected; the documented limit is 60 requests/minute per IP; `limit` accepts 100.

## 2. Scaffold Vite + React + TypeScript, add Router, Tailwind, Vitest
Used the `react-ts` template in a `which-is-older/` subfolder because the repo root already holds an unrelated static site. Added route stubs (`/`, `/play`, `/results`), Tailwind v4 via its Vite plugin (no config file needed), and Vitest in node mode since the pairing logic is pure TS.

## 3. Add `vercel.json` SPA fallback
Without a rewrite to `index.html`, refreshing `/play` on Vercel would 404 because only `/` exists as a file.

## 4. Model the data: `types.ts` and `game/config.ts`
Wrote the API response, `Artwork`, `Round` and `GameState` types first, plus a single config file holding every tunable number (era bands, gap rules, max date span). Pairing thresholds live in one place so they can be changed without touching logic.

## 5. Switch to one request per era band (5 requests per game)
The API allows 60 requests/minute, so rather than one query per round (12-15 per game) I fetch 100 results for each of 5 era bands in parallel and build all 10 rounds from those pools. Bands, not one big pool, because the collection is dominated by the 1800s and a single pool would leave ancient pieces without partners.

## 6. Pairing logic (`game/pairing.ts`) with tests
Pure functions with an injectable random generator, so tests are repeatable. A pair is valid only if the date ranges do not overlap and the gap fits the band's rule. If a band's pool has no valid pair, the gap relaxes in steps (never below 2 years); if that still fails, the round is given to another band. Handles BCE, including the quirk that there is no year 0.

## 7. Test against the live API and fix what it revealed
Two surprises the docs did not make obvious: the API returns HTTP 403 for any query where page x limit exceeds 1,000, and almost nothing after 1939 is public domain. My guessed page ranges failed, so I capped random pages at 3 and ended the last band at 1939.

## 8. Random year window per band, for variety
Because only the first 1,000 results of a query are reachable, a fixed band would show the same artworks every game. Each band now queries a random sub-window of years. Verified over 8 live games: exactly 5 requests each, 10 rounds each, no errors.

## 9. Game state as a reducer, shared through context
All state changes (load, guess, next round) go through one pure `gameReducer`, which is unit tested. A `GameProvider` above the router keeps the state alive while the player moves between pages. A ref guards against React StrictMode's double-run effects firing two sets of API calls in development.

## 10. Build the screens and components
Home, game and results pages plus `ArtworkCard`, `ArtworkImage`, `StatusMessage` and `Button`. Before a guess the card is a single real `<button>` showing only the image (alt text avoids the title because titles can contain dates); after a guess it becomes a figure with date, title and artist. Loading, error and empty states each have a message, and keyboard focus moves to the "Next" button after a guess. Also strip HTML tags that the API leaves in some titles.

## 11. Run it in a browser: the image host blocks this machine
Playing through in the browser pane confirmed the data flow works (5 API requests, rounds render), but every image fails: `www.artic.edu/iiif/...` (the URL format the official docs prescribe) returns a Cloudflare "you have been blocked" page for this machine. The API host (`api.artic.edu`) is unaffected. I did not try to bypass the block. Needs the owner to check whether their own browser can load an image URL.

## 12. Diagnose the image block and add a fallback
DevTools showed a plain 403 with no Cloudflare challenge header and no verification cookie sent, so the game's images are rejected outright rather than challenged. Tried sending no `Referer` (`referrerPolicy="no-referrer"`) in case the host rejects cross-site image requests. Also added a link on failed images that opens the image directly (only on revealed cards, since a link inside a button is invalid HTML).

## 13. Write the README
Documented the problem, stack, how pairing works, and the three API limits found by testing. Screenshots and the live link are marked TODO until images load and the site is deployed.
