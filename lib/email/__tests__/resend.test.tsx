import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSend = vi.hoisted(() => vi.fn().mockResolvedValue({ data: { id: "email_1" } }));

vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(function () {
    return { emails: { send: mockSend } };
  }),
}));

// Echo the screenshot srcs back so a test can assert what ended up in the body.
vi.mock("@react-email/components", () => ({
  render: vi.fn(async (el: { props: { items: unknown[] } }) =>
    `<html>${JSON.stringify(el.props.items)}</html>`,
  ),
}));

vi.mock("@react-pdf/renderer", () => ({
  renderToBuffer: vi.fn().mockResolvedValue(Buffer.from("%PDF-fake")),
}));

// The mail components only matter to the mocked renderers above.
vi.mock("@/emails/OrderConfirmation", () => ({ default: () => null }));
vi.mock("@/emails/OrderAdminNotification", () => ({ default: () => null }));
vi.mock("@/emails/OrderSpecPdf", () => ({ default: () => null }));
vi.mock("@/emails/SampleRequestConfirmation", () => ({ default: () => null }));
vi.mock("@/emails/SampleRequestAdminNotification", () => ({ default: () => null }));

import { sendOrderEmails } from "../resend";
import { CONTACT_EMAIL } from "@/lib/configurators";
import { buildOrderSummary } from "@/lib/order/order-summary";
import type { OrderDocumentProps } from "@/lib/order/types";

const props: OrderDocumentProps = {
  orderNumber: "ORD-1",
  orderDate: new Date("2026-01-01"),
  customerEmail: "klant@example.com",
  shippingAddress: {
    firstName: "Sam",
    lastName: "de Vries",
    street: "Kastenlaan",
    houseNumber: "12",
    postalCode: "1234AB",
    city: "Amsterdam",
    country: "NL",
  },
  items: [],
  summary: buildOrderSummary([]),
};

const customerCall = () => mockSend.mock.calls.find((c) => c[0].to === "klant@example.com")![0];
const adminCall = () => mockSend.mock.calls.find((c) => c[0].to !== "klant@example.com")![0];

beforeEach(() => {
  mockSend.mockClear();
});

describe("sendOrderEmails", () => {
  it("sends one mail to the customer and one to us", async () => {
    await sendOrderEmails(props);
    expect(mockSend).toHaveBeenCalledTimes(2);
  });

  it("sends from a domain that is verified in Resend, not the test domain", async () => {
    await sendOrderEmails(props);
    for (const call of mockSend.mock.calls) {
      expect(call[0].from).toContain("@kasten-fabriek.nl");
      expect(call[0].from).not.toContain("resend.dev");
    }
  });

  it("points customer replies at an address we actually read", async () => {
    await sendOrderEmails(props);
    expect(customerCall().replyTo).toBe(CONTACT_EMAIL);
  });

  it("lets us reply straight to the customer from the admin mail", async () => {
    await sendOrderEmails(props);
    expect(adminCall().replyTo).toBe("klant@example.com");
    expect(adminCall().subject).toContain("Nieuwe bestelling");
  });

  it("attaches the same spec PDF to both mails", async () => {
    await sendOrderEmails(props);
    for (const call of mockSend.mock.calls) {
      expect(call[0].attachments).toEqual([
        {
          filename: "Specificaties-ORD-1.pdf",
          content: Buffer.from("%PDF-fake").toString("base64"),
          contentType: "application/pdf",
        },
      ]);
    }
  });

  it("references the 3D captures by cid and ships the bytes as attachments", async () => {
    const base64 = "A".repeat(120_000);
    await sendOrderEmails({
      ...props,
      items: [
        {
          kind: "closet",
          configuration: {} as never,
          priceSnapshot: {} as never,
          quantity: 1,
          screenshotClosedUrl: `data:image/jpeg;base64,${base64}`,
          screenshotOpenUrl: `data:image/jpeg;base64,${base64}`,
        },
      ],
    });

    for (const call of mockSend.mock.calls) {
      // Gmail refuses data: URIs and clips a body over ~102 KB, cutting the
      // HTML mid-tag. Neither may come back.
      expect(call[0].html).not.toContain("data:image");
      expect(call[0].html).toContain("cid:kast-1-dicht@kastenfabriek");
      expect(call[0].html.length).toBeLessThan(102_400);

      const inline = call[0].attachments.filter((a: { contentId?: string }) => a.contentId);
      expect(inline).toHaveLength(2);
      expect(inline[0].content).toBe(base64);
    }
  });

  it("reports a failure instead of swallowing it, and still sends the other mail", async () => {
    mockSend
      .mockRejectedValueOnce(new Error("resend down"))
      .mockResolvedValueOnce({ data: { id: "email_2" } });

    await expect(sendOrderEmails(props)).rejects.toThrow(/1 of 2 order emails/);
    expect(mockSend).toHaveBeenCalledTimes(2);
  });
});
