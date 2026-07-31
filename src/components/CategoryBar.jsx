import { useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { fetchCategories } from '../lib/api'

export default function CategoryBar({ selected, onSelect, className = '' }) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const reduce = useReducedMotion()

  useEffect(() => {
    let cancelled = false
    fetchCategories()
      .then((data) => { if (!cancelled) setCategories(data) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  if (loading || categories.length === 0) return null

  const btnBase = 'rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 active:scale-[0.98]'

  return (
    <motion.div
      className="mb-8 flex flex-wrap items-center gap-2"
      initial={reduce ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
    >
      <button
        onClick={() => onSelect(null)}
        className={btnBase}
        style={{
          color: selected === null ? '#09090b' : 'var(--color-text-secondary)',
          background: selected === null ? 'var(--color-accent)' : 'transparent',
          border: selected === null ? 'none' : '1px solid var(--color-border-strong)',
        }}
      >
        全部
      </button>
      {categories.map((cat) => (
        <button
          key={cat.slug}
          onClick={() => onSelect(cat.slug)}
          className={btnBase}
          style={{
            color: selected === cat.slug ? '#09090b' : 'var(--color-text-secondary)',
            background: selected === cat.slug ? 'var(--color-accent)' : 'transparent',
            border: selected === cat.slug ? 'none' : '1px solid var(--color-border-strong)',
          }}
        >
          {cat.name}
        </button>
      ))}
    </motion.div>
  )
}
