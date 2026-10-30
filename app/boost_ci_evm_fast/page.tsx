import type { Metadata } from 'next'
import Mermaid from '../components/Mermaid'
import { DIAGRAM, PATHS, STATUS, TITLE, TRUST } from './content'

export const metadata: Metadata = {
  title: TITLE,
  description: 'How boost.ci speeds up the evm.fast benchmark without being trusted by the verifier.',
  alternates: { canonical: 'https://share.thomas.md/boost_ci_evm_fast' },
  robots: { index: false }
}

export default function BoostCiEvmFastPage() {
  return (
    <div className="is-posts">
      <h1 className="title-display">{TITLE}</h1>
      <p>
        One request to boost.ci prebuilds the submission and returns a quick check, shown as a
        non-blocking preview. The verifier on the Blacksmith runner still makes the final call.
      </p>
      <Mermaid chart={DIAGRAM} />
      <h2 className="section-heading">Three paths</h2>
      <ul>
        {PATHS.map(([name, text]) => (
          <li key={name}>
            <strong>{name}</strong>: {text}
          </li>
        ))}
      </ul>
      <h2 className="section-heading">Why boost.ci is not trusted</h2>
      <p>{TRUST}</p>
      <h2 className="section-heading">Status</h2>
      <p>{STATUS}</p>
      <p>
        <a href="/boost_ci_evm_fast.md">Raw markdown</a>
      </p>
    </div>
  )
}
