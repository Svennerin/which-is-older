import type { ButtonHTMLAttributes } from 'react'
import { Link, type LinkProps } from 'react-router-dom'

const styles =
  'inline-block rounded-lg bg-stone-900 px-6 py-3 text-lg font-semibold text-white transition hover:bg-amber-700 focus-visible:outline-4 focus-visible:outline-offset-2 focus-visible:outline-amber-600'

export function Button(props: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button type="button" {...props} className={styles} />
}

export function ButtonLink(props: LinkProps) {
  return <Link {...props} className={styles} />
}
