import {
  Circle,
  Document,
  G,
  Image,
  Line,
  Page,
  Rect,
  StyleSheet,
  Svg,
  Text,
  View,
  Text as SvgText,
} from "@react-pdf/renderer";
import {
  buildClosetSpec,
  describeModule,
  plural,
  type ClosetSpec,
  type SpecSection,
} from "@/lib/order/closet-spec";
import { buildWireframe, type LineWeight, type WireframeDrawing } from "@/lib/order/wireframe";
import {
  describeProductLine,
  formatAddressLines,
  type OrderDocumentProps,
  type ClosetOrderLine,
  type ProductOrderLine,
} from "@/lib/order/types";
import { getDeliveryWindow } from "@/lib/delivery-window";
import { CONTACT_EMAIL } from "@/lib/configurators";

/**
 * The order specification sheet, sent to the customer and to ourselves.
 *
 * Every cabinet gets a front elevation with the doors left off and the
 * measurements written next to the lines, followed by the full written spec —
 * per section, so a wasmachinekast's lage kast is on the sheet too.
 */

const BRAND_GREEN = "#34463a";
const BRAND_LIGHT = "#e2e9e3";
const INK = "#111827";
const MUTED = "#6b7280";

const PAGE_CONTENT_WIDTH = 515;
/** Keeps drawing + written spec + prices of one cabinet on a single page. */
const DRAWING_MAX_HEIGHT = 200;

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 48,
    paddingHorizontal: 40,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: INK,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottomWidth: 1.5,
    borderBottomColor: BRAND_GREEN,
    paddingBottom: 8,
    marginBottom: 16,
  },
  brand: { fontSize: 16, fontFamily: "Helvetica-Bold", color: BRAND_GREEN },
  docTitle: { fontSize: 9, color: MUTED, textTransform: "uppercase", letterSpacing: 1 },
  metaRow: { flexDirection: "row", marginBottom: 18 },
  metaCell: { flexGrow: 1, flexBasis: 0, paddingRight: 10 },
  metaLabel: { fontSize: 7, color: MUTED, textTransform: "uppercase", letterSpacing: 0.6, marginBottom: 2 },
  metaValue: { fontSize: 9.5, fontFamily: "Helvetica-Bold" },
  itemBlock: { marginBottom: 20 },
  itemTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: BRAND_GREEN,
    marginBottom: 2,
  },
  itemSub: { fontSize: 8.5, color: MUTED, marginBottom: 10 },
  sectionHeading: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: BRAND_GREEN,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginTop: 9,
    marginBottom: 4,
  },
  detailRow: { flexDirection: "row", marginBottom: 3 },
  detailLabel: { width: 95, color: MUTED },
  detailValue: { flexGrow: 1, flexBasis: 0 },
  note: { fontSize: 8, color: MUTED },
  tableHeader: {
    flexDirection: "row",
    borderBottomWidth: 0.7,
    borderBottomColor: BRAND_GREEN,
    paddingBottom: 3,
    marginBottom: 3,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.4,
    borderBottomColor: BRAND_LIGHT,
    paddingVertical: 2.5,
  },
  cellNum: { width: 26 },
  cellName: { width: 120 },
  cellDesc: { flexGrow: 1, flexBasis: 0 },
  priceRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 1.5 },
  priceTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 0.7,
    borderTopColor: BRAND_GREEN,
    marginTop: 3,
    paddingTop: 3,
  },
  bold: { fontFamily: "Helvetica-Bold" },
  summaryBox: {
    backgroundColor: "#f7f9f7",
    borderWidth: 0.5,
    borderColor: BRAND_LIGHT,
    borderRadius: 4,
    padding: 10,
    marginTop: 6,
  },
  footer: {
    position: "absolute",
    bottom: 22,
    left: 40,
    right: 40,
    fontSize: 7.5,
    color: MUTED,
    textAlign: "center",
  },
  drawingCaption: { fontSize: 7.5, color: MUTED, marginTop: 4 },
  captureRow: { flexDirection: "row", gap: 8 },
  captureCell: { flexGrow: 1, flexBasis: 0 },
  capture: {
    width: "100%",
    maxHeight: 150,
    objectFit: "contain",
    borderWidth: 0.5,
    borderColor: BRAND_LIGHT,
    borderRadius: 3,
  },
  captureCaption: { fontSize: 7, color: MUTED, marginTop: 2, textAlign: "center" },
});

