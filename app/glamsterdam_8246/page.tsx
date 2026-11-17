import GlamsterdamNote from '../glamsterdam/GlamsterdamNote'
import { GLAMSTERDAM_PAGES, pageMetadata } from '../glamsterdam/content'

const page = GLAMSTERDAM_PAGES.eip8246

export const metadata = pageMetadata(page)

export default function Page() {
  return <GlamsterdamNote page={page} />
}
