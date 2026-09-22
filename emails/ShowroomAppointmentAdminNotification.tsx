import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { formatSlotNl } from "@/lib/showroom/format";
import type { ShowroomAppointmentProps } from "./ShowroomAppointmentConfirmation";

export default function ShowroomAppointmentAdminNotification({
  name,
  email,
  phone,
  note,
  date,
  start,
  end,
}: ShowroomAppointmentProps) {
  const when = formatSlotNl(date, start, end);
  return (
    <Html lang="nl">
      <Head />
      <Preview>Showroomafspraak: {name} op {when}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={section}>
            <Heading as="h2" style={h2}>
              Nieuwe showroomafspraak
            </Heading>

            <Text style={label}>Wanneer</Text>
            <Text style={big}>{when}</Text>

            <Hr style={hr} />

            <Text style={label}>Wie</Text>
            <Text style={text}>
              {name}
              <br />
              E-mail: <a href={`mailto:${email}`} style={link}>{email}</a>
              <br />
              Telefoon: <a href={`tel:${phone}`} style={link}>{phone}</a>
            </Text>

            {note && (
              <>
                <Text style={label}>Opmerking van de klant</Text>
                <Text style={text}>{note}</Text>
              </>
            )}

            <Hr style={hr} />
            <Text style={footerText}>
              Verzetten of annuleren? Mail de klant terug; de afspraak staat in de database als bevestigd.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const body = { backgroundColor: "#f4f4f4", fontFamily: "Helvetica, Arial, sans-serif" };
const container = { maxWidth: "560px", margin: "0 auto", padding: "24px 0" };
const section = { backgroundColor: "#fff", padding: "32px", borderRadius: "8px" };
const h2 = { fontSize: "20px", color: "#1a1a1a", margin: "0 0 16px" };
const text = { fontSize: "15px", lineHeight: "1.6", color: "#444", margin: "0 0 12px" };
const big = { fontSize: "17px", fontWeight: 700, color: "#34463a", margin: "0 0 12px" };
const label = { fontSize: "12px", fontWeight: 700, textTransform: "uppercase" as const, color: "#34463a", letterSpacing: "0.04em", margin: "16px 0 6px" };
const hr = { borderColor: "#eee", margin: "20px 0" };
const link = { color: "#34463a" };
const footerText = { fontSize: "13px", color: "#888", margin: 0 };
