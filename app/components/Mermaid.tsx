'use client'

import { useEffect, useId, useRef } from 'react'

// Renders a Mermaid diagram in the browser and re-renders when the site theme changes.
export default function Mermaid({ chart }: { chart: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const id = useId().replace(/:/g, '')

  useEffect(() => {
    let cancelled = false
    async function render() {
      const mermaid = (await import('mermaid')).default
      const dark = document.documentElement.classList.contains('dark')
      mermaid.initialize({
        startOnLoad: false,
        theme: dark ? 'dark' : 'neutral',
        securityLevel: 'strict',
        themeVariables: { fontSize: '18px' },
        flowchart: { nodeSpacing: 50, rankSpacing: 60, padding: 16 }
      })
      const { svg } = await mermaid.render(`mermaid-${id}-${dark ? 'd' : 'l'}`, chart)
      if (!cancelled && ref.current) ref.current.innerHTML = svg
    }
    render()
    const observer = new MutationObserver(render)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => {
      cancelled = true
      observer.disconnect()
    }
  }, [chart, id])

  return <div ref={ref} className="mermaid-diagram not-prose" role="img" aria-label="Diagram" />
}
