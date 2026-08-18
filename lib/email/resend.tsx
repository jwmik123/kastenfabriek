import { Resend } from "resend";
import { render } from "@react-email/components";
import { renderToBuffer } from "@react-pdf/renderer";
import OrderConfirmation from "@/emails/OrderConfirmation";
import OrderAdminNotification from "@/emails/OrderAdminNotification";
import OrderSpecPdf from "@/emails/OrderSpecPdf";
import type { OrderDocumentProps } from "@/lib/order/types";
import { CONTACT_EMAIL } from "@/lib/configurators";
import SampleRequestConfirmation, {
  type SampleRequestConfirmationProps,
} from "@/emails/SampleRequestConfirmation";
import SampleRequestAdminNotification, {
  type SampleRequestAdminNotificationProps,
} from "@/emails/SampleRequestAdminNotification";

export const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Senders must sit on a domain that is verified in Resend — kasten-fabriek.nl.
 * Order mail is sent from the orders address, the rest from the general one.
 * Both are overridable so a domain change does not need a deploy.
 */
const ORDER_FROM_ADDRESS =
  process.env.RESEND_ORDER_FROM ?? "Kastenfabriek <bestellingen@kasten-fabriek.nl>";
const SAMPLE_FROM_ADDRESS =
  process.env.RESEND_FROM ?? "Kastenfabriek <info@kasten-fabriek.nl>";
const ADMIN_ADDRESS = process.env.ADMIN_EMAIL ?? "info@kasten-fabriek.nl";

/**
 * Where a customer's reply should land. Sending needs only SPF/DKIM, so the
 * order address is not necessarily a mailbox anyone reads — point replies at
 * the contact address instead of losing them. Set RESEND_ORDER_REPLY_TO once
 * the order address can receive mail (an MX record plus a mailbox or a
 * forwarder), or point it anywhere else you read.
 */
const ORDER_REPLY_TO = process.env.RESEND_ORDER_REPLY_TO ?? CONTACT_EMAIL;

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
      from: ORDER_FROM_ADDRESS,
      to: props.customerEmail,
      replyTo: ORDER_REPLY_TO,
      subject: `Bevestiging bestelling ${props.orderNumber} — Kastenfabriek`,
      html: customerHtml,
      attachments,
    }),
    resend.emails.send({
      from: ORDER_FROM_ADDRESS,
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
      from: SAMPLE_FROM_ADDRESS,
      to: props.customerEmail,
      subject: "Je gratis materiaalstalen zijn onderweg — Kastenfabriek",
      html: customerHtml,
    }),
    resend.emails.send({
      from: SAMPLE_FROM_ADDRESS,
      to: ADMIN_ADDRESS,
      subject: `Nieuwe stalenaanvraag — ${props.admin.name}`,
      html: adminHtml,
    }),
  ]);
}
