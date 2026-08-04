import dotenv from 'dotenv'
import express from 'express'
import cors from 'cors'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import sharp from 'sharp'
import { join, dirname } from 'path'
import { existsSync, mkdirSync, renameSync } from 'fs'
import { fileURLToPath } from 'url'
import postsRouter from './routes/posts.js'
import categoriesRouter from './routes/categories.js'
import linksRouter from './routes/links.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '.env') })

const app = express()
const PORT = process.env.PORT || 3001
const SECRET = process.env.JWT_SECRET || 'blog-secret-key-change-me'
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123'

// File upload
const UPLOADS_DIR = join(__dirname, 'content', 'uploads')
if (!existsSync(UPLOADS_DIR)) mkdirSync(UPLOADS_DIR, { recursive: true })

// Favicon cache — auto-cropped square favicons
const FAVICONS_DIR = join(__dirname, 'content', 'favicons')
if (!existsSync(FAVICONS_DIR)) mkdirSync(FAVICONS_DIR, { recursive: true })
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
app.use('/favicons', express.static(FAVICONS_DIR))

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

// Image upload (auth required) — auto-crop to square & resize to 512px
app.post('/api/upload', auth, upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image file' })
  try {
    const filePath = req.file.path
    const metadata = await sharp(filePath).metadata()
    const size = Math.min(metadata.width, metadata.height)
    // Center-crop to square, then resize to 512×512
    await sharp(filePath)
      .extract({
        left: Math.floor((metadata.width - size) / 2),
        top: Math.floor((metadata.height - size) / 2),
        width: size,
        height: size,
      })
      .resize(512, 512)
      .toFile(filePath + '.tmp')
    // Replace original with processed version
    renameSync(filePath + '.tmp', filePath)
    res.json({ url: `/uploads/${req.file.filename}` })
  } catch (err) {
    console.error('Image processing error:', err)
    // Still return the original if processing fails
    res.json({ url: `/uploads/${req.file.filename}` })
  }
})

// API routes — public read
app.use('/api/posts', postsRouter({ auth }))
app.use('/api/categories', categoriesRouter({ auth }))
app.use('/api/links', linksRouter({ auth }))

// Favicon resolver — finds real favicon, downloads, auto-crops to square, caches locally
app.get('/api/favicon', async (req, res) => {
  const { url } = req.query
  if (!url) return res.status(400).json({ error: 'url required' })
  const targetUrl = url.startsWith('http') ? url : `https://${url}`

  // Cache key: base64url of the target URL (first 24 chars)
  const cacheKey = Buffer.from(targetUrl).toString('base64url').slice(0, 24)
  const cachedFile = join(FAVICONS_DIR, `${cacheKey}.png`)

  // Return cached if already processed
  if (existsSync(cachedFile)) {
    return res.json({ faviconUrl: `/favicons/${cacheKey}.png` })
  }

  try {
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
    allIcons.sort((a, b) => b.size - a.size)
    let faviconUrl = allIcons[0]?.href || new URL(targetUrl).origin + '/favicon.ico'
    if (!faviconUrl.startsWith('http')) {
      faviconUrl = new URL(faviconUrl, targetUrl).href
    }

    // Download the actual favicon image
    const imgRes = await fetch(faviconUrl, {
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; BlogBot/1.0)' },
    })
    if (!imgRes.ok) throw new Error(`Download failed: ${imgRes.status}`)
    const imgBuffer = Buffer.from(await imgRes.arrayBuffer())

    // Try sharp: center-crop to square, resize to 512×512, output as PNG
    try {
      const metadata = await sharp(imgBuffer).metadata()
      const size = Math.min(metadata.width, metadata.height)
      await sharp(imgBuffer)
        .extract({
          left: Math.floor((metadata.width - size) / 2),
          top: Math.floor((metadata.height - size) / 2),
          width: size,
          height: size,
        })
        .resize(512, 512)
        .png()
        .toFile(cachedFile)
      res.json({ faviconUrl: `/favicons/${cacheKey}.png` })
    } catch (sharpErr) {
      // sharp failed (e.g. .ico format) — return original URL, don't cache
      console.warn(`Favicon sharp skipped for ${targetUrl}:`, sharpErr.message)
      res.json({ faviconUrl })
    }
  } catch (err) {
    console.error('Favicon error:', err.message)
    // Fallback: guess /favicon.ico
    try {
      const fallback = new URL(targetUrl).origin + '/favicon.ico'
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
