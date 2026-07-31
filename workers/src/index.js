import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { jwt, sign } from 'hono/jwt'

const app = new Hono()

app.use('/*', cors())

// ── Helpers ──────────────────────────────────────────────

function json(c, data, status = 200) {
  c.status(status)
  return c.json(data)
}

function error(c, msg, status = 500) {
  c.status(status)
  return c.json({ error: msg })
}

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9一-鿿]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
}

// ── Frontmatter (gray-matter lite) ──────────────────────

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match) return { data: {}, content: raw }
  const yaml = match[1]
  const content = match[2]
  const data = {}
  yaml.split('\n').forEach((line) => {
    const m = line.match(/^(\w+):\s*(.+)$/)
    if (!m) return
    let [, key, val] = m
    val = val.trim()
    if (val.startsWith('[') && val.endsWith(']')) {
      data[key] = val.slice(1, -1).split(',').map((s) => s.trim().replace(/^"|"$/g, ''))
    } else if (val === 'true') data[key] = true
    else if (val === 'false') data[key] = false
    else if (/^-?\d+\.?\d*$/.test(val)) data[key] = Number(val)
    else data[key] = val.replace(/^"|"$/g, '')
  })
  return { data, content }
}

function buildFrontmatter(fields) {
  return '---\n' + Object.entries(fields)
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => {
      if (Array.isArray(v)) return `${k}: [${v.map((t) => `"${t}"`).join(', ')}]`
      if (typeof v === 'boolean') return `${k}: ${v}`
      if (typeof v === 'number') return `${k}: ${v}`
      return `${k}: "${v}"`
    })
    .join('\n') + '\n---\n'
}

// ── R2 helpers ───────────────────────────────────────────

async function listPosts(env) {
  const result = await env.BLOG.list({ prefix: 'posts/' })
  return result.objects.filter((o) => o.key.endsWith('.md'))
}

async function readPost(key, env) {
  const obj = await env.BLOG.get(key)
  if (!obj) return null
  const raw = await obj.text()
  const { data, content } = parseFrontmatter(raw)
  const slug = key.replace(/^posts\//, '').replace(/\.md$/, '')
  return { slug, ...data, content }
}

function postMeta(p) {
  return {
    slug: p.slug,
    title: p.title || p.slug,
    date: p.date || null,
    description: p.description || '',
    tags: p.tags || [],
    draft: p.draft || false,
    category: p.category || null,
  }
}

async function readJSON(key, env) {
  const obj = await env.BLOG.get(key)
  if (!obj) return null
  return JSON.parse(await obj.text())
}

async function writeJSON(key, data, env) {
  await env.BLOG.put(key, JSON.stringify(data, null, 2), {
    httpMetadata: { contentType: 'application/json' },
  })
}

// ── Auth middleware ──────────────────────────────────────

const authMiddleware = jwt({
  secret: null, // resolved at runtime
})

// Custom auth that reads secret from env
async function checkAuth(c, next) {
  const header = c.req.header('Authorization')
  if (!header?.startsWith('Bearer ')) {
    return json(c, { error: 'Unauthorized' }, 401)
  }
  try {
    const secret = c.env.JWT_SECRET || 'blog-secret-key-change-me'
    const token = header.slice(7)
    // Manual verify (hono/jwt verify doesn't work great with runtime secret)
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
      'raw', encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']
    )
    // Parse JWT
    const [headerB64, payloadB64, sigB64] = token.split('.')
    const sig = new Uint8Array([...atob(sigB64.replace(/-/g, '+').replace(/_/g, '/'))].map(c => c.charCodeAt(0)))
    const data = encoder.encode(`${headerB64}.${payloadB64}`)
    const valid = await crypto.subtle.verify('HMAC', key, sig, data)
    if (!valid) throw new Error('Invalid signature')
    const payload = JSON.parse(atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/')))
    if (payload.exp && payload.exp < Date.now() / 1000) throw new Error('Token expired')
    await next()
  } catch {
    return json(c, { error: 'Invalid token' }, 401)
  }
}

// ── Routes ───────────────────────────────────────────────

// Login
app.post('/api/admin/login', async (c) => {
  const { password } = await c.req.json()
  if (password !== (c.env.ADMIN_PASSWORD || 'admin123')) {
    return json(c, { error: 'Wrong password' }, 401)
  }
  const secret = c.env.JWT_SECRET || 'blog-secret-key-change-me'
  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '')
  const payload = btoa(JSON.stringify({
    role: 'admin',
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
    iat: Math.floor(Date.now() / 1000),
  })).replace(/=/g, '')
  const data = encoder.encode(`${header}.${payload}`)
  const sig = await crypto.subtle.sign('HMAC', key, data)
  const sigStr = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
  return c.json({ token: `${header}.${payload}.${sigStr}` })
})

