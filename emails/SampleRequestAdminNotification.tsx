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
import { MATERIALS } from "@/app/(configurator)/kledingkast/materials";

export interface SampleRequestAdminNotificationProps {
  name: string;
  email: string;
  phone?: string | null;
  materialIds: string[];
  shippingAddress: {
    street: string;
    houseNumber: string;
    houseNumberAddition?: string | null;
    postalCode: string;
    city: string;
    country: string;
  };
  marketingOptIn: boolean;
}

function materialLine(id: string): string {
  const m = MATERIALS.find((x) => x.id === id);
  return m ? `${m.name} (${id})` : id;
}

export default function SampleRequestAdminNotification({
  name,
  email,
  phone,
  materialIds,
  shippingAddress,
  marketingOptIn,
}: SampleRequestAdminNotificationProps) {
  return (
    <Html lang="nl">
      <Head />
      <Preview>Nieuwe stalenaanvraag van {name}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={section}>
            <Heading as="h2" style={h2}>
              Nieuwe stalenaanvraag
            </Heading>

            <Text style={label}>Materialen om te verzenden</Text>
            {materialIds.map((id) => (
              <Text key={id} style={listItem}>
                • {materialLine(id)}
              </Text>
            ))}

            <Hr style={hr} />

            <Text style={label}>Verzendadres</Text>
            <Text style={text}>
              {name}
              <br />
              {shippingAddress.street} {shippingAddress.houseNumber}
              {shippingAddress.houseNumberAddition
                ? ` ${shippingAddress.houseNumberAddition}`
                : ""}
              <br />
              {shippingAddress.postalCode} {shippingAddress.city}
              <br />
              {shippingAddress.country}
            </Text>

            <Hr style={hr} />

            <Text style={label}>Contact</Text>
            <Text style={text}>
              E-mail: {email}
              {phone ? (
                <>
                  <br />
                  Telefoon: {phone}
                </>
              ) : null}
              <br />
              Nieuwsbrief: {marketingOptIn ? "ja" : "nee"}
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
const label = { fontSize: "12px", fontWeight: 700, textTransform: "uppercase" as const, color: "#34463a", letterSpacing: "0.04em", margin: "16px 0 6px" };
const listItem = { fontSize: "15px", color: "#444", margin: "0 0 4px" };
const hr = { borderColor: "#eee", margin: "20px 0" };
