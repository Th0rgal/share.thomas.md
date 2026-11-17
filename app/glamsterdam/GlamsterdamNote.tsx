import Markdown from './Markdown'
import type { GlamsterdamPage } from './content'
import './glamsterdam.css'

export default function GlamsterdamNote({ page }: { page: GlamsterdamPage }) {
  return (
    <article className="is-posts glam-note">
      <Markdown source={page.markdown} />
    </article>
  )
}
