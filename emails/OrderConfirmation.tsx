import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { MATERIALS } from "@/app/(configurator)/kledingkast/materials";
import type { ClosetConfigSnapshot, PriceSnapshot } from "@/lib/cart/types";
import { getDeliveryWindow } from "@/lib/delivery-window";

interface AddressSnapshot {
  firstName: string;
  lastName: string;
  company?: string | null;
  street: string;
  houseNumber: string;
  houseNumberAddition?: string | null;
  postalCode: string;
  city: string;
  country: string;
  phone?: string | null;
}

interface OrderItemSnapshot {
  configuration: ClosetConfigSnapshot;
  priceSnapshot: PriceSnapshot;
  screenshotClosedUrl?: string;
  screenshotOpenUrl?: string;
}

export interface OrderConfirmationProps {
  orderNumber: string;
  orderDate: Date;
  customerEmail: string;
  shippingAddress: AddressSnapshot;
  items: OrderItemSnapshot[];
  totalAmountCents: number;
}

const BRAND_GREEN = "#34463a";
const BRAND_GREEN_LIGHT = "#e2e9e3";

function getMaterialName(id: string): string {
  return MATERIALS.find((m) => m.id === id)?.name ?? id;
}

function formatPrice(euros: number): string {
  return new Intl.NumberFormat("nl-NL", {
    style: "currency",
    currency: "EUR",
  }).format(euros);
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function OrderConfirmation({
  orderNumber,
  orderDate,
  shippingAddress,
  items,
  totalAmountCents,
}: OrderConfirmationProps) {
  return (
    <Html lang="nl">
      <Head />
      <Preview>Bevestiging van bestelling {orderNumber} — Kastenfabriek</Preview>
      <Body style={body}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            {/* Logo SVG encoded as img — brand mark */}
            <table width="100%" cellPadding="0" cellSpacing="0">
              <tr>
                <td style={{ verticalAlign: "middle" }}>
                  <svg width="48" height="29" viewBox="0 0 183 111" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ display: "block" }}>
                    <path d="M13.75 108.5H2.5V2.5H25V108.5H13.75ZM13.75 108.5L13.5 55H45V108.5H35.5M13.75 108.5H35.5M35.5 108.5V34H76V108.5H58M35.5 108.5H58M58 108.5V75H146V108.5H107M58 108.5H95.5M95.5 108.5V57.5H168.5V108.5H107M95.5 108.5H107M107 108.5V93H180.5V108.5H107Z" stroke="white" strokeWidth="5"/>
                  </svg>
                </td>
                <td style={{ verticalAlign: "middle", paddingLeft: "12px" }}>
                  <span style={brandName}>Kastenfabriek</span>
                </td>
              </tr>
            </table>
          </Section>

          {/* Intro */}
          <Section style={section}>
            <Heading as="h2" style={h2}>
              Bedankt voor je bestelling!
            </Heading>
            <Text style={text}>
              Beste {shippingAddress.firstName},
            </Text>
            <Text style={text}>
              We hebben je bestelling ontvangen en gaan er meteen mee aan de
              slag. Hieronder vind je een overzicht van je bestelling.
            </Text>
          </Section>

          {/* Order meta */}
          <Section style={{ ...section, paddingTop: 0 }}>
            <table width="100%" cellPadding="0" cellSpacing="0" style={metaTable}>
              <tr>
                <td style={metaCell}>
                  <Text style={label}>Bestelnummer</Text>
                  <Text style={metaValue}>{orderNumber}</Text>
                </td>
                <td style={metaCell}>
                  <Text style={label}>Datum</Text>
                  <Text style={metaValue}>{formatDate(orderDate)}</Text>
                </td>
                <td style={metaCell}>
                  <Text style={label}>Status</Text>
                  <Text style={{ ...metaValue, color: BRAND_GREEN, fontWeight: "600" }}>Betaald</Text>
                </td>
                <td style={metaCell}>
                  <Text style={label}>Geschatte aankomst</Text>
                  <Text style={metaValue}>{getDeliveryWindow(orderDate)}</Text>
                </td>
              </tr>
            </table>
          </Section>

          <Hr style={hr} />

          {/* Order items */}
          {items.map((item, i) => {
            const { configuration: c, priceSnapshot: p } = item;
            const outerMaterial = getMaterialName(c.buitenkantMaterialId);
            const innerMaterial = getMaterialName(c.binnenkantMaterialId);
            const powerHoleCount = c.modules.filter((m) => m.hasPowerHole).length
            const hasExtras = c.lightStripsEnabled || powerHoleCount > 0 || c.hasTopCabinet || c.diagonalSide !== "none" || c.backDiagonal;

            return (
              <Section key={i} style={itemSection}>
                <Heading as="h3" style={h3}>
                  Maatwerkkast {items.length > 1 ? `${i + 1} ` : ""}— {c.widthCm} × {c.heightCm} × {c.depthCm} cm
                </Heading>

                {/* Screenshots — closed and open side-by-side */}
                {(item.screenshotClosedUrl || item.screenshotOpenUrl) && (
                  <Row style={{ marginBottom: "16px" }}>
                    {item.screenshotClosedUrl && (
                      <Column style={{ paddingRight: item.screenshotOpenUrl ? "6px" : "0" }}>
                        <Img
                          src={item.screenshotClosedUrl}
                          alt="Deuren dicht"
                          style={screenshot}
                        />
                      </Column>
                    )}
                    {item.screenshotOpenUrl && (
                      <Column style={{ paddingLeft: item.screenshotClosedUrl ? "6px" : "0" }}>
                        <Img
                          src={item.screenshotOpenUrl}
                          alt="Deuren open"
                          style={screenshot}
                        />
                      </Column>
                    )}
                  </Row>
                )}

                {/* Config details */}
                <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginTop: "16px" }}>
                  <tr>
                    <td style={detailLabel}><Text style={label}>Afmetingen</Text></td>
                    <td><Text style={value}>{c.widthCm} × {c.heightCm} × {c.depthCm} cm</Text></td>
                  </tr>
                  <tr>
                    <td style={detailLabel}><Text style={label}>Plaatsing</Text></td>
                    <td><Text style={value}>{c.placementType === "ingebouwd" ? "Ingebouwd" : "Vrijstaand"}</Text></td>
                  </tr>
                  <tr>
                    <td style={detailLabel}><Text style={label}>Materialen</Text></td>
                    <td>
                      <Text style={value}>Buiten: {outerMaterial}</Text>
                      <Text style={featureText}>Binnen: {innerMaterial}</Text>
                    </td>
                  </tr>
                  <tr>
                    <td style={detailLabel}><Text style={label}>Handgrepen</Text></td>
                    <td><Text style={value}>{c.doorHandleName ?? (c.doorHandleId === "none" ? "Greeploos (push-to-open)" : c.doorHandleId)}</Text></td>
                  </tr>
                  <tr>
                    <td style={detailLabel}><Text style={label}>Modules</Text></td>
                    <td>
                      <Text style={value}>{c.moduleCount} modules</Text>
                      {c.modules
                        .filter((m) => m.layoutName)
                        .map((m, mi) => (
                          <Text key={mi} style={featureText}>
                            Module {m.slotIndex + 1}: {m.layoutName}
                            {m.hasDoor ? " · met deur" : ""}
                            {m.span === 2 ? " · dubbel" : ""}
                          </Text>
                        ))}
                    </td>
                  </tr>
                  {hasExtras && (
                    <tr>
                      <td style={detailLabel}><Text style={label}>Extra&apos;s</Text></td>
                      <td>
                        {c.lightStripsEnabled && <Text style={value}>LED-strips</Text>}
                        {powerHoleCount > 0 && <Text style={featureText}>Kabeldoorvoer ({powerHoleCount}×)</Text>}
                        {c.hasTopCabinet && <Text style={featureText}>Bovenkast ({c.topCabinetHeightCm} cm)</Text>}
                        {c.diagonalSide !== "none" && <Text style={featureText}>Schuine wand {c.diagonalSide === "left" ? "links" : c.diagonalSide === "right" ? "rechts" : c.diagonalSide}</Text>}
                        {c.backDiagonal && <Text style={featureText}>Schuine achterwand</Text>}
                      </td>
                    </tr>
                  )}
                </table>

                {/* Price breakdown */}
                <Section style={priceSection}>
                  <Heading as="h4" style={h4}>Prijsoverzicht</Heading>
                  {[
                    { label: "Modules & interieur", amount: p.moduleCost },
                    p.doorCost > 0 && { label: "Deuren", amount: p.doorCost },
                    p.mechanismCost > 0 && { label: "Handgrepen", amount: p.mechanismCost },
                    p.ledCost > 0 && { label: "LED-strips", amount: p.ledCost },
                    p.discountAmount && p.discountAmount > 0 && p.discountCode
                      ? { label: `Korting (${p.discountCode})`, amount: -(p.discountAmount / 100) }
                      : false,
                    { label: "Bezorging", amount: p.deliveryCost },
                    p.installationCost > 0 && {
                      label: `Montage${p.installationTierName ? ` (${p.installationTierName})` : ""}`,
                      amount: p.installationCost,
                    },
                    p.freeMontageApplied && p.freeMontageDiscount && p.freeMontageDiscount > 0
                      ? { label: "Gratis montage", amount: -(p.freeMontageDiscount) }
                      : false,
                  ]
                    .filter(Boolean)
                    .map((row, ri) => (
                      <table key={ri} width="100%" cellPadding="0" cellSpacing="0">
                        <tr>
                          <td><Text style={priceLabel}>{(row as { label: string }).label}</Text></td>
                          <td style={{ textAlign: "right" }}><Text style={priceAmount}>{formatPrice((row as { amount: number }).amount)}</Text></td>
                        </tr>
                      </table>
                    ))}
                  <Hr style={thinHr} />
                  <table width="100%" cellPadding="0" cellSpacing="0">
                    <tr>
                      <td><Text style={totalLabel}>Totaal</Text></td>
                      <td style={{ textAlign: "right" }}><Text style={totalAmountStyle}>{formatPrice(p.total - (p.discountAmount ?? 0) / 100)}</Text></td>
                    </tr>
                  </table>
                </Section>
              </Section>
            );
          })}

          {items.length > 1 && (
            <Section style={{ ...section, backgroundColor: BRAND_GREEN_LIGHT }}>
              <table width="100%" cellPadding="0" cellSpacing="0">
                <tr>
                  <td><Text style={{ ...totalLabel, fontSize: "17px" }}>Totaal bestelling</Text></td>
                  <td style={{ textAlign: "right" }}>
                    <Text style={{ ...totalAmountStyle, fontSize: "17px" }}>{formatPrice(totalAmountCents / 100)}</Text>
                  </td>
                </tr>
              </table>
            </Section>
          )}

          <Hr style={hr} />

          {/* Shipping address */}
          <Section style={section}>
            <Heading as="h3" style={h3}>Bezorgadres</Heading>
            <Text style={text}>
              {shippingAddress.firstName} {shippingAddress.lastName}
              {shippingAddress.company ? ` · ${shippingAddress.company}` : ""}
            </Text>
            <Text style={text}>
              {shippingAddress.street} {shippingAddress.houseNumber}
              {shippingAddress.houseNumberAddition ?? ""}
            </Text>
            <Text style={text}>
              {shippingAddress.postalCode} {shippingAddress.city}
            </Text>
            {shippingAddress.phone && (
              <Text style={text}>{shippingAddress.phone}</Text>
            )}
          </Section>

          <Hr style={hr} />

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              Vragen over je bestelling? Mail ons op{" "}
              <a href="mailto:info@kastenfabriek.nl" style={footerLink}>
                info@kastenfabriek.nl
              </a>
            </Text>
            <Text style={footerText}>© {new Date().getFullYear()} Kastenfabriek</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const body: React.CSSProperties = {
  backgroundColor: "#f3f6f6",
  fontFamily: "'Inter', 'Helvetica Neue', Arial, sans-serif",
};

