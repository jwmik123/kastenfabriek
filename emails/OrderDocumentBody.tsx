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
import {
  buildClosetSpec,
  describeModule,
  plural,
  type SpecSection,
} from "@/lib/order/closet-spec";
import {
  describeProductLine,
  formatAddressLines,
  type ClosetOrderLine,
  type OrderDocumentProps,
  type ProductOrderLine,
} from "@/lib/order/types";
import { getDeliveryWindow } from "@/lib/delivery-window";

/**
 * The shared body of both order emails.
 *
 * Customer and admin get the same specification — the same one that is in the
 * attached PDF — so there is one description of an order, not three. Only the
 * framing (intro copy, contact block) differs by variant.
 */

export type OrderEmailVariant = "customer" | "admin";

const BRAND_GREEN = "#34463a";
const BRAND_GREEN_LIGHT = "#e2e9e3";

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

export default function OrderDocumentBody({
  variant,
  orderNumber,
  orderDate,
  customerEmail,
  shippingAddress,
  items,
  summary,
}: OrderDocumentProps & { variant: OrderEmailVariant }) {
  const isAdmin = variant === "admin";
  const preview = isAdmin
    ? `Nieuwe bestelling ${orderNumber} — ${formatPrice(summary.total)}`
    : `Bevestiging van bestelling ${orderNumber} — Kastenfabriek`;

  return (
    <Html lang="nl">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={header}>
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

          <Section style={section}>
            <Heading as="h2" style={h2}>
              {isAdmin ? "Nieuwe bestelling" : "Bedankt voor je bestelling!"}
            </Heading>
            {isAdmin ? (
              <>
                <Text style={text}>
                  {shippingAddress.firstName} {shippingAddress.lastName} heeft
                  zojuist besteld voor {formatPrice(summary.total)}.
                </Text>
                <Text style={text}>
                  De volledige specificaties zitten hieronder en in de bijgevoegde
                  PDF, inclusief het vooraanzicht met maatvoering.
                </Text>
              </>
            ) : (
              <>
                <Text style={text}>Beste {shippingAddress.firstName},</Text>
                <Text style={text}>
                  We hebben je bestelling ontvangen en gaan er meteen mee aan de
                  slag. Hieronder vind je het overzicht. In de bijlage zit een PDF
                  met alle specificaties en een technische tekening van je kast.
                </Text>
              </>
            )}
          </Section>

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

          {items.map((item, i) =>
            item.kind === "closet" ? (
              <ClosetLine key={i} line={item} index={i} total={items.length} />
            ) : (
              <ProductLine key={i} line={item} index={i} total={items.length} />
            ),
          )}

          {/* Order-level costs: delivery is one shipment and the coupon applies
              to the order, so both are counted exactly once here. */}
          <Section style={{ ...section, backgroundColor: BRAND_GREEN_LIGHT }}>
            <Heading as="h4" style={h4}>Totaaloverzicht</Heading>
            <SummaryRow label="Producten" amount={formatPrice(summary.lineSubtotal)} />
            <SummaryRow label="Bezorging" amount={formatPrice(summary.delivery)} />
            {summary.installationGross > 0 && (
              <SummaryRow
                label={`Montage${summary.installationTierName ? ` (${summary.installationTierName})` : ""}`}
                amount={formatPrice(summary.installationGross)}
              />
            )}
            {summary.freeMontageDiscount > 0 && (
              <SummaryRow
                label="Gratis montage"
                amount={`-${formatPrice(summary.freeMontageDiscount)}`}
              />
            )}
            {summary.discount > 0 && (
              <SummaryRow
                label={`Korting${summary.discountCode ? ` (${summary.discountCode})` : ""}`}
                amount={`-${formatPrice(summary.discount)}`}
              />
            )}
            <Hr style={thinHr} />
            <table width="100%" cellPadding="0" cellSpacing="0">
              <tr>
                <td><Text style={{ ...totalLabel, fontSize: "17px" }}>Totaal betaald</Text></td>
                <td style={{ textAlign: "right" }}>
                  <Text style={{ ...totalAmountStyle, fontSize: "17px" }}>{formatPrice(summary.total)}</Text>
                </td>
              </tr>
            </table>
          </Section>

          <Hr style={hr} />

          <Section style={section}>
            <Heading as="h3" style={h3}>{isAdmin ? "Klant & bezorgadres" : "Bezorgadres"}</Heading>
            {formatAddressLines(shippingAddress).map((line) => (
              <Text key={line} style={text}>{line}</Text>
            ))}
            {isAdmin && <Text style={text}>{customerEmail}</Text>}
          </Section>

          <Hr style={hr} />

          <Section style={footer}>
            {isAdmin ? (
              <Text style={footerText}>Automatisch verstuurd na een geslaagde betaling.</Text>
            ) : (
              <Text style={footerText}>
                Vragen over je bestelling? Mail ons op{" "}
                <a href="mailto:info@kastenfabriek.nl" style={footerLink}>
                  info@kastenfabriek.nl
                </a>
              </Text>
            )}
            <Text style={footerText}>© {orderDate.getFullYear()} Kastenfabriek</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

function SummaryRow({ label: rowLabel, amount }: { label: string; amount: string }) {
  return (
    <table width="100%" cellPadding="0" cellSpacing="0">
      <tr>
        <td><Text style={priceLabel}>{rowLabel}</Text></td>
        <td style={{ textAlign: "right" }}><Text style={priceAmount}>{amount}</Text></td>
      </tr>
    </table>
  );
}

function ClosetLine({
  line,
  index,
  total,
}: {
  line: ClosetOrderLine;
  index: number;
  total: number;
}) {
  const spec = buildClosetSpec(line.configuration, line.priceSnapshot);
  const multiSection = spec.sections.length > 1;

  return (
    <Section style={itemSection}>
      <Heading as="h3" style={h3}>
        {total > 1 ? `${index + 1}. ` : ""}
        {spec.title}
      </Heading>

      {(line.screenshotClosedUrl || line.screenshotOpenUrl) && (
        <Row style={{ marginBottom: "16px" }}>
          {line.screenshotClosedUrl && (
            <Column style={{ paddingRight: line.screenshotOpenUrl ? "6px" : "0" }}>
              <Img src={line.screenshotClosedUrl} alt="Deuren dicht" style={screenshot} />
            </Column>
          )}
          {line.screenshotOpenUrl && (
            <Column style={{ paddingLeft: line.screenshotClosedUrl ? "6px" : "0" }}>
              <Img src={line.screenshotOpenUrl} alt="Deuren open" style={screenshot} />
            </Column>
          )}
        </Row>
      )}

      <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginTop: "16px" }}>
        {spec.details.map((d) => (
          <tr key={d.label}>
            <td style={detailLabel}><Text style={label}>{d.label}</Text></td>
            <td>
              <Text style={value}>{d.value}</Text>
              {d.notes?.map((n) => (
                <Text key={n} style={featureText}>{n}</Text>
              ))}
            </td>
          </tr>
        ))}
        {spec.extras.length > 0 && (
          <tr>
            <td style={detailLabel}><Text style={label}>Extra&apos;s</Text></td>
            <td>
              {spec.extras.map((e) => (
                <Text key={e} style={featureText}>{e}</Text>
              ))}
            </td>
          </tr>
        )}
        {line.quantity > 1 && (
          <tr>
            <td style={detailLabel}><Text style={label}>Aantal</Text></td>
            <td><Text style={value}>{line.quantity}</Text></td>
          </tr>
        )}
      </table>

      {/* Every section, so the lage kast of a wasmachinekast is listed too. */}
      {spec.sections.map((s) => (
        <ModuleList key={s.key} section={s} showLabel={multiSection} />
      ))}

      <Section style={priceSection}>
        <Heading as="h4" style={h4}>Prijsopbouw</Heading>
        {spec.priceRows.map((row) => (
          <table key={row.label} width="100%" cellPadding="0" cellSpacing="0">
            <tr>
              <td><Text style={priceLabel}>{row.label}</Text></td>
              <td style={{ textAlign: "right" }}><Text style={priceAmount}>{formatPrice(row.amount)}</Text></td>
            </tr>
          </table>
        ))}
        <Hr style={thinHr} />
        <table width="100%" cellPadding="0" cellSpacing="0">
          <tr>
            <td>
              <Text style={totalLabel}>
                Subtotaal{line.quantity > 1 ? ` (× ${line.quantity})` : ""}
              </Text>
            </td>
            <td style={{ textAlign: "right" }}>
              <Text style={totalAmountStyle}>{formatPrice(spec.subtotal * line.quantity)}</Text>
            </td>
          </tr>
        </table>
      </Section>
    </Section>
  );
}

