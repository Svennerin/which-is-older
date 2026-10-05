import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

/** Shared page frame: a header that links home, and a centered content column. */
export default function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-stone-100 text-stone-900">
      <header className="border-b border-stone-300 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link to="/" className="rounded text-lg font-bold tracking-tight focus-visible:outline-4 focus-visible:outline-amber-600">
            Which Is Older?
          </Link>
          <span className="text-sm text-stone-600">Art Institute of Chicago</span>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  )
}
