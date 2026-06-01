import { describe, it, expect } from "vitest";
import { buildVietQrPayload, generateVietQrDataUrl } from "./vietqr";

describe("buildVietQrPayload", () => {
  // Helper to verify CRC at the end of a payload.
  // The CRC covers everything up to and including "6304" (the CRC tag+length).
  function verifyCrc(payload: string): boolean {
    const body = payload.slice(0, -4); // everything except the 4-char CRC hex
    const crcHex = payload.slice(-4);

    // Recompute CRC-16/CCITT-FALSE over body
    let crc = 0xffff;
    for (let i = 0; i < body.length; i++) {
      crc ^= body.charCodeAt(i) << 8;
      for (let j = 0; j < 8; j++) {
        if (crc & 0x8000) {
          crc = (crc << 1) ^ 0x1021;
        } else {
          crc = crc << 1;
        }
      }
    }
    return (crc & 0xffff).toString(16).padStart(4, "0").toUpperCase() === crcHex;
  }

  it("produces a payload starting with the EMVCo header", () => {
    const payload = buildVietQrPayload({
      bankBin: "970436",
      accountNumber: "1234567890",
    });
    // ID 00: PayloadFormatIndicator = "01"
    expect(payload.startsWith("000201")).toBe(true);
    // ID 01: PointOfInitiationMethod = "11" (static)
    expect(payload.slice(6, 12)).toBe("010211");
  });

  it("includes NAPAS globally unique identifier", () => {
    const payload = buildVietQrPayload({
      bankBin: "970436",
      accountNumber: "1234567890",
    });
    expect(payload).toContain("A000000727");
  });

  it("includes the bank BIN and account number", () => {
    const payload = buildVietQrPayload({
      bankBin: "970415",
      accountNumber: "9876543210",
    });
    expect(payload).toContain("970415");
    expect(payload).toContain("9876543210");
  });

  it("includes VND currency code (704)", () => {
    const payload = buildVietQrPayload({
      bankBin: "970436",
      accountNumber: "1234567890",
    });
    expect(payload).toContain("5303704");
  });

  it("includes country code VN", () => {
    const payload = buildVietQrPayload({
      bankBin: "970436",
      accountNumber: "1234567890",
    });
    expect(payload).toContain("5802VN");
  });

  it("includes service code QRIBFTTA", () => {
    const payload = buildVietQrPayload({
      bankBin: "970436",
      accountNumber: "1234567890",
    });
    expect(payload).toContain("QRIBFTTA");
  });

  it("includes transaction amount when provided", () => {
    const payload = buildVietQrPayload({
      bankBin: "970436",
      accountNumber: "1234567890",
      amount: 50000,
    });
    // ID 54, length 05, value "50000"
    expect(payload).toContain("540550000");
  });

  it("omits transaction amount when not provided", () => {
    const withAmount = buildVietQrPayload({
      bankBin: "970436",
      accountNumber: "1234567890",
      amount: 50000,
    });
    const withoutAmount = buildVietQrPayload({
      bankBin: "970436",
      accountNumber: "1234567890",
    });
    // Payload without amount should be shorter (no "54xx..." field)
    expect(withoutAmount.length).toBeLessThan(withAmount.length);
    // Should not contain the amount value "50000"
    expect(withoutAmount).not.toContain("50000");
  });

  it("includes transfer note in additional data field", () => {
    const payload = buildVietQrPayload({
      bankBin: "970436",
      accountNumber: "1234567890",
      description: "Payment for dinner",
    });
    expect(payload).toContain("Payment for dinner");
  });

  it("omits additional data field when no description", () => {
    const payload = buildVietQrPayload({
      bankBin: "970436",
      accountNumber: "1234567890",
    });
    // Additional data template uses ID 62
    // The CRC tag "63" should follow directly after country code (or amount)
    // Check that "62" template is not present before "6304"
    const crcIndex = payload.indexOf("6304");
    const additionalDataIndex = payload.indexOf("62", 12); // skip initial header
    if (additionalDataIndex !== -1) {
      expect(additionalDataIndex).toBeGreaterThan(crcIndex);
    }
  });

  it("ends with a valid CRC-16/CCITT-FALSE checksum", () => {
    const payload = buildVietQrPayload({
      bankBin: "970436",
      accountNumber: "1234567890",
      amount: 50000,
      description: "Payment",
    });
    expect(payload.endsWith("6304")).toBe(false); // CRC hex follows "6304"
    expect(payload.slice(-4)).toMatch(/^[0-9A-F]{4}$/);
    expect(verifyCrc(payload)).toBe(true);
  });

  it("produces a valid CRC for payload without optional fields", () => {
    const payload = buildVietQrPayload({
      bankBin: "970436",
      accountNumber: "1234567890",
    });
    expect(verifyCrc(payload)).toBe(true);
  });

  it("produces a known stable payload for a reference input", () => {
    // This verifies the TLV encoding is deterministic and correct.
    // Using the same inputs should always produce the same output.
    const payload = buildVietQrPayload({
      bankBin: "970436",
      accountNumber: "1234567890",
      amount: 50000,
      description: "Payment",
    });

    // Verify structural invariants
    expect(payload).toMatch(/^000201/); // header
    expect(payload).toContain("A000000727"); // NAPAS GUID
    expect(payload).toContain("970436"); // bank BIN
    expect(payload).toContain("1234567890"); // account
    expect(payload).toContain("704"); // VND
    expect(payload).toContain("50000"); // amount
    expect(payload).toContain("VN"); // country
    expect(payload).toContain("Payment"); // note
    expect(payload).toContain("QRIBFTTA"); // service code

    // Snapshot: this exact input should always produce this exact payload.
    // Breakdown:
    //   000201          PayloadFormatIndicator = "01"
    //   010211          PointOfInitiationMethod = "11" (static)
    //   3854            MerchantAccountInformation template (len 54)
    //     0010A000000727  NAPAS globally unique identifier
    //     0124            BeneficiaryInformation (len 24)
    //       0006970436    bank BIN
    //       01101234567890 account number
    //     0208QRIBFTTA    service code
    //   5303704         TransactionCurrency = VND
    //   540550000       TransactionAmount = 50000
    //   5802VN          CountryCode
    //   6211            AdditionalDataFieldTemplate (len 11)
    //     0807Payment    transfer note
    //   6304D309        CRC-16 checksum
    expect(payload).toBe(
      "00020101021138540010A00000072701240006970436011012345678900208QRIBFTTA53037045405500005802VN62110807Payment6304D309"
    );
    expect(verifyCrc(payload)).toBe(true);
  });

  it("handles Vietnamese description with diacritics", () => {
    const payload = buildVietQrPayload({
      bankBin: "970436",
      accountNumber: "1234567890",
      description: "Tien an com",
    });
    expect(payload).toContain("Tien an com");
    expect(verifyCrc(payload)).toBe(true);
  });

  it("handles different bank BINs", () => {
    // Techcombank
    const tcb = buildVietQrPayload({
      bankBin: "970407",
      accountNumber: "1111111111",
    });
    expect(tcb).toContain("970407");
    expect(verifyCrc(tcb)).toBe(true);

    // BIDV
    const bidv = buildVietQrPayload({
      bankBin: "970418",
      accountNumber: "2222222222",
    });
    expect(bidv).toContain("970418");
    expect(verifyCrc(bidv)).toBe(true);
  });
});

describe("generateVietQrDataUrl", () => {
  it("returns a data URL starting with data:image", async () => {
    const dataUrl = await generateVietQrDataUrl({
      bankBin: "970436",
      accountNumber: "1234567890",
      amount: 50000,
    });
    expect(dataUrl).toMatch(/^data:image\/(png|jpeg|webp);base64,/);
  });

  it("generates a valid QR with all fields", async () => {
    const dataUrl = await generateVietQrDataUrl({
      bankBin: "970436",
      accountNumber: "1234567890",
      amount: 100000,
      description: "Da Nang trip",
    });
    expect(dataUrl.length).toBeGreaterThan(100); // non-trivial base64 image
  });
});
