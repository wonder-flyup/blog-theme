import { useState, useEffect } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { fetchPosts } from '../lib/api'
import PostCard from './PostCard'
import Skeleton from './Skeleton'

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] },
  }),
}

export default function PostList({ category }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchPosts(category)
      .then((data) => { if (!cancelled) { setPosts(data); setLoading(false) } })
      .catch((err) => { if (!cancelled) { setError(err.message); setLoading(false) } })
    return () => { cancelled = true }
  }, [category])

  if (loading) {
    return (
      <section aria-label="文章列表加载中">
        <SectionHeader />
        <Skeleton count={4} />
      </section>
    )
  }

  if (error) {
    return (
      <section aria-label="文章列表加载失败">
        <SectionHeader />
        <div
          className="rounded-2xl border p-8 text-center"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
        >
          <p className="mb-3 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            文章加载失败：{error}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-full px-4 py-2 text-sm font-medium transition-colors active:scale-[0.98]"
            style={{ color: 'var(--color-accent)', background: 'var(--color-accent-glow)' }}
          >
            重试
          </button>
        </div>
      </section>
    )
  }

  if (posts.length === 0) {
    const msg = category ? '该分类下暂无文章' : '还没有文章，敬请期待。'
    return (
      <section aria-label="暂无文章">
        <SectionHeader />
        <div
          className="rounded-2xl border p-12 text-center"
          style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
        >
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
            {msg}
          </p>
        </div>
      </section>
    )
  }

  return (
    <section aria-label="文章列表">
      <SectionHeader />
      <div className="grid gap-4">
        {posts.map((post, i) => (
          <motion.div
            key={post.slug}
            variants={fadeUp}
            initial={reduce ? false : 'hidden'}
            whileInView="visible"
            viewport={{ once: true, amount: 0.1 }}
            custom={i}
          >
            <PostCard post={post} />
          </motion.div>
        ))}
      </div>
    </section>
  )
}

function SectionHeader() {
  const reduce = useReducedMotion()
  return (
    <motion.h2
      className="mb-6 text-xs font-medium tracking-[0.15em] uppercase"
      style={{ color: 'var(--color-text-tertiary)' }}
      initial={reduce ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      最近文章
    </motion.h2>
  )
}
