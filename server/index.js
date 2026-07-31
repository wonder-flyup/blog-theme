import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import { join, dirname } from 'path'
import { existsSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import postsRouter from './routes/posts.js'
import categoriesRouter from './routes/categories.js'
import linksRouter from './routes/links.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

const app = express()
const PORT = process.env.PORT || 3001
const SECRET = process.env.JWT_SECRET || 'blog-secret-key-change-me'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

// File upload
const UPLOADS_DIR = join(__dirname, 'content', 'uploads')
if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true })
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const ext = file.originalname.replace(/^.*\./, '')
    const name = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 6)
    cb(null, `${name}.${ext}`)
  },
})
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 } })

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(UPLOADS_DIR))

// Serve frontend static files in production
const FRONTEND_DIST = join(__dirname, '..', 'dist')
if (existsSync(FRONTEND_DIST)) {
  app.use(express.static(FRONTEND_DIST))
}

// Auth middleware
function auth(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  try {
    jwt.verify(header.slice(7), SECRET)
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}

// Admin login
app.post('/api/admin/login', (req, res) => {
  const { password } = req.body
  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Wrong password' })
  }
  const token = jwt.sign({ role: 'admin' }, SECRET, { expiresIn: '7d' })
  res.json({ token })
})

// Image upload (auth required)
app.post('/api/upload', auth, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image file' })
  res.json({ url: `/uploads/${req.file.filename}` })
})

// API routes — public read
app.use('/api/posts', postsRouter({ auth }))
app.use('/api/categories', categoriesRouter({ auth }))
app.use('/api/links', linksRouter({ auth }))

// Favicon resolver — finds real favicon URL from site HTML
app.get('/api/favicon', async (req, res) => {
  const { url } = req.query
  if (!url) return res.status(400).json({ error: 'url required' })
  try {
    const targetUrl = url.startsWith('http') ? url : `https://${url}`
    const htmlRes = await fetch(targetUrl, {
      signal: AbortSignal.timeout(8000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BlogBot/1.0)' },
    })
    const html = await htmlRes.text()
    // Find ALL favicon links, prefer largest size
    const iconPattern = /<link[^>]*\b(?:rel=["'](?:shortcut\s+)?icon["']|(?:shortcut\s+)?icon["'][^>]*\brel=["']icon["'])[^>]*\bhref=["']([^"']+)["'][^>]*>/gi
    const allIcons = [...html.matchAll(iconPattern)].map((m) => {
      const tag = m[0]
      const href = m[1]
      const sizeMatch = tag.match(/sizes=["'](\d+)x(\d+)/i)
      const size = sizeMatch ? Math.max(parseInt(sizeMatch[1]), parseInt(sizeMatch[2])) : 0
      return { href, size }
    })
    // Sort by size descending, pick largest
    allIcons.sort((a, b) => b.size - a.size)
    let faviconUrl = allIcons[0]?.href || new URL(targetUrl).origin + '/favicon.ico'
    // Resolve relative URLs
    if (!faviconUrl.startsWith('http')) {
      faviconUrl = new URL(faviconUrl, targetUrl).href
    }
    res.json({ faviconUrl })
  } catch (err) {
    // Fallback: guess /favicon.ico
    try {
      const fallback = new URL(url.startsWith('http') ? url : `https://${url}`).origin + '/favicon.ico'
      res.json({ faviconUrl: fallback })
    } catch {
      res.status(500).json({ error: 'Failed to resolve favicon' })
    }
  }
})

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// SPA fallback — all non-API routes → index.html
app.use((req, res) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return
  const htmlPath = join(FRONTEND_DIST, 'index.html')
  if (existsSync(htmlPath)) {
    res.sendFile(htmlPath)
  } else {
    res.status(404).send('Frontend not built. Run: npm run build')
  }
})

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`)
})
