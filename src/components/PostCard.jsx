import { Link } from 'react-router'
import { ArrowRight, Code, NotePencil } from '@phosphor-icons/react'

function formatDate(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const CATEGORY_ICONS = { tech: Code, notes: NotePencil }
const CATEGORY_NAMES = { tech: '技术', notes: '随记' }

export default function PostCard({ post }) {
  const catIcon = post.category ? (CATEGORY_ICONS[post.category] || Code) : null
  const catName = post.category ? (CATEGORY_NAMES[post.category] || post.category) : null
  const Icon = catIcon

  return (
    <Link
      to={`/post/${encodeURIComponent(post.slug)}`}
      className="glass3d group flex h-full flex-col rounded-2xl border border-white/[0.06] p-5 transition-all duration-500 hover:-translate-y-1.5 active:scale-[0.98]"
    >
      <div className="flex h-full flex-col">
        {/* Date & Category row */}
        <div className="mb-2 flex items-center gap-2 flex-wrap">
          <time
            className="inline-block rounded-md px-2 py-0.5 text-xs font-medium tabular-nums"
            style={{ color: '#52525b', background: 'hsla(40,30%,92%,0.6)' }}
            dateTime={post.date}
          >
            {formatDate(post.date)}
          </time>

          {catName && Icon && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
              style={{
                background: 'hsla(15,42%,36%,0.85)',
                color: '#fafafa',
              }}
            >
              <Icon size={10} weight="bold" />
              {catName}
            </span>
          )}
        </div>

        {/* Title */}
        <h2 className="mb-1.5 text-lg font-semibold tracking-tight">
          <span
            style={{
              color: '#18181b',
              background: 'hsla(38,35%,90%,0.78)',
              borderRadius: '5px',
              padding: '2px 6px',
              boxDecorationBreak: 'clone',
              WebkitBoxDecorationBreak: 'clone',
            }}
          >
            {post.title}
          </span>
        </h2>

        {/* Description */}
        <p className="mb-4 flex-1 text-sm leading-relaxed">
          <span
            style={{
              color: '#3f3f46',
              background: 'hsla(38,45%,68%,0.6)',
              borderRadius: '4px',
              padding: '1px 5px',
              boxDecorationBreak: 'clone',
              WebkitBoxDecorationBreak: 'clone',
            }}
          >
            {post.description || '暂无简介'}
          </span>
        </p>

        {/* Tags */}
        {post.tags?.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                style={{
                  color: '#3f3f46',
                  background: 'hsla(290,18%,80%,0.75)',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Read link */}
        <span className="mt-auto">
          <span
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-sm font-medium transition-all duration-300 group-hover:gap-2.5"
            style={{ color: '#fafafa', background: 'hsla(280,25%,28%,0.8)' }}
          >
            阅读
            <ArrowRight size={14} weight="light" className="transition-transform duration-300 group-hover:translate-x-0.5" />
          </span>
        </span>
      </div>
    </Link>
  )
}
