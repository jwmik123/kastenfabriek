import { describe, it, expect } from "vitest";
import { inlineOrderImages } from "../inline-images";
import type { ClosetOrderLine, OrderLine, ProductOrderLine } from "@/lib/order/types";
import type { ClosetConfigSnapshot, PriceSnapshot } from "@/lib/cart/types";

const JPEG_BASE64 = "/9j/4AAQSkZJRgABAQAAAQABAAD";
const dataUri = `data:image/jpeg;base64,${JPEG_BASE64}`;

const closet = (o: Partial<ClosetOrderLine> = {}): ClosetOrderLine => ({
  kind: "closet",
  configuration: {} as ClosetConfigSnapshot,
  priceSnapshot: {} as PriceSnapshot,
  quantity: 1,
  screenshotClosedUrl: dataUri,
  screenshotOpenUrl: dataUri,
  ...o,
});

const product: ProductOrderLine = {
  kind: "product",
  configuration: {} as ProductOrderLine["configuration"],
  priceSnapshot: {} as ProductOrderLine["priceSnapshot"],
  quantity: 1,
};

describe("inlineOrderImages", () => {
  it("moves a data: capture out of the body and references it by cid", () => {
    const { items, attachments } = inlineOrderImages([closet()]);
    const line = items[0] as ClosetOrderLine;

    expect(line.screenshotClosedUrl).toBe("cid:kast-1-dicht@kastenfabriek");
    expect(line.screenshotOpenUrl).toBe("cid:kast-1-open@kastenfabriek");
    expect(attachments).toEqual([
      {
        filename: "kast-1-dicht.jpg",
        content: JPEG_BASE64,
        contentType: "image/jpeg",
        contentId: "kast-1-dicht@kastenfabriek",
      },
      {
        filename: "kast-1-open.jpg",
        content: JPEG_BASE64,
        contentType: "image/jpeg",
        contentId: "kast-1-open@kastenfabriek",
      },
    ]);
  });

  it("strips the base64 payload from the body entirely", () => {
    const { items } = inlineOrderImages([closet()]);
    expect(JSON.stringify(items)).not.toContain(JPEG_BASE64);
  });

  it("gives every cabinet its own content ids", () => {
    const { items, attachments } = inlineOrderImages([closet(), closet()]);
    expect((items[1] as ClosetOrderLine).screenshotClosedUrl).toBe(
      "cid:kast-2-dicht@kastenfabriek",
    );
    expect(new Set(attachments.map((a) => a.contentId)).size).toBe(4);
  });

  it("leaves an already hosted image alone", () => {
    const url = "https://cdn.example.com/kast.jpg";
    const { items, attachments } = inlineOrderImages([
      closet({ screenshotClosedUrl: url, screenshotOpenUrl: undefined }),
    ]);
    expect((items[0] as ClosetOrderLine).screenshotClosedUrl).toBe(url);
    expect(attachments).toHaveLength(0);
  });

  it("handles lines without captures and non-closet lines", () => {
    const lines: OrderLine[] = [
      closet({ screenshotClosedUrl: undefined, screenshotOpenUrl: undefined }),
      product,
    ];
    const { items, attachments } = inlineOrderImages(lines);
    expect(attachments).toHaveLength(0);
    expect(items).toEqual(lines);
  });

  it("keeps the file extension in step with the content type", () => {
    const { attachments } = inlineOrderImages([
      closet({
        screenshotClosedUrl: `data:image/png;base64,${JPEG_BASE64}`,
        screenshotOpenUrl: undefined,
      }),
    ]);
    expect(attachments[0]).toMatchObject({ filename: "kast-1-dicht.png", contentType: "image/png" });
  });

  it("does not mutate the lines it was given", () => {
    const line = closet();
    inlineOrderImages([line]);
    expect(line.screenshotClosedUrl).toBe(dataUri);
  });
});
