import { renderMarkdown } from '../leanldgr/data'

export async function GET() {
  return new Response(renderMarkdown(), {
    headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
  })
}
