import { Link } from 'react-router'
import { ArrowLeft } from '@phosphor-icons/react'

export default function About() {
  return (
    <section className="px-6 py-24">
      <div className="mx-auto max-w-2xl">
        {/* Back link */}
        <Link
          to="/"
          className="mb-10 inline-flex items-center gap-1.5 text-sm font-medium transition-colors hover:opacity-70"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          <ArrowLeft size={14} weight="light" />
          返回首页
        </Link>

        <h1
          className="mb-6 text-4xl font-semibold tracking-tight md:text-5xl"
          style={{ color: 'var(--color-text-primary)' }}
        >
          关于
        </h1>

        <div
          className="mb-8 h-[1px] w-16 rounded-full"
          style={{ background: `linear-gradient(90deg, var(--color-accent) 0%, transparent 100%)` }}
          aria-hidden="true"
        />

        <div className="space-y-5">
          <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            软件开发领域的小小白，博客主要记录日常以及一些简单的技术问题。
          </p>
        </div>

      </div>
    </section>
  )
}
