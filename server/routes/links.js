import { Router } from 'express'
import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const LINKS_FILE = join(__dirname, '..', 'content', 'links.json')

function readLinks() {
  if (!existsSync(LINKS_FILE)) return []
  return JSON.parse(readFileSync(LINKS_FILE, 'utf-8'))
}

function writeLinks(links) {
  const dir = dirname(LINKS_FILE)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  writeFileSync(LINKS_FILE, JSON.stringify(links, null, 2), 'utf-8')
}

export default function linksRouter({ auth }) {
  const router = Router()

  // GET /api/links — public
  router.get('/', (_req, res) => {
    try {
      res.json(readLinks())
    } catch (err) {
      console.error('Error reading links:', err)
      res.status(500).json({ error: 'Failed to load links' })
    }
  })

  // POST /api/links — create (auth required)
  router.post('/', auth, (req, res) => {
    try {
      const { name, url, description } = req.body
      if (!name || !url) {
        return res.status(400).json({ error: 'name and url are required' })
      }
      const links = readLinks()
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
      const newLink = { id, name, url, description: description || '' }
      links.push(newLink)
      writeLinks(links)
      res.status(201).json(newLink)
    } catch (err) {
      console.error('Error creating link:', err)
      res.status(500).json({ error: 'Failed to create link' })
    }
  })

  // PUT /api/links/:id — update (auth required)
  router.put('/:id', auth, (req, res) => {
    try {
      const { id } = req.params
      const { name, url, description } = req.body
      const links = readLinks()
      const idx = links.findIndex((l) => l.id === id)
      if (idx === -1) {
        return res.status(404).json({ error: 'Link not found' })
      }
      if (name !== undefined) links[idx].name = name
      if (url !== undefined) links[idx].url = url
      if (description !== undefined) links[idx].description = description
      writeLinks(links)
      res.json(links[idx])
    } catch (err) {
      console.error('Error updating link:', err)
      res.status(500).json({ error: 'Failed to update link' })
    }
  })

  // DELETE /api/links/:id — delete (auth required)
  router.delete('/:id', auth, (req, res) => {
    try {
      const { id } = req.params
      const links = readLinks()
      const idx = links.findIndex((l) => l.id === id)
      if (idx === -1) {
        return res.status(404).json({ error: 'Link not found' })
      }
      links.splice(idx, 1)
      writeLinks(links)
      res.json({ deleted: true })
    } catch (err) {
      console.error('Error deleting link:', err)
      res.status(500).json({ error: 'Failed to delete link' })
    }
  })

  return router
}