// Image upload (auth required)
app.post('/api/upload', checkAuth, async (c) => {
  const formData = await c.req.formData()
  const file = formData.get('image')
  if (!file) return error(c, 'No image file', 400)
  if (file.size > 2 * 1024 * 1024) return error(c, 'File too large', 400)
  const ext = (file.name || 'png').replace(/^.*\./, '')
  const name = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6) + '.' + ext
  await c.env.BLOG.put(`uploads/${name}`, file.stream(), {
    httpMetadata: { contentType: file.type || 'application/octet-stream' },
  })
  return c.json({ url: `/uploads/${name}` })
})

// Health
app.get('/api/health', (c) => c.json({ status: 'ok' }))

// ── Posts ────────────────────────────────────────────────

// List published posts (public, optional ?category= filter)
app.get('/api/posts', async (c) => {
  try {
    const all = await listPosts(c.env)
    const posts = []
    for (const obj of all) {
      const p = await readPost(obj.key, c.env)
      if (p && !p.draft) posts.push(postMeta(p))
    }
    const category = c.req.query('category')
    const filtered = category ? posts.filter((p) => p.category === category) : posts
    filtered.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    return c.json(filtered)
  } catch (err) {
    return error(c, 'Failed to load posts')
  }
})

// List ALL posts including drafts (auth required)
app.get('/api/posts/admin', checkAuth, async (c) => {
  try {
    const all = await listPosts(c.env)
    const posts = []
    for (const obj of all) {
      const p = await readPost(obj.key, c.env)
      if (p) posts.push(postMeta(p))
    }
    const category = c.req.query('category')
    const filtered = category ? posts.filter((p) => p.category === category) : posts
    filtered.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    return c.json(filtered)
  } catch {
    return error(c, 'Failed to load posts')
  }
})

// Get raw post (auth required, for editing)
app.get('/api/posts/raw/:slug', checkAuth, async (c) => {
  const slug = c.req.param('slug').replace(/\.\./g, '').replace(/[\/\\\0]/g, '')
  const p = await readPost(`posts/${slug}.md`, c.env)
  if (!p) return error(c, 'Post not found', 404)
  return c.json({ content: p.content })
})

// Get single post (public)
app.get('/api/posts/:slug', async (c) => {
  const slug = c.req.param('slug').replace(/\.\./g, '').replace(/[\/\\\0]/g, '')
  const p = await readPost(`posts/${slug}.md`, c.env)
  if (!p) return error(c, 'Post not found', 404)
  return c.json({ ...postMeta(p), content: p.content })
})

// Create post (auth required)
app.post('/api/posts', checkAuth, async (c) => {
  try {
    const { title, description, tags, date, content, draft, category } = await c.req.json()
    if (!title || !content) return error(c, 'Title and content are required', 400)
    const slug = slugify(title)
    const fm = buildFrontmatter({
      title,
      date: date || new Date().toISOString().slice(0, 10),
      description: description || '',
      tags: tags || [],
      draft: draft || false,
      category: category || null,
    })
    await c.env.BLOG.put(`posts/${slug}.md`, fm + '\n' + content + '\n')
    return json(c, { slug }, 201)
  } catch {
    return error(c, 'Failed to create post')
  }
})

// Update post (auth required)
app.put('/api/posts/:slug', checkAuth, async (c) => {
  try {
    const slug = c.req.param('slug').replace(/\.\./g, '').replace(/[\/\\\0]/g, '')
    const existing = await readPost(`posts/${slug}.md`, c.env)
    if (!existing) return error(c, 'Post not found', 404)
    const { title, description, tags, date, content, draft, category } = await c.req.json()
    if (!title || !content) return error(c, 'Title and content are required', 400)
    const fm = buildFrontmatter({
      title,
      date: date || new Date().toISOString().slice(0, 10),
      description: description || '',
      tags: tags || [],
      draft: draft || false,
      category: category || null,
    })
    await c.env.BLOG.put(`posts/${slug}.md`, fm + '\n' + content + '\n')
    return c.json({ slug })
  } catch {
    return error(c, 'Failed to update post')
  }
})

// Delete post (auth required)
app.delete('/api/posts/:slug', checkAuth, async (c) => {
  const slug = c.req.param('slug').replace(/\.\./g, '').replace(/[\/\\\0]/g, '')
  await c.env.BLOG.delete(`posts/${slug}.md`)
  return c.json({ deleted: true })
})

// ── Categories ───────────────────────────────────────────

app.get('/api/categories', async (c) => {
  const data = await readJSON('data/categories.json', c.env)
  return c.json(data || [])
})

app.post('/api/categories', checkAuth, async (c) => {
  const { slug, name, description } = await c.req.json()
  if (!slug || !name) return error(c, 'slug and name are required', 400)
  const cats = await readJSON('data/categories.json', c.env) || []
  if (cats.find((c) => c.slug === slug)) return error(c, 'Category slug already exists', 409)
  cats.push({ slug, name, description: description || '' })
  await writeJSON('data/categories.json', cats, c.env)
  return json(c, { slug, name, description }, 201)
})

