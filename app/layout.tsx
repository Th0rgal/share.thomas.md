import type { Metadata } from 'next'
import '../styles/main.css'
import SiteNav from './components/SiteNav'

export const metadata: Metadata = {
  metadataBase: new URL('https://share.thomas.md'),
  title: {
    default: 'share.thomas.md · Thomas Marchand',
    template: '%s · share.thomas.md'
  },
  description: 'Shared technical notes and formal verification audit reports by Thomas Marchand.',
  icons: {
    icon: '/favicon.svg'
  }
}

const themeInitScript = `
(function() {
  try {
    var saved = localStorage.getItem('theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (saved === 'dark' || (!saved && prefersDark)) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
    }
  } catch (e) {}
})();
`

export default function RootLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <div className="page-shell">
          <SiteNav />
          <main>{children}</main>
          <footer className="site-footer not-prose">
            <span>{new Date().getFullYear()} © Thomas Marchand</span>
            <span>
              <a href="https://thomas.md">thomas.md</a> ·{' '}
              <a href="https://github.com/th0rgal">@th0rgal</a>
            </span>
          </footer>
        </div>
      </body>
    </html>
  )
}
