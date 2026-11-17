import GlamsterdamNote from './GlamsterdamNote'
import { GLAMSTERDAM_PAGES, pageMetadata } from './content'

const page = GLAMSTERDAM_PAGES.overview

export const metadata = pageMetadata(page)

export default function Page() {
  return <GlamsterdamNote page={page} />
}