const STROKE: Record<LineWeight, { color: string; width: number }> = {
  outline: { color: INK, width: 0.9 },
  panel: { color: "#374151", width: 0.5 },
  interior: { color: "#9ca3af", width: 0.3 },
  dimension: { color: BRAND_GREEN, width: 0.25 },
};

/**
 * Point size the dimension labels should end up at on paper. The drawing is in
 * centimetres, so the font size in drawing units is divided by the scale —
 * otherwise a wide cabinet scales its own measurements down to unreadable.
 */
const LABEL_PT = { normal: 6.5, small: 5.5 };

function formatPrice(euros: number): string {
  return `EUR ${new Intl.NumberFormat("nl-NL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(euros)}`;
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

// ---------------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------------

const fitScale = (d: WireframeDrawing) =>
  Math.min(PAGE_CONTENT_WIDTH / d.viewWidth, DRAWING_MAX_HEIGHT / d.viewHeight);

/**
 * Build the drawing twice: once to learn the scale it fits at, then again with
 * the label height that scale implies. Label spacing is fixed on paper while
 * the drawing scale is not, so a single pass has the text of a wide cabinet
 * running through its own carcass.
 */
export function drawingFor(c: Parameters<typeof buildWireframe>[0]): WireframeDrawing {
  const probe = buildWireframe(c);
  return buildWireframe(c, { labelHeightCm: LABEL_PT.normal / fitScale(probe) });
}

function Wireframe({ drawing }: { drawing: WireframeDrawing }) {
  const scale = fitScale(drawing);
  const width = drawing.viewWidth * scale;
  const height = drawing.viewHeight * scale;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${drawing.viewWidth} ${drawing.viewHeight}`}>
      {drawing.lines.map((l, i) => (
        <Line
          key={`l${i}`}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          strokeWidth={STROKE[l.weight].width}
          stroke={STROKE[l.weight].color}
        />
      ))}
      {drawing.circles.map((c, i) => (
        <Circle
          key={`c${i}`}
          cx={c.cx}
          cy={c.cy}
          r={c.r}
          stroke={STROKE.interior.color}
          strokeWidth={STROKE.interior.width}
        />
      ))}
      {drawing.labels.map((l, i) => {
        const fontSize = LABEL_PT[l.size] / scale;
        // Knock a hole in whatever sits behind the text, so a carcass or
        // dimension line can never be read as part of a number.
        const w = l.text.length * fontSize * 0.58;
        const body = (
          <>
            <Rect
              x={l.x - w / 2}
              y={l.y - fontSize * 0.82}
              width={w}
              height={fontSize * 1.1}
              fill="#ffffff"
            />
            <SvgText
              x={l.x}
              y={l.y}
              textAnchor={l.anchor}
              fill={BRAND_GREEN}
              style={{ fontSize, fontFamily: "Helvetica" }}
            >
              {l.text}
            </SvgText>
          </>
        );
        return (
          <G key={`t${i}`} transform={l.rotate ? `rotate(${l.rotate}, ${l.x}, ${l.y})` : undefined}>
            {body}
          </G>
        );
      })}
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Blocks
// ---------------------------------------------------------------------------

function ModuleTable({ section }: { section: SpecSection }) {
  return (
    <View>
      <Text style={styles.sectionHeading}>
        Indeling {section.label ? `— ${section.label} ` : ""}({section.widthCm} × {section.heightCm}{" "}
        cm · {plural(section.moduleCount, "module", "modules")})
      </Text>
      <View style={styles.tableHeader}>
        <Text style={[styles.cellNum, styles.bold]}>#</Text>
        <Text style={[styles.cellName, styles.bold]}>Module</Text>
        <Text style={[styles.cellDesc, styles.bold]}>Uitvoering</Text>
      </View>
      {section.modules.map((m) => (
        <View key={m.slotIndex} style={styles.tableRow} wrap={false}>
          <Text style={styles.cellNum}>{m.position}</Text>
          <Text style={styles.cellName}>{m.layoutName ?? "— leeg —"}</Text>
          <Text style={styles.cellDesc}>{describeModule(m)}</Text>
        </View>
      ))}
    </View>
  );
}

/**
 * The two 3D captures from the configurator, straight from the snapshot's
 * data: URIs — the same look the customer configured, next to the technical
 * drawing. Skipped entirely for old orders without captures.
 */
function CaptureRow({ closedUrl, openUrl }: { closedUrl?: string; openUrl?: string }) {
  const shots = [
    { url: closedUrl, caption: "Deuren dicht" },
    { url: openUrl, caption: "Deuren open" },
  ].filter((sh): sh is { url: string; caption: string } =>
    Boolean(sh.url && (sh.url.startsWith("data:image/") || sh.url.startsWith("https://"))),
  );
  if (shots.length === 0) return null;

  return (
    <>
      <Text style={styles.sectionHeading}>3D-weergave</Text>
      <View style={styles.captureRow}>
        {shots.map((sh) => (
          <View key={sh.caption} style={styles.captureCell}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf Image, geen HTML img */}
            <Image src={sh.url} style={styles.capture} />
            <Text style={styles.captureCaption}>{sh.caption}</Text>
          </View>
        ))}
      </View>
    </>
  );
}

function ClosetBlock({
  line,
  index,
  total,
}: {
  line: ClosetOrderLine;
  index: number;
  total: number;
}) {
  const spec: ClosetSpec = buildClosetSpec(line.configuration, line.priceSnapshot);
  const drawing = drawingFor(line.configuration);

  // `break` puts every cabinet on its own page, so a drawing is never separated
  // from the specs that go with it.
  return (
    <View style={styles.itemBlock} break>
      <Text style={styles.itemTitle}>
        {total > 1 ? `${index + 1}. ` : ""}
        {spec.title}
      </Text>
      <Text style={styles.itemSub}>
        Aantal: {line.quantity} · Diepte: {spec.depthCm} cm
      </Text>

      <CaptureRow closedUrl={line.screenshotClosedUrl} openUrl={line.screenshotOpenUrl} />

      <Text style={styles.sectionHeading}>Vooraanzicht (zonder deuren)</Text>
      <Wireframe drawing={drawing} />
      <Text style={styles.drawingCaption}>
        Maten in cm. Buitenmaten en modulebreedtes zijn exact
        {drawing.hasSchematicInteriors
          ? "; de indeling van een of meer modules is schematisch"
          : "; de indeling volgt de 3D-configuratie"}
        .
      </Text>

      <Text style={styles.sectionHeading}>Specificaties</Text>
      {spec.details.map((d) => (
        <View key={d.label} style={styles.detailRow} wrap={false}>
          <Text style={styles.detailLabel}>{d.label}</Text>
          <View style={styles.detailValue}>
            <Text>{d.value}</Text>
            {d.notes?.map((n) => (
              <Text key={n} style={styles.note}>
                {n}
              </Text>
            ))}
          </View>
        </View>
      ))}
      {spec.extras.length > 0 && (
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Extra&apos;s</Text>
          <Text style={styles.detailValue}>{spec.extras.join(" · ")}</Text>
        </View>
      )}

      {spec.sections.map((section) => (
        <ModuleTable key={section.key} section={section} />
      ))}

      <Text style={styles.sectionHeading}>Prijsopbouw</Text>
      {spec.priceRows.map((r) => (
        <View key={r.label} style={styles.priceRow}>
          <Text>{r.label}</Text>
          <Text>{formatPrice(r.amount)}</Text>
        </View>
      ))}
      <View style={styles.priceTotalRow}>
        <Text style={styles.bold}>
          Subtotaal product{line.quantity > 1 ? ` (× ${line.quantity})` : ""}
        </Text>
        <Text style={styles.bold}>{formatPrice(spec.subtotal * line.quantity)}</Text>
      </View>
    </View>
  );
}

function ProductBlock({
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
    <View style={styles.itemBlock} break>
      <Text style={styles.itemTitle}>
        {total > 1 ? `${index + 1}. ` : ""}
        {c.productName}
      </Text>
      <Text style={styles.itemSub}>Aantal: {line.quantity}</Text>
      <Text style={styles.sectionHeading}>Specificaties</Text>
      {describeProductLine(c).map((l) => (
        <Text key={l}>{l}</Text>
      ))}
      <Text style={styles.sectionHeading}>Prijsopbouw</Text>
      <View style={styles.priceRow}>
        <Text>Stuksprijs</Text>
        <Text>{formatPrice(p.unitPrice)}</Text>
      </View>
      {p.materialSurcharge > 0 && (
        <View style={styles.priceRow}>
          <Text>Materiaal-toeslag</Text>
          <Text>{formatPrice(p.materialSurcharge)}</Text>
        </View>
      )}
      <View style={styles.priceTotalRow}>
        <Text style={styles.bold}>
          Subtotaal product{line.quantity > 1 ? ` (× ${line.quantity})` : ""}
        </Text>
        <Text style={styles.bold}>{formatPrice(p.total * line.quantity)}</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Document
// ---------------------------------------------------------------------------

export default function OrderSpecPdf({
  orderNumber,
  orderDate,
  customerEmail,
  shippingAddress,
  items,
  summary,
}: OrderDocumentProps) {
  return (
    <Document
      title={`Specificaties ${orderNumber} — Kastenfabriek`}
      author="Kastenfabriek"
      subject={`Bestelling ${orderNumber}`}
    >
      <Page size="A4" style={styles.page}>
        <View style={styles.header} fixed>
          <Text style={styles.brand}>Kastenfabriek</Text>
          <Text style={styles.docTitle}>Specificatieblad</Text>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Bestelnummer</Text>
            <Text style={styles.metaValue}>{orderNumber}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Besteldatum</Text>
            <Text style={styles.metaValue}>{formatDate(orderDate)}</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Geschatte aankomst</Text>
            <Text style={styles.metaValue}>{getDeliveryWindow(orderDate)}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Bezorgadres</Text>
            {formatAddressLines(shippingAddress).map((l) => (
              <Text key={l}>{l}</Text>
            ))}
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaLabel}>Contact</Text>
            <Text>{customerEmail}</Text>
          </View>
        </View>

        {/* Money first, on the cover page; every product then gets its own page. */}
        <View style={styles.summaryBox} wrap={false}>
          <Text style={[styles.sectionHeading, { marginTop: 0 }]}>Totaaloverzicht</Text>
          <View style={styles.priceRow}>
            <Text>Producten</Text>
            <Text>{formatPrice(summary.lineSubtotal)}</Text>
          </View>
          <View style={styles.priceRow}>
            <Text>Bezorging</Text>
            <Text>{formatPrice(summary.delivery)}</Text>
          </View>
          {summary.installationGross > 0 && (
            <View style={styles.priceRow}>
              <Text>
                Montage
                {summary.installationTierName ? ` (${summary.installationTierName})` : ""}
              </Text>
              <Text>{formatPrice(summary.installationGross)}</Text>
            </View>
          )}
          {summary.freeMontageDiscount > 0 && (
            <View style={styles.priceRow}>
              <Text>Gratis montage</Text>
              <Text>-{formatPrice(summary.freeMontageDiscount)}</Text>
            </View>
          )}
          {summary.discount > 0 && (
            <View style={styles.priceRow}>
              <Text>Korting{summary.discountCode ? ` (${summary.discountCode})` : ""}</Text>
              <Text>-{formatPrice(summary.discount)}</Text>
            </View>
          )}
          <View style={styles.priceTotalRow}>
            <Text style={styles.bold}>Totaal betaald</Text>
            <Text style={styles.bold}>{formatPrice(summary.total)}</Text>
          </View>
        </View>

        {items.map((line, i) =>
          line.kind === "closet" ? (
            <ClosetBlock key={i} line={line} index={i} total={items.length} />
          ) : (
            <ProductBlock key={i} line={line} index={i} total={items.length} />
          ),
        )}

        <Text style={styles.footer} fixed>
          Kastenfabriek · {CONTACT_EMAIL} · Specificaties bij bestelling {orderNumber}
        </Text>
      </Page>
    </Document>
  );
}
