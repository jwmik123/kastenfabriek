import { Resend } from "resend";
import { render } from "@react-email/components";
import OrderConfirmation, {
  type OrderConfirmationProps,
} from "@/emails/OrderConfirmation";
import SampleRequestConfirmation, {
  type SampleRequestConfirmationProps,
} from "@/emails/SampleRequestConfirmation";
import SampleRequestAdminNotification, {
  type SampleRequestAdminNotificationProps,
} from "@/emails/SampleRequestAdminNotification";

export const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS = "Kastenfabriek <onboarding@resend.dev>";
const ADMIN_ADDRESS = process.env.ADMIN_EMAIL ?? "info@kastenfabriek.nl";

export async function sendOrderConfirmationEmail(
  props: OrderConfirmationProps
): Promise<void> {
  const html = await render(<OrderConfirmation {...props} />);

  await resend.emails.send({
    from: FROM_ADDRESS,
    to: props.customerEmail,
    subject: `Bevestiging bestelling ${props.orderNumber} — Kastenfabriek`,
    html,
  });
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
