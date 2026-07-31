import { useState, useEffect } from 'react'
import { Sun, Moon } from '@phosphor-icons/react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('theme')
    if (stored === 'light') {
      document.documentElement.classList.remove('dark')
      document.documentElement.classList.add('light')
      setDark(false)
    }
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    const root = document.documentElement
    if (next) {
      root.classList.remove('light')
      root.classList.add('dark')
      localStorage.setItem('theme', 'dark')
    } else {
      root.classList.remove('dark')
      root.classList.add('light')
      localStorage.setItem('theme', 'light')
    }
  }

  return (
    <button
      onClick={toggle}
      className="flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-300"
      style={{
        borderColor: 'var(--color-border-strong)',
        background: 'var(--color-surface)',
        color: 'var(--color-text-secondary)',
      }}
      aria-label={dark ? '切换到亮色模式' : '切换到暗色模式'}
    >
      {dark ? <Sun size={16} weight="light" /> : <Moon size={16} weight="light" />}
    </button>
  )
}
