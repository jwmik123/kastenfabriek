import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderToBuffer } from '@react-pdf/renderer'
import { render } from '@react-email/components'
import OrderSpecPdf from '@/emails/OrderSpecPdf'
import OrderConfirmation from '@/emails/OrderConfirmation'
import OrderAdminNotification from '@/emails/OrderAdminNotification'
import { buildOrderSummary } from '@/lib/order/order-summary'
import { inlineOrderImages } from '@/lib/email/inline-images'
import { address, coupon, items } from './order-doc-fixtures'

/**
 * Render the confirmation mail, the admin mail and the spec PDF for a sample
 * order into ./tmp/order-docs so they can be checked without placing an order.
 *
 *   npm run preview:order-docs
 */
async function main() {
  const outDir = process.argv[2] ?? join(process.cwd(), 'tmp', 'order-docs')
  mkdirSync(outDir, { recursive: true })

  const props = {
    orderNumber: 'ORD-20260819-A1B2',
    orderDate: new Date('2026-08-19T10:00:00Z'),
    customerEmail: 'sam@example.com',
    shippingAddress: address,
    items,
    summary: buildOrderSummary(items, coupon),
  }

  const pdf = await renderToBuffer(<OrderSpecPdf {...props} />)
  writeFileSync(join(outDir, 'specificaties.pdf'), pdf)

  // Mails go out with the captures as inline attachments, so preview what the
  // reader actually gets — a body with `cid:` references, not base64 blobs.
  const { items: mailItems, attachments } = inlineOrderImages(props.items)
  const mailProps = { ...props, items: mailItems }

  const confirmation = await render(<OrderConfirmation {...mailProps} />)
  const admin = await render(<OrderAdminNotification {...mailProps} />)
  writeFileSync(join(outDir, 'confirmation.html'), confirmation)
  writeFileSync(join(outDir, 'admin.html'), admin)

  const kb = (n: number) => `${Math.round(n / 1024)} KB`
  console.log(
    `HTML-body: bevestiging ${kb(confirmation.length)}, admin ${kb(admin.length)} ` +
      `(Gmail knipt boven 102 KB) · ${attachments.length} inline afbeeldingen`,
  )

  console.log(`Wrote ${outDir}/{specificaties.pdf,confirmation.html,admin.html}`)
  console.log('Summary:', props.summary)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
