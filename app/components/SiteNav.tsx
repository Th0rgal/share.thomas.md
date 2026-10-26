'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function SiteNav() {
  const pathname = usePathname() ?? '/'
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark')
    setDark(isDark)
  }, [])

  function toggleTheme() {
    const next = !dark
    setDark(next)
    if (next) {
      document.documentElement.classList.add('dark')
      document.documentElement.setAttribute('data-theme', 'dark')
      localStorage.setItem('theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.setAttribute('data-theme', 'light')
      localStorage.setItem('theme', 'light')
    }
  }

  return (
    <header className="site-nav not-prose">
      <div className="site-nav-links">
        <a href="https://thomas.md">thomas.md</a>
        <span style={{ opacity: 0.35 }}>/</span>
        <Link href="/" className={pathname === '/' ? 'is-current' : undefined}>
          share
        </Link>
        {pathname !== '/' && (
          <>
            <span style={{ opacity: 0.35 }}>/</span>
            <span style={{ opacity: 0.65 }}>
              {pathname.replace(/^\//, '')}
            </span>
          </>
        )}
      </div>
      <button
        type="button"
        onClick={toggleTheme}
        className="theme-btn"
        aria-label="Toggle color theme"
      >
        {dark ? 'Light' : 'Dark'}
      </button>
    </header>
  )
}
