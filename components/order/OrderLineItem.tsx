import { buildClosetSpec, describeModule, plural } from "@/lib/order/closet-spec";
import { renderClosetWireframeSvg } from "@/lib/order/wireframe-svg";
import {
  describeProductLine,
  PRODUCT_DOOR_TYPE_LABELS,
  type OrderLine,
} from "@/lib/order/types";

const fmt = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export type OrderLineSnapshot = OrderLine;

/**
 * One ordered line. Reads the shared spec so the page describes an order the
 * same way the confirmation email and the PDF do — including both sections of
 * a wasmachinekast.
 *
 * Delivery, montage and coupons are order-level and are shown once by the page,
 * not repeated here.
 */
export default function OrderLineItem({ item }: { item: OrderLine }) {
  if (item.kind === "product") return <ProductLine item={item} />;
  return <ClosetLine item={item} />;
}

function ProductLine({ item }: { item: Extract<OrderLine, { kind: "product" }> }) {
  const cfg = item.configuration;
  const ps = item.priceSnapshot;
  return (
    <div className="border border-gray-100 rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{cfg.productName}</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {PRODUCT_DOOR_TYPE_LABELS[cfg.doorType ?? "deuren"]} ·{" "}
            {cfg.widthLabel ?? `${cfg.widthCm} cm`} × {cfg.heightCm} cm
            {cfg.isVerlengd ? " (verlengd)" : ""} · {item.quantity}{" "}
            {item.quantity === 1 ? "stuk" : "stuks"}
          </p>
        </div>
        <span className="font-semibold text-gray-900">
          {fmt.format(ps.total * item.quantity)}
        </span>
      </div>
      <dl className="text-sm text-gray-600 grid grid-cols-[140px_1fr] gap-y-1">
        {describeProductLine(cfg).map((line) => {
          const [key, ...rest] = line.split(": ");
          return (
            <div key={line} className="contents">
              <dt>{key}</dt>
              <dd>{rest.join(": ")}</dd>
            </div>
          );
        })}
      </dl>
    </div>
  );
}

function ClosetLine({ item }: { item: Extract<OrderLine, { kind: "closet" }> }) {
  const spec = buildClosetSpec(item.configuration, item.priceSnapshot);
  const multiSection = spec.sections.length > 1;

  return (
    <div className="border border-gray-100 rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">{spec.title}</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {item.configuration.placementType === "vrijstaand" ? "Vrijstaand" : "Ingebouwd"}
            {" · "}
            {spec.sections.reduce((sum, s) => sum + s.moduleCount, 0)} modules
            {item.quantity > 1 ? ` · ${item.quantity} stuks` : ""}
          </p>
        </div>
        <span className="font-semibold text-gray-900">
          {fmt.format(spec.subtotal * item.quantity)}
        </span>
      </div>

      {/* Same front elevation as the spec PDF. Every label is generated from
          the snapshot's own numbers, so there is no untrusted markup here. */}
      <div
        className="[&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-72"
        aria-label="Vooraanzicht met maatvoering"
        dangerouslySetInnerHTML={{ __html: renderClosetWireframeSvg(item.configuration) }}
      />

      <dl className="text-sm text-gray-600 grid grid-cols-[140px_1fr] gap-y-1">
        {spec.details.map((d) => (
          <div key={d.label} className="contents">
            <dt>{d.label}</dt>
            <dd>
              {d.value}
              {d.notes?.map((n) => (
                <span key={n} className="block text-gray-500">
                  {n}
                </span>
              ))}
            </dd>
          </div>
        ))}
        {spec.extras.length > 0 && (
          <div className="contents">
            <dt>Extra&apos;s</dt>
            <dd>{spec.extras.join(" · ")}</dd>
          </div>
        )}
      </dl>

      {/* Every section, so a wasmachinekast's lage kast is listed as well. */}
      {spec.sections.map((section) => (
        <dl
          key={section.key}
          className="text-sm text-gray-600 grid grid-cols-[140px_1fr] gap-y-1"
        >
          <dt>{multiSection ? section.label : "Indeling"}</dt>
          <dd>
            <span className="block text-gray-900">
              {plural(section.moduleCount, "module", "modules")} · {section.widthCm} ×{" "}
              {section.heightCm} cm
            </span>
            {section.modules.map((m) => (
              <span key={m.slotIndex} className="block text-gray-500">
                {m.position}. {m.layoutName ?? "— leeg —"}
                {describeModule(m) ? ` · ${describeModule(m)}` : ""}
              </span>
            ))}
          </dd>
        </dl>
      ))}

      <dl className="border-t border-gray-100 pt-3 text-sm text-gray-600 grid grid-cols-2 gap-y-1">
        {spec.priceRows.map((row) => (
          <div key={row.label} className="contents">
            <dt>{row.label}</dt>
            <dd className="text-right">{fmt.format(row.amount)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
