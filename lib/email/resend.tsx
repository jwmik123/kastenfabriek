import { Resend } from "resend";
import { render } from "@react-email/components";
import { renderToBuffer } from "@react-pdf/renderer";
import OrderConfirmation from "@/emails/OrderConfirmation";
import OrderAdminNotification from "@/emails/OrderAdminNotification";
import OrderSpecPdf from "@/emails/OrderSpecPdf";
import type { OrderDocumentProps } from "@/lib/order/types";
import SampleRequestConfirmation, {
  type SampleRequestConfirmationProps,
} from "@/emails/SampleRequestConfirmation";
import SampleRequestAdminNotification, {
  type SampleRequestAdminNotificationProps,
} from "@/emails/SampleRequestAdminNotification";

export const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS = "Kastenfabriek <onboarding@resend.dev>";
const ADMIN_ADDRESS = process.env.ADMIN_EMAIL ?? "info@kastenfabriek.nl";

/**
 * Send the paid-order mails: one to the customer, one to ourselves under a
 * "Nieuwe bestelling" subject. Both carry the same specification PDF, rendered
 * once and attached to both.
 *
 * A failure on one mail must not swallow the other, so both are settled and
 * the failures are reported together.
 */
export async function sendOrderEmails(props: OrderDocumentProps): Promise<void> {
  const [customerHtml, adminHtml, pdf] = await Promise.all([
    render(<OrderConfirmation {...props} />),
    render(<OrderAdminNotification {...props} />),
    renderToBuffer(<OrderSpecPdf {...props} />),
  ]);

  const attachments = [
    {
      filename: `Specificaties-${props.orderNumber}.pdf`,
      content: pdf.toString("base64"),
      contentType: "application/pdf",
    },
  ];

  const results = await Promise.allSettled([
    resend.emails.send({
      from: FROM_ADDRESS,
      to: props.customerEmail,
      subject: `Bevestiging bestelling ${props.orderNumber} — Kastenfabriek`,
      html: customerHtml,
      attachments,
    }),
    resend.emails.send({
      from: FROM_ADDRESS,
      to: ADMIN_ADDRESS,
      replyTo: props.customerEmail,
      subject: `Nieuwe bestelling ${props.orderNumber} — ${props.shippingAddress.firstName} ${props.shippingAddress.lastName}`,
      html: adminHtml,
      attachments,
    }),
  ]);

  const failures = results.filter((r) => r.status === "rejected");
  if (failures.length > 0) {
    throw new AggregateError(
      failures.map((f) => (f as PromiseRejectedResult).reason),
      `Failed to send ${failures.length} of 2 order emails for ${props.orderNumber}`,
    );
  }
}

export async function sendSampleRequestEmails(props: {
  customerEmail: string;
  confirmation: SampleRequestConfirmationProps;
  admin: SampleRequestAdminNotificationProps;
}): Promise<void> {
  const [customerHtml, adminHtml] = await Promise.all([
    render(<SampleRequestConfirmation {...props.confirmation} />),
    render(<SampleRequestAdminNotification {...props.admin} />),
  ]);

  await Promise.all([
    resend.emails.send({
      from: FROM_ADDRESS,
      to: props.customerEmail,
      subject: "Je gratis materiaalstalen zijn onderweg — Kastenfabriek",
      html: customerHtml,
    }),
    resend.emails.send({
      from: FROM_ADDRESS,
      to: ADMIN_ADDRESS,
      subject: `Nieuwe stalenaanvraag — ${props.admin.name}`,
      html: adminHtml,
    }),
  ]);
}
