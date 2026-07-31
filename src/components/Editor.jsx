import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { ArrowLeft, Eye, Pencil } from '@phosphor-icons/react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { authedFetch, fetchCategories } from '../lib/api'

export default function Editor() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { token } = useAuth()
  const isNew = !slug

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [tags, setTags] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [content, setContent] = useState('')
  const [draft, setDraft] = useState(false)
  const [category, setCategory] = useState('')
  const [categories, setCategories] = useState([])
  const [preview, setPreview] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(!isNew)

  // Load existing post for editing
  useEffect(() => {
    if (isNew || !token) return
    let cancelled = false

    async function load() {
      try {
        // Fetch metadata
        const meta = await fetch(`/api/posts/${encodeURIComponent(slug)}`).then((r) => r.json())
        if (cancelled) return
        setTitle(meta.title || '')
        setDescription(meta.description || '')
        setTags((meta.tags || []).join(', '))
        setDate(meta.date?.slice(0, 10) || '')
        setDraft(meta.draft || false)
        setCategory(meta.category || '')

        // Fetch raw markdown for editing
        const raw = await authedFetch(`/posts/raw/${encodeURIComponent(slug)}`, token)
        if (cancelled) return
        setContent(raw.content || '')
      } catch {
        if (!cancelled) setError('加载文章失败')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [slug, isNew, token])

  // Fetch categories for the dropdown
  useEffect(() => {
    if (!token) return
    fetchCategories()
      .then(setCategories)
      .catch(() => {})
  }, [token])

  async function handleSave(publishAfter = false) {
    setError('')
    setSaving(true)
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        date,
        content,
        draft: publishAfter ? false : draft,
        category: category || null,
      }

      if (!payload.title || !payload.content) {
        setError('标题和正文不能为空')
        setSaving(false)
        return
      }

      if (isNew) {
        await authedFetch('/posts', token, {
          method: 'POST',
          body: JSON.stringify(payload),
        })
      } else {
        await authedFetch(`/posts/${encodeURIComponent(slug)}`, token, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
      }

      navigate('/admin')
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  if (!token) {
    return (
      <section className="flex min-h-[60vh] items-center justify-center px-6">
        <p style={{ color: 'var(--color-text-tertiary)' }}>请先登录</p>
      </section>
    )
  }

  if (loading) {
    return (
      <section className="px-6 py-24">
        <div className="mx-auto max-w-3xl">
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>加载中...</p>
        </div>
      </section>
    )
  }

  const inputStyle = {
    background: 'var(--color-surface)',
    borderColor: 'var(--color-border-strong)',
    color: 'var(--color-text-primary)',
  }

  return (
    <section className="px-6 py-8 md:py-16">
      <div className="mx-auto max-w-3xl">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <button
            onClick={() => navigate('/admin')}
            className="inline-flex items-center gap-1.5 text-sm transition-colors hover:opacity-70"
            style={{ color: 'var(--color-text-tertiary)' }}
          >
            <ArrowLeft size={14} weight="light" />
            返回
          </button>

          <button
            onClick={() => setPreview(!preview)}
            className="inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm transition-colors"
            style={{ borderColor: 'var(--color-border-strong)', color: 'var(--color-text-secondary)' }}
          >
            {preview ? <Pencil size={14} weight="light" /> : <Eye size={14} weight="light" />}
            {preview ? '编辑' : '预览'}
          </button>
        </div>

        {/* Metadata fields (hidden in preview) */}
        {!preview && (
          <div className="mb-6 space-y-4">
            <input
              type="text" value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="文章标题"
              className="w-full rounded-xl border px-4 py-3 text-lg font-semibold outline-none transition-colors focus:border-[var(--color-accent)]"
              style={inputStyle}
            />

            <div className="flex gap-4 flex-wrap">
              <input
                type="text" value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="简短描述"
                className="flex-1 min-w-[200px] rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-accent)]"
                style={inputStyle}
              />
              <input
                type="text" value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="标签, 逗号分隔"
                className="flex-1 min-w-[200px] rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-accent)]"
                style={inputStyle}
              />
            </div>

            <div className="flex items-center gap-4 flex-wrap">
              <input
                type="date" value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-accent)]"
                style={inputStyle}
              />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-accent)]"
                style={inputStyle}
              >
                <option value="">无分类</option>
                {categories.map((cat) => (
                  <option key={cat.slug} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
              <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--color-text-secondary)' }}>
                <input type="checkbox" checked={draft} onChange={(e) => setDraft(e.target.checked)} className="rounded" />
                草稿
              </label>
            </div>
          </div>
        )}

        {/* Content area */}
        {preview ? (
          <div
            className="rounded-2xl border p-6 min-h-[300px]"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
          >
            {content ? (
              <article className="prose-custom">
                <h1 style={{ color: 'var(--color-text-primary)' }}>{title}</h1>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
              </article>
            ) : (
              <p style={{ color: 'var(--color-text-tertiary)' }}>暂无内容</p>
            )}
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="## 开始写 Markdown..."
            className="w-full min-h-[400px] rounded-xl border p-5 text-sm leading-relaxed outline-none resize-y transition-colors focus:border-[var(--color-accent)]"
            style={{ ...inputStyle, fontFamily: 'var(--font-mono)' }}
          />
        )}

        {error && <p className="mt-4 text-sm" style={{ color: '#f87171' }}>{error}</p>}

        {/* Actions */}
        {!preview && (
          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={() => handleSave(false)} disabled={saving}
              className="rounded-full px-5 py-2.5 text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-40"
              style={{ background: 'var(--color-accent)', color: '#09090b' }}
            >
              {saving ? '保存中...' : draft ? '保存草稿' : '保存'}
            </button>
            {draft && (
              <button
                onClick={() => handleSave(true)} disabled={saving}
                className="rounded-full border px-5 py-2.5 text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-40"
                style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}
              >
                保存并发布
              </button>
            )}
            <button
              onClick={() => navigate('/admin')}
              className="rounded-full px-4 py-2.5 text-sm transition-colors hover:opacity-70"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              取消
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
