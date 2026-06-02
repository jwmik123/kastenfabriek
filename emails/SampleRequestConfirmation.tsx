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

export interface SampleRequestConfirmationProps {
  name: string;
  materialIds: string[];
  shippingAddress: {
    street: string;
    houseNumber: string;
    houseNumberAddition?: string | null;
    postalCode: string;
    city: string;
    country: string;
  };
}

const BRAND_GREEN = "#34463a";

function materialName(id: string): string {
  return MATERIALS.find((m) => m.id === id)?.name ?? id;
}

export default function SampleRequestConfirmation({
  name,
  materialIds,
  shippingAddress,
}: SampleRequestConfirmationProps) {
  return (
    <Html lang="nl">
      <Head />
      <Preview>Je gratis materiaalstalen zijn onderweg — Kastenfabriek</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
            <span style={brandName}>Kastenfabriek</span>
          </Section>

          <Section style={section}>
            <Heading as="h2" style={h2}>
              Bedankt voor je aanvraag, {name}!
            </Heading>
            <Text style={text}>
              We hebben je aanvraag voor gratis materiaalstalen ontvangen. Je
              stalen worden binnen drie werkdagen kosteloos verzonden.
            </Text>

            <Text style={label}>Gekozen stalen</Text>
            {materialIds.map((id) => (
              <Text key={id} style={listItem}>
                • {materialName(id)}
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
            <Text style={footerText}>
              Vragen? Mail ons op{" "}
              <a href="mailto:info@kastenfabriek.nl" style={footerLink}>
                info@kastenfabriek.nl
              </a>
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
const label = { fontSize: "12px", fontWeight: 700, textTransform: "uppercase" as const, color: BRAND_GREEN, letterSpacing: "0.04em", margin: "16px 0 6px" };
const listItem = { fontSize: "15px", color: "#444", margin: "0 0 4px" };
const hr = { borderColor: "#eee", margin: "20px 0" };
const footerText = { fontSize: "13px", color: "#888", margin: 0 };
const footerLink = { color: BRAND_GREEN };
