import { DIAGRAM, PATHS, STATUS, TITLE, TRUST } from '../boost_ci_evm_fast/content'

export async function GET() {
  const body = [
    `# ${TITLE}`,
    '',
    '```mermaid',
    DIAGRAM,
    '```',
    '',
    '## Three paths',
    '',
    ...PATHS.map(([name, text]) => `- **${name}**: ${text}`),
    '',
    '## Why boost.ci is not trusted',
    '',
    TRUST,
    '',
    '## Status',
    '',
    STATUS,
    '',
  ].join('\n')
  return new Response(body, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } })
}
