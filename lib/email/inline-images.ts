import type { OrderLine } from "@/lib/order/types";

/**
 * The 3D captures are stored as `data:` URIs — roughly 100 KB of base64 each.
 * That is fine in a browser but breaks in mail:
 *
 * - Gmail refuses to load `data:` URIs in an `<img src>` at all, and
 * - it clips a message body over ~102 KB, cutting the HTML mid-tag, so the
 *   reader ends up looking at a raw `<img …` fragment as text.
 *
 * So the captures move out of the body and become inline attachments: the body
 * keeps a short `cid:` reference and the bytes ride along as a MIME part, which
 * every mail client renders. Anything that is not a `data:` URI (an already
 * hosted image) is left alone.
 */

export interface InlineAttachment {
  filename: string;
  /** Base64, as Resend expects for a `content` string. */
  content: string;
  contentType: string;
  /** Referenced from the HTML as `cid:<contentId>`. */
  contentId: string;
}

export interface InlinedImages {
  /** The same lines, with every `data:` capture swapped for a `cid:` reference. */
  items: OrderLine[];
  attachments: InlineAttachment[];
}

const DATA_URI = /^data:([\w.+-]+\/[\w.+-]+);base64,([\s\S]+)$/;

const EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function inlineOrderImages(items: OrderLine[]): InlinedImages {
  const attachments: InlineAttachment[] = [];

  const swap = (url: string | undefined, name: string): string | undefined => {
    if (!url) return undefined;
    const match = DATA_URI.exec(url);
    if (!match) return url;

    const [, contentType, base64] = match;
    const contentId = `${name}@kastenfabriek`;
    attachments.push({
      filename: `${name}.${EXTENSIONS[contentType] ?? "jpg"}`,
      content: base64,
      contentType,
      contentId,
    });
    return `cid:${contentId}`;
  };

  const mapped = items.map((line, i) => {
    if (line.kind !== "closet") return line;
    const closed = swap(line.screenshotClosedUrl, `kast-${i + 1}-dicht`);
    const open = swap(line.screenshotOpenUrl, `kast-${i + 1}-open`);
    return { ...line, screenshotClosedUrl: closed, screenshotOpenUrl: open };
  });

  return { items: mapped, attachments };
}