const container: React.CSSProperties = {
  maxWidth: "600px",
  margin: "0 auto",
  backgroundColor: "#ffffff",
};

const header: React.CSSProperties = {
  backgroundColor: BRAND_GREEN,
  padding: "20px 32px",
};

const brandName: React.CSSProperties = {
  color: "#ffffff",
  fontSize: "18px",
  fontWeight: "700",
  letterSpacing: "0.04em",
};

const section: React.CSSProperties = {
  padding: "24px 32px",
};

const itemSection: React.CSSProperties = {
  padding: "24px 32px",
  borderBottom: "1px solid #e2e9e3",
};

const h2: React.CSSProperties = {
  fontSize: "20px",
  fontWeight: "600",
  color: "#0a0a0a",
  margin: "0 0 12px 0",
};

const h3: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: "600",
  color: BRAND_GREEN,
  margin: "0 0 16px 0",
};

const h4: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: "600",
  color: "#374151",
  margin: "0 0 8px 0",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
};

const text: React.CSSProperties = {
  fontSize: "14px",
  color: "#374151",
  margin: "0 0 4px 0",
  lineHeight: "1.5",
};

const featureText: React.CSSProperties = {
  fontSize: "13px",
  color: "#6b7280",
  margin: "2px 0",
  lineHeight: "1.4",
};

