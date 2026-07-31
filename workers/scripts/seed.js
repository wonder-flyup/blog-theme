// Seed: upload existing local content → R2
// Usage: node scripts/seed.js
// Requires: BLOG_R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY env vars

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { readFileSync, readdirSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// R2 credentials (same as S3)
const R2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT, // e.g. https://<account>.r2.cloudflarestorage.com
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

async function upload(key, filePath, contentType) {
  const body = readFileSync(filePath)
  await R2.send(new PutObjectCommand({
    Bucket: 'blog-content',
    Key: key,
    Body: body,
    ContentType: contentType,
  }))
  console.log(`  ✅ ${key}`)
}

async function seed() {
  console.log('Seeding R2 bucket "blog-content"...\n')

  // Posts
  const postsDir = join(__dirname, '..', '..', 'server', 'content', 'posts')
  if (existsSync(postsDir)) {
    const files = readdirSync(postsDir).filter((f) => f.endsWith('.md'))
    for (const file of files) {
      const content = readFileSync(join(postsDir, file))
      await upload(`posts/${file}`, join(postsDir, file), 'text/markdown')
    }
  }

  // Categories
  const catFile = join(__dirname, '..', '..', 'server', 'content', 'categories.json')
  if (existsSync(catFile)) {
    await upload('data/categories.json', catFile, 'application/json')
  }

  // Links
  const linksFile = join(__dirname, '..', '..', 'server', 'content', 'links.json')
  if (existsSync(linksFile)) {
    await upload('data/links.json', linksFile, 'application/json')
  }

  // Uploads
  const uploadsDir = join(__dirname, '..', '..', 'server', 'content', 'uploads')
  if (existsSync(uploadsDir)) {
    const uploadFiles = readdirSync(uploadsDir)
    for (const file of uploadFiles) {
      await upload(`uploads/${file}`, join(uploadsDir, file), 'application/octet-stream')
    }
  }

  console.log('\n✅ Seed complete!')
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
