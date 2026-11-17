import type { ReactNode } from 'react'

// Minimal renderer for the subset of Markdown the Glamsterdam notes use:
// `##`/`###` headings, paragraphs, `-` lists (one level), `**bold**`,
// `` `code` `` and `[text](url)`. The same string is served as the .md route.

const INLINE = /(\*\*[^*]+\*\*|`[^`]+`|\[[^\]]+\]\([^)]+\))/g

function inline(text: string): ReactNode[] {
  return text.split(INLINE).map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{inline(part.slice(2, -2))}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i}>{part.slice(1, -1)}</code>
    }
    const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (link) {
      const [, label, href] = link
      const external = href.startsWith('http')
      return (
        <a
          key={i}
          href={href}
          {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
        >
          {inline(label)}
        </a>
      )
    }
    return part
  })
}

export default function Markdown({ source }: { source: string }) {
  const blocks = source.trim().split(/\n\s*\n/)
  return (
    <>
      {blocks.map((block, i) => {
        const lines = block.split('\n')
        if (block.startsWith('# ')) return <h1 key={i} className="title-display">{inline(block.slice(2))}</h1>
        if (block.startsWith('## ')) return <h2 key={i} className="section-heading">{inline(block.slice(3))}</h2>
        if (block.startsWith('### ')) return <h3 key={i}>{inline(block.slice(4))}</h3>
        if (lines.every((l) => l.startsWith('- ') || l.startsWith('  '))) {
          const items: string[] = []
          for (const l of lines) {
            if (l.startsWith('- ')) items.push(l.slice(2))
            else items[items.length - 1] += ' ' + l.trim()
          }
          return (
            <ul key={i}>
              {items.map((item, j) => (
                <li key={j}>{inline(item)}</li>
              ))}
            </ul>
          )
        }
        return <p key={i}>{inline(lines.join(' '))}</p>
      })}
    </>
  )
}
