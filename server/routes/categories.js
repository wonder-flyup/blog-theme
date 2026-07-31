import { Router } from 'express'
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CATEGORIES_FILE = join(__dirname, '..', 'content', 'categories.json')

function readCategories() {
  if (!existsSync(CATEGORIES_FILE)) return []
  return JSON.parse(readFileSync(CATEGORIES_FILE, 'utf-8'))
}

function writeCategories(cats) {
  const dir = dirname(CATEGORIES_FILE)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(CATEGORIES_FILE, JSON.stringify(cats, null, 2), 'utf-8')
}

export default function categoriesRouter({ auth }) {
  const router = Router()

  // GET /api/categories — public
  router.get('/', (_req, res) => {
    try {
      res.json(readCategories())
    } catch (err) {
      console.error('Error reading categories:', err)
      res.status(500).json({ error: 'Failed to load categories' })
    }
  })

  // POST /api/categories — create (auth required)
  router.post('/', auth, (req, res) => {
    try {
      const { slug, name, description } = req.body
      if (!slug || !name) {
        return res.status(400).json({ error: 'slug and name are required' })
      }
      const cats = readCategories()
      if (cats.find((c) => c.slug === slug)) {
        return res.status(409).json({ error: 'Category slug already exists' })
      }
      const newCat = { slug, name, description: description || '' }
      cats.push(newCat)
      writeCategories(cats)
      res.status(201).json(newCat)
    } catch (err) {
      console.error('Error creating category:', err)
      res.status(500).json({ error: 'Failed to create category' })
    }
  })

  // PUT /api/categories/:slug — update (auth required)
  router.put('/:slug', auth, (req, res) => {
    try {
      const { slug } = req.params
      const { name, description } = req.body
      const cats = readCategories()
      const idx = cats.findIndex((c) => c.slug === slug)
      if (idx === -1) {
        return res.status(404).json({ error: 'Category not found' })
      }
      if (name !== undefined) cats[idx].name = name
      if (description !== undefined) cats[idx].description = description
      writeCategories(cats)
      res.json(cats[idx])
    } catch (err) {
      console.error('Error updating category:', err)
      res.status(500).json({ error: 'Failed to update category' })
    }
  })

  // DELETE /api/categories/:slug — delete (auth required)
  router.delete('/:slug', auth, (req, res) => {
    try {
      const { slug } = req.params
      const cats = readCategories()
      const idx = cats.findIndex((c) => c.slug === slug)
      if (idx === -1) {
        return res.status(404).json({ error: 'Category not found' })
      }
      cats.splice(idx, 1)
      writeCategories(cats)
      res.json({ deleted: true })
    } catch (err) {
      console.error('Error deleting category:', err)
      res.status(500).json({ error: 'Failed to delete category' })
    }
  })

  return router
}
