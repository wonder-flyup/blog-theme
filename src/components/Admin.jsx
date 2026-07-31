import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { Pencil, Trash, Plus, SignOut, Eye, EyeSlash, Folder, Check } from '@phosphor-icons/react'
import { authedFetch, fetchCategories, createCategory, updateCategory, deleteCategory, fetchLinks, createLink, updateLink, deleteLink } from '../lib/api'

export default function Admin() {
  const { token, login, logout } = useAuth()
  const navigate = useNavigate()

  // Logged out — show login form
  if (!token) {
    return <LoginForm onLogin={login} />
  }

  // Logged in — show post management
  return (
    <section className="px-6 py-16 md:py-24">
      <div className="mx-auto max-w-3xl">
        <AdminToolbar onLogout={logout} />
        <PostTable token={token} navigate={navigate} />
        <div className="mt-16">
          <CategoryManager token={token} />
        </div>
        <div className="mt-16">
          <LinkManager token={token} />
        </div>
      </div>
    </section>
  )
}

function LoginForm({ onLogin }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onLogin(password)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1
          className="mb-2 text-2xl font-semibold tracking-tight"
          style={{ color: 'var(--color-text-primary)' }}
        >
          管理员登录
        </h1>
        <p className="mb-8 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          输入密码以管理文章
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="密码"
              className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--color-accent)]"
              style={{
                background: 'var(--color-surface)',
                borderColor: 'var(--color-border-strong)',
                color: 'var(--color-text-primary)',
              }}
              autoFocus
            />
          </div>

          {error && (
            <p className="text-sm" style={{ color: '#f87171' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full rounded-full px-5 py-3 text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-40"
            style={{ background: 'var(--color-accent)', color: '#09090b' }}
          >
            {loading ? '验证中...' : '登录'}
          </button>
        </form>
      </div>
    </section>
  )
}

function AdminToolbar({ onLogout }) {
  return (
    <div className="mb-8 flex items-center justify-between">
      <h2
        className="text-xs font-medium tracking-[0.15em] uppercase"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        文章管理
      </h2>
      <div className="flex items-center gap-3">
        <Link
          to="/admin/new"
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all active:scale-[0.98]"
          style={{ background: 'var(--color-accent)', color: '#09090b' }}
        >
          <Plus size={14} weight="bold" />
          新建
        </Link>
        <button
          onClick={onLogout}
          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm transition-colors hover:opacity-70"
          style={{ borderColor: 'var(--color-border-strong)', color: 'var(--color-text-tertiary)' }}
        >
          <SignOut size={14} weight="light" />
        </button>
      </div>
    </div>
  )
}

function PostTable({ token, navigate }) {
  const [posts, setPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await authedFetch('/posts/admin', token)
      setPosts(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => { load() }, [load])

  async function handleDelete(slug) {
    if (!confirm(`确认删除 "${slug}" ？此操作不可撤销。`)) return
    try {
      await authedFetch(`/posts/${encodeURIComponent(slug)}`, token, { method: 'DELETE' })
      setPosts((prev) => prev.filter((p) => p.slug !== slug))
    } catch (err) {
      alert('删除失败：' + err.message)
    }
  }

  if (loading) {
    return <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>加载中...</p>
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="mb-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>加载失败：{error}</p>
        <button onClick={load} className="text-sm font-medium" style={{ color: 'var(--color-accent)' }}>重试</button>
      </div>
    )
  }

  if (posts.length === 0) {
    return (
      <div
        className="rounded-2xl border p-12 text-center"
        style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
      >
        <p className="mb-3 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>暂无文章</p>
        <Link
          to="/admin/new"
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium"
          style={{ background: 'var(--color-accent)', color: '#09090b' }}
        >
          <Plus size={14} />
          写第一篇
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {posts.map((post) => {
        const isDraft = post.draft
        return (
          <div
            key={post.slug}
            className="flex items-center justify-between rounded-xl border p-4 transition-colors"
            style={{
              borderColor: 'var(--color-border)',
              background: isDraft ? 'var(--color-accent-glow)' : 'var(--color-surface)',
            }}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3
                  className="truncate text-sm font-medium"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {post.title}
                </h3>
                {isDraft && (
                  <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium" style={{ color: 'var(--color-accent)', background: 'var(--color-accent-glow)' }}>
                    <EyeSlash size={10} weight="bold" />
                    草稿
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-xs truncate" style={{ color: 'var(--color-text-tertiary)' }}>
                {post.date?.slice(0, 10)} · {post.tags?.join(', ')}
              </p>
            </div>

            <div className="ml-4 flex items-center gap-1 shrink-0">
              <Link
                to={`/post/${encodeURIComponent(post.slug)}`}
                className="rounded-lg p-2 transition-colors hover:opacity-70"
                style={{ color: 'var(--color-text-tertiary)' }}
                title="预览"
              >
                <Eye size={15} weight="light" />
              </Link>
              <button
                onClick={() => navigate(`/admin/edit/${encodeURIComponent(post.slug)}`)}
                className="rounded-lg p-2 transition-colors hover:opacity-70"
                style={{ color: 'var(--color-accent)' }}
                title="编辑"
              >
                <Pencil size={15} weight="light" />
              </button>
              <button
                onClick={() => handleDelete(post.slug)}
                className="rounded-lg p-2 transition-colors hover:opacity-70"
                style={{ color: '#f87171' }}
                title="删除"
              >
                <Trash size={15} weight="light" />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function CategoryManager({ token }) {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [newSlug, setNewSlug] = useState('')
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [editing, setEditing] = useState(null) // { slug, name, description }
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const data = await fetchCategories()
      setCategories(data)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  function slugify(name) {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9一-鿿]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 40)
  }

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    const slug = newSlug || slugify(newName)
    if (!slug || !newName.trim()) {
      setError('分类名不能为空')
      return
    }
    try {
      await createCategory({ slug, name: newName.trim(), description: newDesc.trim() }, token)
      setNewSlug('')
      setNewName('')
      setNewDesc('')
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleUpdate(slug) {
    setError('')
    try {
      await updateCategory(slug, { name: editing.name, description: editing.description }, token)
      setEditing(null)
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(slug) {
    if (!confirm(`确认删除分类 "${slug}" ？`)) return
    setError('')
    try {
      await deleteCategory(slug, token)
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  const inputStyle = {
    background: 'var(--color-surface)',
    borderColor: 'var(--color-border-strong)',
    color: 'var(--color-text-primary)',
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2
          className="text-xs font-medium tracking-[0.15em] uppercase"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          分类管理
        </h2>
      </div>

      {/* Category list */}
      <div className="mb-6 space-y-2">
        {loading && (
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>加载中...</p>
        )}
        {!loading && categories.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>暂无分类</p>
        )}
        {categories.map((cat) => (
          <div
            key={cat.slug}
            className="flex items-center justify-between rounded-xl border p-3"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
          >
            {editing?.slug === cat.slug ? (
              <div className="flex flex-1 items-center gap-3">
                <input
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  className="flex-1 rounded-lg border px-3 py-1.5 text-sm outline-none"
                  style={inputStyle}
                  placeholder="名称"
                />
                <input
                  value={editing.description}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="flex-1 rounded-lg border px-3 py-1.5 text-sm outline-none"
                  style={inputStyle}
                  placeholder="描述"
                />
                <button
                  onClick={() => handleUpdate(cat.slug)}
                  className="rounded-lg p-1.5 transition-colors hover:opacity-70"
                  style={{ color: 'var(--color-accent)' }}
                  title="保存"
                >
                  <Check size={16} weight="bold" />
                </button>
                <button
                  onClick={() => setEditing(null)}
                  className="rounded-lg p-1.5 text-sm transition-colors hover:opacity-70"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  取消
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <Folder size={16} weight="light" style={{ color: 'var(--color-accent)' }} />
                  <div>
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {cat.name}
                    </span>
                    <span className="ml-2 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      /{cat.slug}
                    </span>
                    {cat.description && (
                      <span className="ml-2 text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                        — {cat.description}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setEditing({ slug: cat.slug, name: cat.name, description: cat.description || '' })}
                    className="rounded-lg p-2 transition-colors hover:opacity-70"
                    style={{ color: 'var(--color-accent)' }}
                    title="编辑"
                  >
                    <Pencil size={14} weight="light" />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.slug)}
                    className="rounded-lg p-2 transition-colors hover:opacity-70"
                    style={{ color: '#f87171' }}
                    title="删除"
                  >
                    <Trash size={14} weight="light" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Add new category form */}
      <form onSubmit={handleCreate} className="space-y-3">
        <div className="flex gap-3 flex-wrap">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="分类名称 *"
            className="flex-1 min-w-[140px] rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-accent)]"
            style={inputStyle}
          />
          <input
            value={newSlug}
            onChange={(e) => setNewSlug(e.target.value)}
            placeholder="slug (可选，自动生成)"
            className="flex-1 min-w-[140px] rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-accent)]"
            style={inputStyle}
          />
          <input
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="描述 (可选)"
            className="flex-1 min-w-[160px] rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-accent)]"
            style={inputStyle}
          />
          <button
            type="submit"
            className="rounded-full px-5 py-2.5 text-sm font-medium transition-all active:scale-[0.98]"
            style={{ background: 'var(--color-accent)', color: '#09090b' }}
          >
            添加
          </button>
        </div>
        {error && <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>}
      </form>
    </div>
  )
}

function LinkManager({ token }) {
  const [links, setLinks] = useState([])
  const [loading, setLoading] = useState(true)
  const [newUrl, setNewUrl] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [newImage, setNewImage] = useState(null) // File object
  const [uploading, setUploading] = useState(false)
  const [editing, setEditing] = useState(null) // { id, url, description }
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    try {
      const data = await fetchLinks()
      setLinks(data)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  function getDomain(url) {
    try { return new URL(url).hostname } catch { return url }
  }
  function faviconUrl(url) {
    try { return new URL(url).origin + '/favicon.ico' } catch { return '' }
  }

  async function handleCreate(e) {
    e.preventDefault()
    setError('')
    if (!newUrl.trim()) {
      setError('链接地址不能为空')
      return
    }
    try {
      let imageUrl = ''
      if (newImage) {
        setUploading(true)
        const formData = new FormData()
        formData.append('image', newImage)
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        })
        if (!res.ok) throw new Error('Image upload failed')
        const data = await res.json()
        imageUrl = data.url
        setUploading(false)
      }
      await createLink({ url: newUrl.trim(), name: getDomain(newUrl.trim()), description: newDesc.trim(), image: imageUrl || undefined }, token)
      setNewUrl('')
      setNewDesc('')
      setNewImage(null)
      await load()
    } catch (err) {
      setError(err.message)
      setUploading(false)
    }
  }

  async function handleUpdate(id) {
    setError('')
    try {
      await updateLink(id, { url: editing.url, name: getDomain(editing.url), description: editing.description }, token)
      setEditing(null)
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleDelete(id) {
    if (!confirm('确认删除此友链？')) return
    setError('')
    try {
      await deleteLink(id, token)
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  const inputStyle = {
    background: 'var(--color-surface)',
    borderColor: 'var(--color-border-strong)',
    color: 'var(--color-text-primary)',
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2
          className="text-xs font-medium tracking-[0.15em] uppercase"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          友链管理
        </h2>
      </div>

      {/* Link list */}
      <div className="mb-6 space-y-2">
        {loading && (
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>加载中...</p>
        )}
        {!loading && links.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>暂无友链</p>
        )}
        {links.map((link) => (
          <div
            key={link.id}
            className="flex items-center justify-between rounded-xl border p-3"
            style={{ borderColor: 'var(--color-border)', background: 'var(--color-surface)' }}
          >
            {editing?.id === link.id ? (
              <div className="flex flex-1 items-center gap-3 flex-wrap">
                <input
                  value={editing.url}
                  onChange={(e) => setEditing({ ...editing, url: e.target.value })}
                  className="flex-1 min-w-[140px] rounded-lg border px-3 py-1.5 text-sm outline-none"
                  style={inputStyle}
                  placeholder="链接地址"
                />
                <input
                  value={editing.description || ''}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="flex-1 min-w-[120px] rounded-lg border px-3 py-1.5 text-sm outline-none"
                  style={inputStyle}
                  placeholder="描述"
                />
                <button
                  onClick={() => handleUpdate(link.id)}
                  className="rounded-lg p-1.5 transition-colors hover:opacity-70"
                  style={{ color: 'var(--color-accent)' }}
                  title="保存"
                >
                  <Check size={16} weight="bold" />
                </button>
                <button
                  onClick={() => setEditing(null)}
                  className="rounded-lg p-1.5 text-sm transition-colors hover:opacity-70"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  取消
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={link.image || faviconUrl(link.url)}
                    alt=""
                    className="h-5 w-5 rounded flex-shrink-0 object-contain"
                    onError={(e) => { e.target.style.display = 'none' }}
                  />
                  <div className="min-w-0">
                    <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                      {link.name || getDomain(link.url)}
                    </span>
                    {(link.description || link.url) && (
                      <span className="ml-2 text-xs truncate" style={{ color: 'var(--color-text-tertiary)' }}>
                        {link.description || link.url}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button
                    onClick={() => setEditing({ id: link.id, url: link.url, description: link.description || '' })}
                    className="rounded-lg p-2 transition-colors hover:opacity-70"
                    style={{ color: 'var(--color-accent)' }}
                    title="编辑"
                  >
                    <Pencil size={14} weight="light" />
                  </button>
                  <button
                    onClick={() => handleDelete(link.id)}
                    className="rounded-lg p-2 transition-colors hover:opacity-70"
                    style={{ color: '#f87171' }}
                    title="删除"
                  >
                    <Trash size={14} weight="light" />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>

      {/* Add new link form */}
      <form onSubmit={handleCreate} className="space-y-3">
        <div className="flex gap-3 flex-wrap">
          <input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="链接地址 (如 https://example.com)"
            className="flex-1 min-w-[200px] rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-accent)]"
            style={inputStyle}
          />
          <input
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            placeholder="描述 (可选)"
            className="flex-1 min-w-[140px] rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors focus:border-[var(--color-accent)]"
            style={inputStyle}
          />
          <label
            className="cursor-pointer rounded-xl border px-4 py-2.5 text-sm transition-colors hover:opacity-70"
            style={{ ...inputStyle, display: 'inline-block' }}
          >
            {newImage ? newImage.name : '选择图片 (可选)'}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setNewImage(e.target.files[0] || null)}
              className="hidden"
            />
          </label>
          <button
            type="submit"
            disabled={uploading}
            className="rounded-full px-5 py-2.5 text-sm font-medium transition-all active:scale-[0.98] disabled:opacity-50"
            style={{ background: 'var(--color-accent)', color: '#09090b' }}
          >
            {uploading ? '上传中...' : '添加'}
          </button>
        </div>
        {error && <p className="text-sm" style={{ color: '#f87171' }}>{error}</p>}
      </form>
    </div>
  )
}
