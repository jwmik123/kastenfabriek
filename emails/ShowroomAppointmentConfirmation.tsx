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
import { CONTACT_EMAIL } from "@/lib/configurators";
import { formatSlotNl } from "@/lib/showroom/format";

export interface ShowroomAppointmentProps {
  name: string;
  email: string;
  phone: string;
  note?: string | null;
  /** 'YYYY-MM-DD' */
  date: string;
  start: string;
  end: string;
  addressLine?: string;
  confirmationText?: string | null;
}

const BRAND_GREEN = "#34463a";

export default function ShowroomAppointmentConfirmation({
  name,
  date,
  start,
  end,
  addressLine,
  confirmationText,
}: ShowroomAppointmentProps) {
  const when = formatSlotNl(date, start, end);
  const mapsHref = addressLine
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addressLine)}`
    : undefined;
  return (
    <Html lang="nl">
      <Head />
      <Preview>Je showroombezoek op {when} staat ingepland — Kastenfabriek</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <span style={brandName}>Kastenfabriek</span>
          </Section>

          <Section style={section}>
            <Heading as="h2" style={h2}>
              Tot snel in de showroom, {name}!
            </Heading>
            <Text style={text}>Je bezoek staat ingepland. We zien je graag op:</Text>

            <Section style={highlight}>
              <Text style={highlightText}>{when}</Text>
            </Section>

            {addressLine && (
              <>
                <Text style={label}>Adres</Text>
                <Text style={text}>
                  {addressLine}
                  {mapsHref && (
                    <>
                      <br />
                      <a href={mapsHref} style={footerLink}>
                        Route bekijken
                      </a>
                    </>
                  )}
                </Text>
              </>
            )}

            {confirmationText && <Text style={text}>{confirmationText}</Text>}

            <Hr style={hr} />
            <Text style={footerText}>
              Verhinderd of wil je verzetten? Mail ons op{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} style={footerLink}>
                {CONTACT_EMAIL}
              </a>{" "}
              of beantwoord deze mail.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const body = { backgroundColor: "#f2ede4", fontFamily: "Helvetica, Arial, sans-serif" };
const container = { maxWidth: "560px", margin: "0 auto", padding: "0 0 32px" };
const header = { backgroundColor: BRAND_GREEN, padding: "20px 32px", borderRadius: "8px 8px 0 0" };
const brandName = { color: "#fff", fontSize: "20px", fontWeight: 700 };
const section = { backgroundColor: "#fff", padding: "32px", borderRadius: "0 0 8px 8px" };
const h2 = { fontSize: "22px", color: "#1a1a1a", margin: "0 0 12px" };
const text = { fontSize: "15px", lineHeight: "1.6", color: "#444", margin: "0 0 12px" };
const highlight = { backgroundColor: "#f2ede4", borderRadius: "8px", padding: "16px 20px", margin: "8px 0 20px" };
const highlightText = { fontSize: "17px", fontWeight: 700, color: BRAND_GREEN, margin: 0 };
const label = { fontSize: "12px", fontWeight: 700, textTransform: "uppercase" as const, color: BRAND_GREEN, letterSpacing: "0.04em", margin: "16px 0 6px" };
const hr = { borderColor: "#eee", margin: "20px 0" };
const footerText = { fontSize: "13px", color: "#888", margin: 0 };
const footerLink = { color: BRAND_GREEN };
