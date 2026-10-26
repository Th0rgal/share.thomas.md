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
        aria-label="Toggle Dark Mode"
      >
        {dark ? (
          <svg
            fill="currentColor"
            viewBox="2 2 20 20"
            stroke="currentColor"
            height="14"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        ) : (
          <svg
            fill="currentColor"
            viewBox="2 2 20 20"
            stroke="currentColor"
            height="14"
          >
            <path
              strokeLinecap="round"
              strokeWidth={2}
              d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
            />
          </svg>
        )}
      </button>
    </header>
  )
}
