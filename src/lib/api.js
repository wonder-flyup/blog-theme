// Dev: Vite proxies /api → localhost:3001
// Prod: point to your Workers URL
const API_BASE = import.meta.env.VITE_API_BASE || '/api'

async function request(path) {
  const res = await fetch(`${API_BASE}${path}`)
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

export async function authedFetch(path, token, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw new Error(data.error || `${res.status}`)
  }
  return res.json()
}

// Posts
export function fetchPosts(category) {
  const qs = category ? `?category=${encodeURIComponent(category)}` : ''
  return request(`/posts${qs}`)
}

export function fetchPost(slug) {
  return request(`/posts/${encodeURIComponent(slug)}`)
}

// Categories
export function fetchCategories() {
  return request('/categories')
}

export function createCategory(data, token) {
  return authedFetch('/categories', token, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateCategory(slug, data, token) {
  return authedFetch(`/categories/${encodeURIComponent(slug)}`, token, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function deleteCategory(slug, token) {
  return authedFetch(`/categories/${encodeURIComponent(slug)}`, token, {
    method: 'DELETE',
  })
}

// Links
export function fetchLinks() {
  return request('/links')
}

export function createLink(data, token) {
  return authedFetch('/links', token, {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateLink(id, data, token) {
  return authedFetch(`/links/${encodeURIComponent(id)}`, token, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function deleteLink(id, token) {
  return authedFetch(`/links/${encodeURIComponent(id)}`, token, {
    method: 'DELETE',
  })
}