app.put('/api/categories/:slug', checkAuth, async (c) => {
  const { slug } = c.req.param()
  const { name, description } = await c.req.json()
  const cats = await readJSON('data/categories.json', c.env) || []
  const idx = cats.findIndex((c) => c.slug === slug)
  if (idx === -1) return error(c, 'Category not found', 404)
  if (name !== undefined) cats[idx].name = name
  if (description !== undefined) cats[idx].description = description
  await writeJSON('data/categories.json', cats, c.env)
  return c.json(cats[idx])
})

app.delete('/api/categories/:slug', checkAuth, async (c) => {
  const { slug } = c.req.param()
  const cats = await readJSON('data/categories.json', c.env) || []
  const idx = cats.findIndex((c) => c.slug === slug)
  if (idx === -1) return error(c, 'Category not found', 404)
  cats.splice(idx, 1)
  await writeJSON('data/categories.json', cats, c.env)
  return c.json({ deleted: true })
})

// ── Links ────────────────────────────────────────────────

app.get('/api/links', async (c) => {
  const data = await readJSON('data/links.json', c.env)
  return c.json(data || [])
})

app.post('/api/links', checkAuth, async (c) => {
  const { name, url, description, image } = await c.req.json()
  if (!url) return error(c, 'url is required', 400)
  const links = await readJSON('data/links.json', c.env) || []
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  const newLink = { id, name: name || '', url, description: description || '', image: image || '' }
  links.push(newLink)
  await writeJSON('data/links.json', links, c.env)
  return json(c, newLink, 201)
})

app.put('/api/links/:id', checkAuth, async (c) => {
  const { id } = c.req.param()
  const { name, url, description, image } = await c.req.json()
  const links = await readJSON('data/links.json', c.env) || []
  const idx = links.findIndex((l) => l.id === id)
  if (idx === -1) return error(c, 'Link not found', 404)
  if (name !== undefined) links[idx].name = name
  if (url !== undefined) links[idx].url = url
  if (description !== undefined) links[idx].description = description
  if (image !== undefined) links[idx].image = image
  await writeJSON('data/links.json', links, c.env)
  return c.json(links[idx])
})

app.delete('/api/links/:id', checkAuth, async (c) => {
  const { id } = c.req.param()
  const links = await readJSON('data/links.json', c.env) || []
  const idx = links.findIndex((l) => l.id === id)
  if (idx === -1) return error(c, 'Link not found', 404)
  links.splice(idx, 1)
  await writeJSON('data/links.json', links, c.env)
  return c.json({ deleted: true })
})

// ── Favicon resolver ─────────────────────────────────────

app.get('/api/favicon', async (c) => {
  const url = c.req.query('url')
  if (!url) return error(c, 'url required', 400)
  try {
    const targetUrl = url.startsWith('http') ? url : `https://${url}`
    const htmlRes = await fetch(targetUrl, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BlogBot/1.0)' },
    })
    const html = await htmlRes.text()
    const iconPattern = /<link[^>]*\b(?:rel=["'](?:shortcut\s+)?icon["']|(?:shortcut\s+)?icon["'][^>]*\brel=["']icon["'])[^>]*\bhref=["']([^"']+)["'][^>]*>/gi
    const allIcons = [...html.matchAll(iconPattern)].map((m) => {
      const tag = m[0]
      const href = m[1]
      const sizeMatch = tag.match(/sizes=["'](\d+)x(\d+)/i)
      const size = sizeMatch ? Math.max(parseInt(sizeMatch[1]), parseInt(sizeMatch[2])) : 0
      return { href, size }
    })
    allIcons.sort((a, b) => b.size - a.size)
    let faviconUrl = allIcons[0]?.href || new URL(targetUrl).origin + '/favicon.ico'
    if (!faviconUrl.startsWith('http')) {
      faviconUrl = new URL(faviconUrl, targetUrl).href
    }
    return c.json({ faviconUrl })
  } catch {
    try {
      const fallback = new URL(url.startsWith('http') ? url : `https://${url}`).origin + '/favicon.ico'
      return c.json({ faviconUrl: fallback })
    } catch {
      return error(c, 'Failed to resolve favicon')
    }
  }
})

// ── Serve uploaded files from R2 ─────────────────────────

app.get('/uploads/*', async (c) => {
  const key = 'uploads/' + c.req.param('*')
  const obj = await c.env.BLOG.get(key)
  if (!obj) return error(c, 'Not found', 404)
  const headers = { 'Content-Type': obj.httpMetadata?.contentType || 'application/octet-stream' }
  headers['Cache-Control'] = 'public, max-age=31536000'
  return new Response(obj.body, { headers })
})

export default app