function ModuleList({ section, showLabel }: { section: SpecSection; showLabel: boolean }) {
  return (
    <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginTop: "4px" }}>
      <tr>
        <td style={detailLabel}>
          <Text style={label}>{showLabel ? section.label : "Indeling"}</Text>
        </td>
        <td>
          <Text style={value}>
            {plural(section.moduleCount, "module", "modules")} · {section.widthCm} ×{" "}
            {section.heightCm} cm
          </Text>
          {section.modules.map((m) => (
            <Text key={m.slotIndex} style={featureText}>
              {m.position}. {m.layoutName ?? "— leeg —"}
              {describeModule(m) ? ` · ${describeModule(m)}` : ""}
            </Text>
          ))}
        </td>
      </tr>
    </table>
  );
}

function ProductLine({
  line,
  index,
  total,
}: {
  line: ProductOrderLine;
  index: number;
  total: number;
}) {
  const c = line.configuration;
  const p = line.priceSnapshot;
  return (
    <Section style={itemSection}>
      <Heading as="h3" style={h3}>
        {total > 1 ? `${index + 1}. ` : ""}
        {c.productName} — {c.widthLabel ?? `${c.widthCm} cm`} × {c.heightCm} cm
      </Heading>
      <table width="100%" cellPadding="0" cellSpacing="0" style={{ marginTop: "8px" }}>
        {describeProductLine(c).map((l) => {
          const [k, ...rest] = l.split(": ");
          return (
            <tr key={l}>
              <td style={detailLabel}><Text style={label}>{k}</Text></td>
              <td><Text style={value}>{rest.join(": ")}</Text></td>
            </tr>
          );
        })}
        <tr>
          <td style={detailLabel}><Text style={label}>Aantal</Text></td>
          <td><Text style={value}>{line.quantity}</Text></td>
        </tr>
      </table>
      <Section style={priceSection}>
        <Heading as="h4" style={h4}>Prijsopbouw</Heading>
        <SummaryRow label="Stuksprijs" amount={formatPrice(p.unitPrice)} />
        {p.materialSurcharge > 0 && (
          <SummaryRow label="Materiaal-toeslag" amount={formatPrice(p.materialSurcharge)} />
        )}
        <Hr style={thinHr} />
        <table width="100%" cellPadding="0" cellSpacing="0">
          <tr>
            <td>
              <Text style={totalLabel}>
                Subtotaal{line.quantity > 1 ? ` (× ${line.quantity})` : ""}
              </Text>
            </td>
            <td style={{ textAlign: "right" }}>
              <Text style={totalAmountStyle}>{formatPrice(p.total * line.quantity)}</Text>
            </td>
          </tr>
        </table>
      </Section>
    </Section>
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
