import { describe, expect, test, vi } from "vitest";
import { generatePaymentQr } from "./qr";
import { buildVietQrPayload } from "./vietqr";
import type { Member, SettlementPayment } from "../domain/types";

const receiver: Member = {
  id: "alvin",
  name: "Alvin",
  active: true,
  payment: {
    bankName: "Techcombank",
    bankCode: "TCB",
    accountNumber: "19036666",
    accountHolder: "ALVIN",
  },
};
const payment: SettlementPayment = {
  fromMemberId: "duy",
  toMemberId: "alvin",
  amountMinor: 820_000,
};

describe("generatePaymentQr offline", () => {
  test("never calls the network", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    await generatePaymentQr(receiver, payment);
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
  });
  test("produces a data URL", async () => {
    const url = await generatePaymentQr(receiver, payment);
    expect(url.startsWith("data:image/")).toBe(true);
  });
  test("payload encodes the amount and BIN for Techcombank", () => {
    const payload = buildVietQrPayload({
      bankBin: "970407",
      accountNumber: "19036666",
      amount: 820_000,
    });
    expect(payload).toContain("970407");
    expect(payload).toContain("820000");
  });
});
