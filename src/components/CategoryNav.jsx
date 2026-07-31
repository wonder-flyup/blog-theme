import { useState, useEffect } from 'react'
import { fetchCategories, fetchPosts } from '../lib/api'

export default function CategoryNav({ selected, onSelect }) {
  const [categories, setCategories] = useState([])
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      fetchCategories(),
      fetchPosts(),
    ])
      .then(([cats, posts]) => {
        if (cancelled) return
        setCategories(cats)
        const map = { all: posts.length }
        cats.forEach((c) => {
          map[c.slug] = posts.filter((p) => p.category === c.slug).length
        })
        setCounts(map)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  if (loading) return null

  return (
    <div
      className="sticky top-24 flex h-full flex-col rounded-2xl border border-white/[0.06] p-5"
      style={{
        background: 'rgba(24,24,27,0.3)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2), 0 0 0 1px rgba(45,212,191,0.04), 0 0 20px rgba(45,212,191,0.02)',
      }}
    >
      <div className="relative z-10 flex h-full flex-col">
      <h3
        className="mb-4 text-xs font-medium tracking-[0.15em] uppercase"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        分类
      </h3>

      <nav aria-label="分类导航" className="flex-1">
        <ul className="space-y-1">
          <CategoryItem
            label="全部"
            count={counts.all}
            active={selected === null}
            onClick={() => onSelect(null)}
          />
          {categories.map((cat) => (
            <CategoryItem
              key={cat.slug}
              label={cat.name}
              count={counts[cat.slug] || 0}
              active={selected === cat.slug}
              onClick={() => onSelect(cat.slug)}
            />
          ))}
        </ul>
      </nav>
      </div>
    </div>
  )
}

function CategoryItem({ label, count, active, onClick }) {
  return (
    <li>
      <button
        onClick={onClick}
        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-200"
        style={{
          color: active ? 'var(--color-accent)' : 'var(--color-text-secondary)',
          background: active ? 'var(--color-accent-glow)' : 'transparent',
          borderLeft: active ? '2px solid var(--color-accent)' : '2px solid transparent',
        }}
      >
        <span>{label}</span>
        <span
          className="rounded-full px-2 py-0.5 text-xs tabular-nums"
          style={{
            color: active ? 'var(--color-accent)' : 'var(--color-text-tertiary)',
            background: active ? 'rgba(45,212,191,0.2)' : 'transparent',
          }}
        >
          {count}
        </span>
      </button>
    </li>
  )
}
