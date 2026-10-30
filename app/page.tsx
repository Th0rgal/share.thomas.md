import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'share.thomas.md',
  robots: { index: false }
}

export default function HomePage() {
  return (
    <div className="is-posts">
      <p>
        Pages here are shared by direct link. See <a href="https://thomas.md">thomas.md</a>.
      </p>
    </div>
  )
}
