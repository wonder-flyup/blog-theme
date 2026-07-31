import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { ArrowLeft, Calendar, Tag, Code, NotePencil } from '@phosphor-icons/react'
import { fetchPost } from '../lib/api'
import Skeleton from './Skeleton'

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const CATEGORY_ICONS = { tech: Code, notes: NotePencil }
const CATEGORY_NAMES = { tech: '技术', notes: '随记' }

export default function PostDetail() {
  const { slug } = useParams()
  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    fetchPost(slug)
      .then((data) => { if (!cancelled) { setPost(data); setLoading(false) } })
      .catch((err) => { if (!cancelled) { setError(err.message); setLoading(false) } })
    return () => { cancelled = true }
  }, [slug])

  if (loading) {
    return (
      <article className="px-6 py-24">
        <div className="mx-auto max-w-2xl">
          <Skeleton count={1} />
        </div>
      </article>
    )
  }

  if (error) {
    return (
      <article className="px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <div
            className="rounded-2xl border p-8"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
          >
            <p className="mb-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              文章加载失败：{error}
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors"
              style={{ color: 'var(--color-accent)', background: 'var(--color-accent-glow)' }}
            >
              <ArrowLeft size={14} weight="light" />
              返回首页
            </Link>
          </div>
        </div>
      </article>
    )
  }

  if (!post) return null

  return (
    <article className="px-6 py-16 md:py-24">
      <div className="mx-auto max-w-2xl content-card">
        {/* Back link */}
        <Link
          to="/"
          className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-70"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          <ArrowLeft size={14} weight="light" />
          返回文章列表
        </Link>

        {/* Header */}
        <header className="mb-10">
          <h1
            className="mb-4 text-3xl font-semibold tracking-tight md:text-4xl"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center gap-4">
            <span
              className="inline-flex items-center gap-1.5 text-sm"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              <Calendar size={14} weight="light" />
              <time dateTime={post.date} className="tabular-nums">
                {formatDate(post.date)}
              </time>
            </span>
            {post.category && CATEGORY_NAMES[post.category] && (() => {
              const CatIcon = CATEGORY_ICONS[post.category] || Code
              return (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
                  style={{ background: 'var(--color-accent)', color: '#09090b' }}
                >
                  <CatIcon size={11} weight="bold" />
                  {CATEGORY_NAMES[post.category] || post.category}
                </span>
              )
            })()}
            {post.tags?.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
                style={{ color: 'var(--color-accent)', background: 'var(--color-accent-glow)' }}
              >
                <Tag size={12} weight="light" />
                {tag}
              </span>
            ))}
          </div>
        </header>

        {/* Accent divider */}
        <div
          className="mb-10 h-[1px] w-full"
          style={{ background: 'var(--color-border-strong)' }}
          aria-hidden="true"
        />

        {/* Content */}
        <div className="prose-custom">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h1: ({ children, ...props }) => {
                const id = typeof children === 'string' ? children.toLowerCase().replace(/\s+/g, '-') : undefined
                return <h1 id={id} className="mb-6 mt-12 text-2xl font-semibold tracking-tight" style={{ color: 'var(--color-text-primary)' }} {...props}>{children}</h1>
              },
              h2: ({ children, ...props }) => {
                const id = typeof children === 'string' ? children.toLowerCase().replace(/\s+/g, '-') : undefined
                return <h2 id={id} className="mb-4 mt-10 text-xl font-semibold tracking-tight" style={{ color: 'var(--color-text-primary)' }} {...props}>{children}</h2>
              },
              h3: ({ children, ...props }) => {
                return <h3 className="mb-3 mt-8 text-lg font-semibold tracking-tight" style={{ color: 'var(--color-text-primary)' }} {...props}>{children}</h3>
              },
              p: ({ children, ...props }) => (
                <p className="mb-5 leading-relaxed" style={{ color: 'var(--color-text-secondary)', maxWidth: '65ch' }} {...props}>{children}</p>
              ),
              a: ({ children, href, ...props }) => (
                <a href={href} className="underline underline-offset-2 transition-colors hover:opacity-70" style={{ color: 'var(--color-accent)' }} {...props}>{children}</a>
              ),
              ul: ({ children, ...props }) => (
                <ul className="mb-5 list-disc space-y-2 pl-5" style={{ color: 'var(--color-text-secondary)' }} {...props}>{children}</ul>
              ),
              ol: ({ children, ...props }) => (
                <ol className="mb-5 list-decimal space-y-2 pl-5" style={{ color: 'var(--color-text-secondary)' }} {...props}>{children}</ol>
              ),
              li: ({ children, ...props }) => (
                <li className="leading-relaxed" {...props}>{children}</li>
              ),
              blockquote: ({ children, ...props }) => (
                <blockquote
                  className="my-6 border-l-2 py-1 pl-5 italic"
                  style={{ borderColor: 'var(--color-accent)', color: 'var(--color-text-secondary)' }}
                  {...props}
                >
                  {children}
                </blockquote>
              ),
              code: ({ className, children, ...props }) => {
                const match = /language-(\w+)/.exec(className || '')
                const isInline = !match && !className
                if (isInline) {
                  return (
                    <code
                      className="rounded-md px-1.5 py-0.5 text-sm font-medium"
                      style={{ background: 'var(--color-surface-elevated)', color: 'var(--color-accent)', fontFamily: 'var(--font-mono)' }}
                      {...props}
                    >
                      {children}
                    </code>
                  )
                }
                return (
                  <SyntaxHighlighter
                    style={oneDark}
                    language={match ? match[1] : 'text'}
                    PreTag="div"
                    customStyle={{
                      margin: '1.5rem 0',
                      borderRadius: '12px',
                      padding: '1.25rem',
                      fontSize: '0.875rem',
                      fontFamily: 'var(--font-mono)',
                      background: 'var(--color-surface-elevated)',
                    }}
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                )
              },
              pre: ({ children, ...props }) => <div {...props}>{children}</div>,
              hr: ({ ...props }) => (
                <hr className="my-12 border-0" style={{ borderTop: '1px solid var(--color-border-strong)' }} {...props} />
              ),
              img: ({ src, alt, ...props }) => (
                <img src={src} alt={alt} className="my-8 rounded-xl" style={{ maxWidth: '100%' }} {...props} />
              ),
              strong: ({ children, ...props }) => (
                <strong style={{ color: 'var(--color-text-primary)', fontWeight: 600 }} {...props}>{children}</strong>
              ),
            }}
          >
            {post.content}
          </ReactMarkdown>
        </div>

        {/* Bottom divider */}
        <div
          className="mt-16 h-[1px] w-full"
          style={{ background: 'var(--color-border-strong)' }}
          aria-hidden="true"
        />

        {/* Back to home */}
        <div className="mt-8">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-70"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            <ArrowLeft size={14} weight="light" />
            返回文章列表
          </Link>
        </div>
      </div>
    </article>
  )
}
