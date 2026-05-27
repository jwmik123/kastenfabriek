import { MATERIALS } from "@/app/(configurator)/kledingkast/materials";
import type {
  ClosetConfigSnapshot,
  PriceSnapshot,
  ProductConfigSnapshot,
  ProductPriceSnapshot,
} from "@/lib/cart/types";

const fmt = new Intl.NumberFormat("nl-NL", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export type OrderLineSnapshot =
  | {
      kind: "closet";
      configuration: ClosetConfigSnapshot;
      priceSnapshot: PriceSnapshot;
      quantity: number;
    }
  | {
      kind: "product";
      configuration: ProductConfigSnapshot;
      priceSnapshot: ProductPriceSnapshot;
      quantity: number;
    };

function getMaterialName(id: string): string {
  return MATERIALS.find((m) => m.id === id)?.name ?? id;
}

export default function OrderLineItem({ item }: { item: OrderLineSnapshot }) {
  if (item.kind === "product") return <ProductLine item={item} />;
  return <ClosetLine item={item} />;
}

function ProductLine({
  item,
}: {
  item: Extract<OrderLineSnapshot, { kind: "product" }>;
}) {
  const cfg = item.configuration;
  const ps = item.priceSnapshot;
  const lineTotal = (ps.total + ps.deliveryCost) * item.quantity;
  return (
    <div className="border border-gray-100 rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">{cfg.productName}</h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {cfg.widthCm} × {cfg.heightCm} cm · {cfg.materialName} ·{" "}
            {item.quantity} {item.quantity === 1 ? "stuk" : "stuks"}
          </p>
        </div>
        <span className="font-semibold text-gray-900">
          {fmt.format(lineTotal)}
        </span>
      </div>
      <dl className="text-sm text-gray-600 grid grid-cols-2 gap-y-1">
        <dt>Stuksprijs</dt>
        <dd className="text-right">{fmt.format(ps.unitPrice)}</dd>
        {ps.materialSurcharge > 0 && (
          <>
            <dt>Materiaal-toeslag</dt>
            <dd className="text-right">{fmt.format(ps.materialSurcharge)}</dd>
          </>
        )}
        <dt>Bezorging</dt>
        <dd className="text-right">{fmt.format(ps.deliveryCost)}</dd>
      </dl>
    </div>
  );
}

function ClosetLine({
  item,
}: {
  item: Extract<OrderLineSnapshot, { kind: "closet" }>;
}) {
  const c = item.configuration;
  const p = item.priceSnapshot;
  const outerMaterial = getMaterialName(c.buitenkantMaterialId);
  const innerMaterial = getMaterialName(c.binnenkantMaterialId);
  const powerHoleCount = c.modules.filter((m) => m.hasPowerHole).length;
  const sidePanelThickness = c.sidePanelThickness ?? "18mm";
  const sidePanelsUpgraded = sidePanelThickness === "36mm";
  const lineTotal =
    (p.total - (p.discountAmount ?? 0) / 100) * item.quantity;
  return (
    <div className="border border-gray-100 rounded-xl p-5 space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-gray-900">
            Maatwerkkast — {c.widthCm} × {c.heightCm} × {c.depthCm} cm
          </h3>
          <p className="text-sm text-gray-500 mt-0.5">
            {c.placementType === "ingebouwd" ? "Ingebouwd" : "Vrijstaand"} ·{" "}
            {c.moduleCount} modules
          </p>
        </div>
        <span className="font-semibold text-gray-900">
          {fmt.format(lineTotal)}
        </span>
      </div>
      <dl className="text-sm text-gray-600 grid grid-cols-[140px_1fr] gap-y-1">
        <dt>Materialen</dt>
        <dd>
          Buiten: {outerMaterial}
          <br />
          Binnen: {innerMaterial}
        </dd>
        <dt>Handgrepen</dt>
        <dd>
          {c.doorHandleName ??
            (c.doorHandleId === "none"
              ? "Greeploos (push-to-open)"
              : c.doorHandleId)}
        </dd>
        {(c.lightStripsEnabled ||
          powerHoleCount > 0 ||
          c.hasTopCabinet ||
          c.diagonalSide !== "none" ||
          c.backDiagonal ||
          sidePanelsUpgraded) && (
          <>
            <dt>Extra&apos;s</dt>
            <dd>
              {[
                c.lightStripsEnabled && "LED-strips",
                powerHoleCount > 0 && `Kabeldoorvoer (${powerHoleCount}×)`,
                sidePanelsUpgraded && "Zijpanelen 36 mm (upgrade)",
                c.hasTopCabinet &&
                  `Bovenkast (${c.topCabinetHeightCm} cm)`,
                c.diagonalSide !== "none" &&
                  `Schuine wand ${c.diagonalSide === "left" ? "links" : c.diagonalSide === "right" ? "rechts" : c.diagonalSide}`,
                c.backDiagonal && "Schuine achterwand",
              ]
                .filter(Boolean)
                .join(" · ")}
            </dd>
          </>
        )}
      </dl>
      <dl className="border-t border-gray-100 pt-3 text-sm text-gray-600 grid grid-cols-2 gap-y-1">
        <dt>Modules & interieur</dt>
        <dd className="text-right">{fmt.format(p.moduleCost)}</dd>
        {p.doorCost > 0 && (
          <>
            <dt>Deuren</dt>
            <dd className="text-right">{fmt.format(p.doorCost)}</dd>
          </>
        )}
        {p.mechanismCost > 0 && (
          <>
            <dt>Handgrepen</dt>
            <dd className="text-right">{fmt.format(p.mechanismCost)}</dd>
          </>
        )}
        {p.ledCost > 0 && (
          <>
            <dt>LED-strips</dt>
            <dd className="text-right">{fmt.format(p.ledCost)}</dd>
          </>
        )}
        {(p.slopedBackWallSurcharge ?? 0) > 0 && (
          <>
            <dt>Schuine achterwand</dt>
            <dd className="text-right">
              {fmt.format(p.slopedBackWallSurcharge as number)}
            </dd>
          </>
        )}
        {(p.slopedSideWallSurcharge ?? 0) > 0 && (
          <>
            <dt>
              Schuine zijwand
              {c.diagonalSide === "both" ? " (×2)" : ""}
            </dt>
            <dd className="text-right">
              {fmt.format(p.slopedSideWallSurcharge as number)}
            </dd>
          </>
        )}
        {(p.sidePanelCost ?? 0) > 0 && (
          <>
            <dt>Zijpanelen 36 mm (upgrade)</dt>
            <dd className="text-right">
              {fmt.format(p.sidePanelCost as number)}
            </dd>
          </>
        )}
        <dt>Bezorging</dt>
        <dd className="text-right">{fmt.format(p.deliveryCost)}</dd>
        {p.installationCost > 0 && (
          <>
            <dt>
              Montage
              {p.installationTierName ? ` (${p.installationTierName})` : ""}
            </dt>
            <dd className="text-right">{fmt.format(p.installationCost)}</dd>
          </>
        )}
        {p.freeMontageApplied &&
          p.freeMontageDiscount &&
          p.freeMontageDiscount > 0 && (
            <>
              <dt className="text-green-700">Gratis montage</dt>
              <dd className="text-right text-green-700">
                -{fmt.format(p.freeMontageDiscount)}
              </dd>
            </>
          )}
        {p.discountAmount && p.discountAmount > 0 && p.discountCode && (
          <>
            <dt className="text-green-700">Korting ({p.discountCode})</dt>
            <dd className="text-right text-green-700">
              -{fmt.format(p.discountAmount / 100)}
            </dd>
          </>
        )}
      </dl>
    </div>
  );
}
