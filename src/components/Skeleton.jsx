export default function Skeleton({ count = 4 }) {
  return (
    <div className="grid gap-6 sm:grid-cols-2" aria-hidden="true">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-2xl border p-6"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div
            className="mb-3 h-3 w-16 rounded-full"
            style={{ background: 'var(--color-surface-elevated)' }}
          />
          <div
            className="mb-2 h-6 w-3/4 rounded-md"
            style={{ background: 'var(--color-surface-elevated)' }}
          />
          <div
            className="mb-4 h-4 w-full rounded-md"
            style={{ background: 'var(--color-surface-elevated)' }}
          />
          <div
            className="h-3 w-24 rounded-full"
            style={{ background: 'var(--color-surface-elevated)' }}
          />
        </div>
      ))}
    </div>
  )
}
