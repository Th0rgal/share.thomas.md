import type { Metadata } from 'next'
import Mermaid from '../components/Mermaid'
import { DIAGRAM, TITLE } from './content'

export const metadata: Metadata = {
  title: TITLE,
  alternates: { canonical: 'https://share.thomas.md/turbo_benchmark_evm_fast' },
  robots: { index: false }
}

export default function TurboBenchmarkEvmFastPage() {
  return (
    <div className="diagram-page">
      <Mermaid chart={DIAGRAM} />
    </div>
  )
}
