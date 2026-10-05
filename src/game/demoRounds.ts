import type { Artwork, Round } from '../types.ts'
import { makeRound, type Rng } from './pairing.ts'

// A fixed 10-round game with images bundled in /public/demo.
//
// Why it exists: the museum's image server (www.artic.edu) sits behind bot
// protection that rejects image requests from many networks, even though its
// data API is open. When the app detects that, it plays this set instead so
// the demo still works. Every pair was checked against the normal pairing
// rules (fair gap, no overlapping date ranges); metadata comes from the API.
// All works are public domain.

const DEMO_PAIRS: [Artwork, Artwork][] = [
  [
    { id: 27992, title: "A Sunday on La Grande Jatte — 1884", artist: "Georges Seurat (French, 1859–1891)", dateDisplay: "1884–86, border added 1888–89", year: 1885, yearStart: 1884, yearEnd: 1886, imageId: "2d484387-2509-5e8e-2c43-22f9981972eb" },
    { id: 14598, title: "The Beach at Sainte-Adresse", artist: "Claude Monet (French, 1840–1926)", dateDisplay: "1867", year: 1867, yearStart: 1867, yearEnd: 1867, imageId: "95be2572-b53d-8e7b-abc9-10eb48d4fa5d" },
  ],
  [
    { id: 95998, title: "Old Man with a Gold Chain", artist: "Rembrandt van Rijn (Dutch, 1606–1669)", dateDisplay: "1631", year: 1631, yearStart: 1631, yearEnd: 1631, imageId: "3eaab3a3-2b47-9fdd-121c-050f6b8d9ccb" },
    { id: 869, title: "The Watermill with the Great Red Roof", artist: "Meindert Hobbema (Dutch, 1638–1709)", dateDisplay: "c. 1665", year: 1665, yearStart: 1660, yearEnd: 1670, imageId: "237c25a2-6051-a8e7-1610-a01938d4deab" },
  ],
  [
    { id: 454, title: "Statuette of a Seated Girl", artist: "Greek; Athens", dateDisplay: "330-320 BCE", year: -325, yearStart: -330, yearEnd: -320, imageId: "38ea638d-c8f7-f916-da08-ac7730b6ed5a" },
    { id: 58135, title: "Portrait Head of Emperor Hadrian", artist: "Roman", dateDisplay: "130-138", year: 165, yearStart: 130, yearEnd: 200, imageId: "4ba54d83-416b-92bf-6098-89ffec76a496" },
  ],
  [
    { id: 16568, title: "Water Lilies", artist: "Claude Monet (French, 1840–1926)", dateDisplay: "1906", year: 1906, yearStart: 1906, yearEnd: 1906, imageId: "3c27b499-af56-f0d5-93b5-a7f2f1ad5813" },
    { id: 8991, title: "Improvisation No. 30 (Cannons)", artist: "Vasily Kandinsky\nBorn Moscow (formerly Russian Empire, now Russia), 1866; died Neuilly-sur-Seine, France, 1944", dateDisplay: "1913", year: 1913, yearStart: 1913, yearEnd: 1913, imageId: "b5bc6b66-9e6e-fe57-dcec-fc49e820e904" },
  ],
  [
    { id: 87479, title: "The Assumption of the Virgin", artist: "El Greco (Doménikos Theotokópoulos; Greek, active in Spain, 1541–1614)", dateDisplay: "1577–79", year: 1578, yearStart: 1577, yearEnd: 1579, imageId: "47fd1564-93f5-f30b-7786-013421133b4a" },
    { id: 27310, title: "The Holy Family with Saints Elizabeth and John the Baptist", artist: "Peter Paul Rubens (Flemish, 1577–1640)", dateDisplay: "c. 1615", year: 1615, yearStart: 1610, yearEnd: 1620, imageId: "caac7478-b78f-a94d-a36c-fc5dde17e7c9" },
  ],
  [
    { id: 28560, title: "The Bedroom", artist: "Vincent van Gogh (Dutch, 1853–1890)", dateDisplay: "1889", year: 1889, yearStart: 1889, yearEnd: 1889, imageId: "6644829f-f292-c5c4-a73c-0356a6fdbf0d" },
    { id: 56905, title: "Nocturne: Blue and Gold—Southampton Water", artist: "James McNeill Whistler (American, 1834–1903)", dateDisplay: "1872", year: 1872, yearStart: 1872, yearEnd: 1872, imageId: "50034c7f-ce51-00f1-430e-a6f7efc233fc" },
  ],
  [
    { id: 61483, title: "Quiet Life in a Wooded Glen 林麓幽居圖", artist: "Wang Meng 王蒙 (Chinese, c. 1308-1385)", dateDisplay: "Yuan dynasty (1279–1368), dated 1361", year: 1361, yearStart: 1361, yearEnd: 1361, imageId: "c3137834-c062-1784-84f9-e2d6109b085f" },
    { id: 22527, title: "Crucifix", artist: "Master of the Bigallo Crucifix (Italian, active mid-13th century)", dateDisplay: "c. 1240", year: 1240, yearStart: 1235, yearEnd: 1245, imageId: "50a55ce9-ba60-1b04-f033-2e562598985a" },
  ],
  [
    { id: 27984, title: "Woman before an Aquarium", artist: "Henri Matisse\nFrench, 1869–1954", dateDisplay: "1921–23", year: 1922, yearStart: 1921, yearEnd: 1923, imageId: "d0e36029-27fc-bf4e-357a-55cfbaf7bdfd" },
    { id: 15401, title: "At Mouquin's", artist: "William Glackens (American, 1870–1938)", dateDisplay: "1905", year: 1905, yearStart: 1905, yearEnd: 1905, imageId: "b146368d-a855-63ac-6115-04b835c60bb0" },
  ],
  [
    { id: 4788, title: "Lady Sarah Bunbury Sacrificing to the Graces", artist: "Sir Joshua Reynolds (English, 1723–1792)", dateDisplay: "1763–65", year: 1764, yearStart: 1763, yearEnd: 1765, imageId: "5a047a1c-d36e-e88d-05e7-845d3936159b" },
    { id: 27307, title: "Madame de Pastoret and Her Son", artist: "Jacques-Louis David (French, 1748–1825)", dateDisplay: "1791–92", year: 1792, yearStart: 1791, yearEnd: 1792, imageId: "72227c9e-413c-8930-477d-5a90e0a2123c" },
  ],
  [
    { id: 90048, title: "Distant View of Niagara Falls", artist: "Thomas Cole (American, born England, 1801–1848)", dateDisplay: "1830", year: 1830, yearStart: 1830, yearEnd: 1830, imageId: "18092196-50ae-3ff1-9205-1b3110e966c3" },
    { id: 16499, title: "Jesus Mocked by the Soldiers", artist: "Édouard Manet (French, 1832–1883)", dateDisplay: "1865", year: 1865, yearStart: 1865, yearEnd: 1865, imageId: "4d03ba14-a01a-d003-404a-cf3f9fb40ede" },
  ],
]

/** Where a demo image lives. Filenames are the artwork's IIIF image id. */
export function demoImagePath(imageId: string): string {
  return `/demo/${imageId}.jpg`
}

/** Builds the demo game. Left/right placement is still shuffled each time. */
export function buildDemoRounds(rng: Rng): Round[] {
  return DEMO_PAIRS.map(([a, b]) =>
    makeRound([{ ...a, localImage: demoImagePath(a.imageId) }, { ...b, localImage: demoImagePath(b.imageId) }], rng),
  )
}

/** Every image id the demo needs, for tests and the download helper. */
export const DEMO_IMAGE_IDS = DEMO_PAIRS.flatMap((pair) => pair.map((artwork) => artwork.imageId))
