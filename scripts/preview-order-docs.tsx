import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { renderToBuffer } from '@react-pdf/renderer'
import { render } from '@react-email/components'
import OrderSpecPdf from '@/emails/OrderSpecPdf'
import OrderConfirmation from '@/emails/OrderConfirmation'
import OrderAdminNotification from '@/emails/OrderAdminNotification'
import { buildOrderSummary } from '@/lib/order/order-summary'
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

  writeFileSync(join(outDir, 'confirmation.html'), await render(<OrderConfirmation {...props} />))
  writeFileSync(join(outDir, 'admin.html'), await render(<OrderAdminNotification {...props} />))

  console.log(`Wrote ${outDir}/{specificaties.pdf,confirmation.html,admin.html}`)
  console.log('Summary:', props.summary)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
