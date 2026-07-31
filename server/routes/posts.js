import { Router } from 'express'
import { readFileSync, readdirSync, existsSync, writeFileSync, unlinkSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import matter from 'gray-matter'


const __dirname = dirname(fileURLToPath(import.meta.url))
const CONTENT_DIR = join(__dirname, '..', 'content', 'posts')

// Serialize frontmatter values to valid YAML (no spurious quoting)
function yamlify(obj) {
  return Object.entries(obj)
    .filter(([, v]) => v != null)
    .map(([k, v]) => {
      if (Array.isArray(v)) return `${k}: [${v.map((t) => `"${t}"`).join(', ')}]`
      if (typeof v === 'boolean') return `${k}: ${v}`
      if (typeof v === 'number') return `${k}: ${v}`
      return `${k}: "${v}"`
    })
    .join('\n')
}

export default function postsRouter({ auth }) {
  const router = Router()

  // GET /api/posts - list all published posts (public)
  router.get('/', (req, res) => {
    try {
      if (!existsSync(CONTENT_DIR)) return res.json([])

      const files = readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.md'))
      let posts = files
        .map((file) => {
          const raw = readFileSync(join(CONTENT_DIR, file), 'utf-8')
          const { data } = matter(raw)
          const slug = file.replace(/\.md$/, '')
          return {
            slug,
            title: data.title || slug,
            date: data.date || null,
            description: data.description || '',
            tags: data.tags || [],
            draft: data.draft || false,
            category: data.category || null,
          }
        })
        .filter((p) => !p.draft)

      // Optional category filter
      if (req.query.category) {
        posts = posts.filter((p) => p.category === req.query.category)
      }

      posts.sort((a, b) => {
        if (!a.date) return 1
        if (!b.date) return -1
        return new Date(b.date) - new Date(a.date)
      })

      res.json(posts)
    } catch (err) {
      console.error('Error reading posts:', err)
      res.status(500).json({ error: 'Failed to load posts' })
    }
  })

  // GET /api/posts/admin — list ALL posts including drafts (auth required)
  router.get('/admin', auth, (req, res) => {
    try {
      if (!existsSync(CONTENT_DIR)) return res.json([])

      const files = readdirSync(CONTENT_DIR).filter((f) => f.endsWith('.md'))
      let posts = files
        .map((file) => {
          const raw = readFileSync(join(CONTENT_DIR, file), 'utf-8')
          const { data } = matter(raw)
          const slug = file.replace(/\.md$/, '')
          return {
            slug,
            title: data.title || slug,
            date: data.date || null,
            description: data.description || '',
            tags: data.tags || [],
            draft: data.draft || false,
            category: data.category || null,
          }
        })

      // Optional category filter
      if (req.query.category) {
        posts = posts.filter((p) => p.category === req.query.category)
      }

      posts.sort((a, b) => {
        if (!a.date) return 1
        if (!b.date) return -1
        return new Date(b.date) - new Date(a.date)
      })

      res.json(posts)
    } catch (err) {
      console.error('Error reading posts:', err)
      res.status(500).json({ error: 'Failed to load posts' })
    }
  })

  // GET /api/posts/raw/:slug — raw markdown content (auth required, for editing)
  router.get('/raw/:slug', auth, (req, res) => {
    try {
      const { slug } = req.params
      const safeSlug = slug.replace(/\.\./g, '').replace(/[\/\\\0]/g, '')
      const filePath = join(CONTENT_DIR, `${safeSlug}.md`)

      if (!existsSync(filePath)) {
        return res.status(404).json({ error: 'Post not found' })
      }

      const raw = readFileSync(filePath, 'utf-8')
      const { content } = matter(raw)
      res.json({ content })
    } catch (err) {
      console.error('Error reading raw post:', err)
      res.status(500).json({ error: 'Failed to load post' })
    }
  })

  // GET /api/posts/:slug — single post (public, or draft if admin)
  router.get('/:slug', (req, res) => {
    try {
      const { slug } = req.params
      const safeSlug = slug.replace(/\.\./g, '').replace(/[\/\\\0]/g, '')
      const filePath = join(CONTENT_DIR, `${safeSlug}.md`)

      if (!existsSync(filePath)) {
        return res.status(404).json({ error: 'Post not found' })
      }

      const raw = readFileSync(filePath, 'utf-8')
      const { data, content } = matter(raw)

      res.json({
        slug: safeSlug,
        title: data.title || safeSlug,
        date: data.date || null,
        description: data.description || '',
        tags: data.tags || [],
        draft: data.draft || false,
        category: data.category || null,
        content,
      })
    } catch (err) {
      console.error('Error reading post:', err)
      res.status(500).json({ error: 'Failed to load post' })
    }
  })

  // POST /api/posts — create new post (auth required)
  router.post('/', auth, (req, res) => {
    try {
      const { title, description, tags, date, content, draft, category } = req.body

      if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' })
      }

      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9一-鿿]+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 80)

      const frontmatter = {
        title,
        date: date || new Date().toISOString().slice(0, 10),
        description: description || '',
        tags: tags || [],
        draft: draft || false,
        category: category || null,
      }

      const fmYaml = yamlify(frontmatter)
      const md = `---\n${fmYaml}\n---\n\n${content}\n`

      if (!existsSync(CONTENT_DIR)) {
        mkdirSync(CONTENT_DIR, { recursive: true })
      }

      writeFileSync(join(CONTENT_DIR, `${slug}.md`), md, 'utf-8')
      res.status(201).json({ slug })
    } catch (err) {
      console.error('Error creating post:', err)
      res.status(500).json({ error: 'Failed to create post' })
    }
  })

  // PUT /api/posts/:slug — update post (auth required)
  router.put('/:slug', auth, (req, res) => {
    try {
      const { slug } = req.params
      const safeSlug = slug.replace(/\.\./g, '').replace(/[\/\\\0]/g, '')
      const filePath = join(CONTENT_DIR, `${safeSlug}.md`)

      if (!existsSync(filePath)) {
        return res.status(404).json({ error: 'Post not found' })
      }

      const { title, description, tags, date, content, draft, category } = req.body

      if (!title || !content) {
        return res.status(400).json({ error: 'Title and content are required' })
      }

      const frontmatter = {
        title,
        date: date || new Date().toISOString().slice(0, 10),
        description: description || '',
        tags: tags || [],
        draft: draft || false,
        category: category || null,
      }

      const fmYaml = yamlify(frontmatter)
      const md = `---\n${fmYaml}\n---\n\n${content}\n`
      writeFileSync(filePath, md, 'utf-8')
      res.json({ slug: safeSlug })
    } catch (err) {
      console.error('Error updating post:', err)
      res.status(500).json({ error: 'Failed to update post' })
    }
  })

  // DELETE /api/posts/:slug — delete post (auth required)
  router.delete('/:slug', auth, (req, res) => {
    try {
      const { slug } = req.params
      const safeSlug = slug.replace(/\.\./g, '').replace(/[\/\\\0]/g, '')
      const filePath = join(CONTENT_DIR, `${safeSlug}.md`)

      if (!existsSync(filePath)) {
        return res.status(404).json({ error: 'Post not found' })
      }

      unlinkSync(filePath)
      res.json({ deleted: true })
    } catch (err) {
      console.error('Error deleting post:', err)
      res.status(500).json({ error: 'Failed to delete post' })
    }
  })

  return router
}
