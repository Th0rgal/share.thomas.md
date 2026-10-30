import type { Metadata } from 'next'
import Mermaid from '../components/Mermaid'
import { DIAGRAM, TITLE } from './content'

export const metadata: Metadata = {
  title: TITLE,
  alternates: { canonical: 'https://share.thomas.md/boost_ci_evm_fast' },
  robots: { index: false }
}

export default function BoostCiEvmFastPage() {
  return (
    <div className="diagram-page">
      <Mermaid chart={DIAGRAM} />
    </div>
  )
}
