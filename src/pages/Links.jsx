import { useState, useEffect, useCallback } from 'react'
import { fetchLinks } from '../lib/api'

function getDomain(url) {
  try { return new URL(url).hostname } catch { return url }
}

// Individual friend card — handles image load failure by falling back to initials
function FriendCard({ friend, faviconUrl }) {
  const [imgFailed, setImgFailed] = useState(false)
  const imageSrc = friend.image || faviconUrl

  const onError = useCallback(() => setImgFailed(true), [])

  // Reset if imageSrc changes
  useEffect(() => { setImgFailed(false) }, [imageSrc])

  return (
    <a
      href={friend.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex flex-col items-center gap-3 transition-all duration-300 hover:-translate-y-1.5"
    >
      <div className="flex aspect-square w-full items-center justify-center">
        {imageSrc && !imgFailed ? (
          <img
            src={imageSrc}
            alt={friend.description || friend.name || getDomain(friend.url)}
            className="h-full w-full rounded-2xl object-contain transition-shadow duration-300 group-hover:shadow-xl"
            loading="lazy"
            onError={onError}
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center rounded-2xl text-xl font-bold"
            style={{ background: 'var(--color-accent)', color: '#fafafa' }}
          >
            {(friend.name || getDomain(friend.url)).slice(0, 2)}
          </div>
        )}
      </div>
      {(friend.description || friend.name) && (
        <span
          className="text-xs text-center leading-snug line-clamp-2"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {friend.description || friend.name}
        </span>
      )}
    </a>
  )
}

export default function Links() {
  const [friends, setFriends] = useState([])
  const [favicons, setFavicons] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLinks()
      .then(async (links) => {
        setFriends(links)
        const map = {}
        await Promise.all(
          links.map(async (link) => {
            try {
              const res = await fetch(`/api/favicon?url=${encodeURIComponent(link.url)}`)
              const data = await res.json()
              if (data.faviconUrl) map[link.id] = data.faviconUrl
            } catch { /* skip */ }
          })
        )
        setFavicons(map)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>加载中...</p>
      </div>
    )
  }

  if (friends.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6">
        <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>暂无友链，敬请期待。</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-16">
      <div className="grid grid-cols-3 gap-8 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6">
        {friends.map((friend) => (
          <FriendCard
            key={friend.id}
            friend={friend}
            faviconUrl={favicons[friend.id]}
          />
        ))}
      </div>
    </div>
  )
}
