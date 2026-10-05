import type { ReactNode } from 'react'

interface Props {
  title: string
  children?: ReactNode
  /** role="alert" announces errors immediately to screen readers; "status" is politer. */
  tone?: 'info' | 'error'
}

/** One consistent look for loading, error and empty states. */
export default function StatusMessage({ title, children, tone = 'info' }: Props) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={`mx-auto max-w-lg rounded-xl border p-8 text-center ${tone === 'error' ? 'border-red-300 bg-red-50 text-red-950' : 'border-stone-300 bg-white'}`}
    >
      <h1 className="text-2xl font-bold">{title}</h1>
      {children && <div className="mt-3 space-y-4 text-stone-700">{children}</div>}
    </div>
  )
}
