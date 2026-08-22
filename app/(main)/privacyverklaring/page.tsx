import LegalDocumentPage, {
  legalMetadata,
} from '../_legal/LegalDocumentPage'
import { LEGAL_DOCUMENT } from '@/lib/legal'

const doc = LEGAL_DOCUMENT.privacyPolicy

export const revalidate = 60

export const metadata = legalMetadata(doc)

export default function Page() {
  return <LegalDocumentPage doc={doc} />
}
