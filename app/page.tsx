import Link from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Shared Notes & Audits'
}

export default function HomePage() {
  return (
    <div className="is-posts">
      <h1 className="title-display">Shared Notes</h1>
      <p>Hey,</p>
      <p>
        This is where I share standalone technical reports, formal verification
        reviews, and research notes outside my main blog at{' '}
        <a href="https://thomas.md">thomas.md</a>.
      </p>
      <hr className="qr-divider" />
      <h2 className="section-heading">Reports</h2>
      <ul>
        <li>
          <Link href="/ethlib_audit_report">
            <strong>EthLib Audit Report</strong>
          </Link>{' '}
          (October 2026) · Quorum review of{' '}
          <a href="https://github.com/ethereum/EthLib">ethereum/EthLib</a>{' '}
          across Lean 4 specifications, formal proofs, and CPython bindings.
        </li>
        <li><Link href="/ethlib_cell_roundtrip"><strong>KZG Cell Round-Trip</strong></Link>{' '}
          · A kernel-checked serialization proof (PR #126).</li>
        <li><Link href="/ethlib_keygen_proof"><strong>XMSS KeyGen Known Answer</strong></Link>{' '}
          · Kernel-checked with passing CI (PR #127).</li>
        <li><Link href="/ethlib_field_proofs"><strong>BLS Tower Fields</strong></Link>{' '}
          · Field laws and total exponentiation, extracted from #100 (PR #128).</li>
      </ul>
    </div>
  )
}
