import { DIAGRAM, TITLE } from '../boost_ci_evm_fast/content'

export async function GET() {
  const body = `# ${TITLE}\n\n\`\`\`mermaid\n${DIAGRAM}\n\`\`\`\n`
  return new Response(body, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } })
}
