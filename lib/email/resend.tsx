import { Resend } from "resend";
import { render } from "@react-email/components";
import OrderConfirmation, {
  type OrderConfirmationProps,
} from "@/emails/OrderConfirmation";

export const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS = "Kastenfabriek <onboarding@resend.dev>";

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