const label: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: "600",
  color: "#9ca3af",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
  margin: "0 0 2px 0",
};

const value: React.CSSProperties = {
  fontSize: "14px",
  color: "#111827",
  margin: "0 0 2px 0",
};

const detailLabel: React.CSSProperties = {
  width: "130px",
  verticalAlign: "top",
  paddingBottom: "10px",
};

const metaTable: React.CSSProperties = {
  backgroundColor: BRAND_GREEN_LIGHT,
  borderRadius: "8px",
  padding: "12px 16px",
};

const metaCell: React.CSSProperties = {
  paddingRight: "24px",
  verticalAlign: "top",
};

const metaValue: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#111827",
  margin: "0",
};

const screenshot: React.CSSProperties = {
  width: "100%",
  borderRadius: "6px",
  display: "block",
  border: `1px solid ${BRAND_GREEN_LIGHT}`,
};

const priceSection: React.CSSProperties = {
  backgroundColor: "#f9fafb",
  borderRadius: "8px",
  padding: "16px",
  marginTop: "16px",
  border: `1px solid ${BRAND_GREEN_LIGHT}`,
};

const priceLabel: React.CSSProperties = {
  fontSize: "13px",
  color: "#6b7280",
  margin: "0 0 4px 0",
};

const priceAmount: React.CSSProperties = {
  fontSize: "13px",
  color: "#374151",
  margin: "0 0 4px 0",
  textAlign: "right" as const,
};

const totalLabel: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: "700",
  color: "#0a0a0a",
  margin: "4px 0 0 0",
};

const totalAmountStyle: React.CSSProperties = {
  fontSize: "15px",
  fontWeight: "700",
  color: BRAND_GREEN,
  margin: "4px 0 0 0",
  textAlign: "right" as const,
};

const hr: React.CSSProperties = {
  borderColor: "#e2e9e3",
  margin: "0",
};

const thinHr: React.CSSProperties = {
  borderColor: "#e2e9e3",
  margin: "8px 0",
};

const footer: React.CSSProperties = {
  padding: "24px 32px",
  backgroundColor: "#f9fafb",
};

const footerText: React.CSSProperties = {
  fontSize: "12px",
  color: "#9ca3af",
  margin: "0 0 4px 0",
  textAlign: "center" as const,
};

const footerLink: React.CSSProperties = {
  color: BRAND_GREEN,
};
