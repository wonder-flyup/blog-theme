import { Link, useLocation } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { Gear } from '@phosphor-icons/react'

export default function Nav() {
  const { pathname } = useLocation()
  const { token } = useAuth()

  const isActive = (to) => {
    if (to === '/') return pathname === '/' || pathname.startsWith('/post')
    return pathname.startsWith(to)
  }

  return (
    <nav
      className="sticky top-0 z-50 flex justify-center px-4 pt-4 pb-2"
      role="navigation"
      aria-label="主导航"
    >
      <div
        className="flex w-full max-w-lg items-center justify-between rounded-full border border-white/[0.06] px-5 py-3"
        style={{
          background: 'rgba(24,24,27,0.3)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.2), 0 0 0 1px rgba(45,212,191,0.04), 0 0 20px rgba(45,212,191,0.02)',
        }}
      >
        <Link
          to="/"
          className="text-base font-semibold tracking-tight"
          style={{ color: 'var(--color-text-primary)' }}
        >
          梦的光点
        </Link>

        <div className="flex items-center gap-1">
          <NavLink to="/" active={isActive('/')} label="文章" />
          <NavLink to="/links" active={isActive('/links')} label="友链" />
          <NavLink to="/about" active={isActive('/about')} label="关于" />

          {token && (
            <NavLink to="/admin" active={isActive('/admin')} label={<Gear size={15} weight="light" />} />
          )}

        </div>
      </div>
    </nav>
  )
}

function NavLink({ to, active, label }) {
  return (
    <Link
      to={to}
      className="rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors duration-200"
      style={{
        color: active ? 'var(--color-accent)' : 'var(--color-text-secondary)',
        background: active ? 'var(--color-accent-glow)' : 'transparent',
      }}
    >
      {label}
    </Link>
  )
}
