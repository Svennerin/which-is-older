import { imageUrl } from './artic.ts'

// An image the museum has long served ("The Bedroom", Van Gogh). Any image would do;
// a tiny 60px version keeps the check cheap.
const PROBE_IMAGE_ID = '6644829f-f292-c5c4-a73c-0356a6fdbf0d'

/**
 * Checks whether this browser can load images from the museum's image server.
 *
 * Its data API is open, but the image server sits behind bot protection that
 * rejects image requests from many networks. A real <img> request is the only
 * honest test, because it is exactly what the game does. We give up after a
 * timeout so a stalled request can't hold the game hostage.
 */
export function canReachImageHost(timeoutMs = 6000): Promise<boolean> {
  return new Promise((resolve) => {
    const probe = new Image()
    const timer = setTimeout(() => finish(false), timeoutMs)

    function finish(reachable: boolean) {
      clearTimeout(timer)
      probe.onload = null
      probe.onerror = null
      resolve(reachable)
    }

    probe.onload = () => finish(true)
    probe.onerror = () => finish(false)
    // Same policy as the game's real images (see ArtworkImage).
    probe.referrerPolicy = 'no-referrer'
    probe.src = imageUrl(PROBE_IMAGE_ID, 60)
  })
}
