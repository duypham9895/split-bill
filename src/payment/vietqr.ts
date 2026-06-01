/**
 * VietQR EMVCo payload generator.
 *
 * Builds a TLV-encoded (Tag-Length-Value) payload string conforming to the
 * EMVCo QR Code Specification for Payment Systems and the NAPAS VietQR standard
 * (updated Oct 2022).
 *
 * The payload is a plain ASCII string that can be passed directly to any QR code
 * library (e.g., the `qrcode` npm package) for rendering.
 *
 * @see https://vietqr.io/en/specification
 * @see https://github.com/openhoangnc/vietqr (reference implementation, MIT)
 */

import QRCode from "qrcode";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VietQROptions {
  /** Bank BIN (6 digits), e.g., "970436" for Vietcombank, "970415" for Techcombank. */
  bankBin: string;
  /** Beneficiary account number. */
  accountNumber: string;
  /** Amount in minor units (VND integer). Omit for open-ended QR. */
  amount?: number;
  /** Transfer note / description. */
  description?: string;
}

// ---------------------------------------------------------------------------
// EMVCo field IDs
// ---------------------------------------------------------------------------

const EMV = {
  PAYLOAD_FORMAT: "00",
  POINT_OF_INITIATION: "01",
  MERCHANT_ACCOUNT: "38",
  TRANSACTION_CURRENCY: "53",
  TRANSACTION_AMOUNT: "54",
  COUNTRY_CODE: "58",
} as const;

// NAPAS VietQR specific sub-field IDs
const NAPAS = {
  GLOBALLY_UNIQUE_ID: "00", // Sub-ID 00 of ID 38
  BENEFICIARY_INFO: "01",   // Sub-ID 01 of ID 38 (nested template)
  SERVICE_CODE: "02",       // Sub-ID 02 of ID 38
} as const;

const NAPAS_GUID = "A000000727";
const SERVICE_CODE = "QRIBFTTA"; // QR InterBank Fund Transfer To Account

// ---------------------------------------------------------------------------
// TLV helpers
// ---------------------------------------------------------------------------

/** Pad a number to exactly 2 digits (EMVCo length field). */
function pad2(n: number): string {
  return n.toString().padStart(2, "0");
}

/** Build a single TLV entry: [2-char ID][2-char length][value]. */
function tlv(id: string, value: string): string {
  return id + pad2(value.length) + value;
}

// ---------------------------------------------------------------------------
// CRC-16/CCITT-FALSE
// ---------------------------------------------------------------------------

/**
 * CRC-16/CCITT-FALSE checksum.
 *
 * Parameters: polynomial 0x1021, init 0xFFFF, no reflection, no final XOR.
 * Returns a 4-character uppercase hex string (e.g., "A1B2").
 */
function crc16(input: string): string {
  let crc = 0xffff;

  for (let i = 0; i < input.length; i++) {
    crc ^= input.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
    }
  }

  return (crc & 0xffff).toString(16).padStart(4, "0").toUpperCase();
}

// ---------------------------------------------------------------------------
// Payload builder
// ---------------------------------------------------------------------------

/**
 * Build a VietQR EMVCo payload string.
 *
 * The returned string is ready to be encoded as a QR code image.
 * All money values are in minor units (integer VND).
 */
export function buildVietQrPayload(options: VietQROptions): string {
  const { bankBin, accountNumber, amount, description } = options;

  // -- Beneficiary information (nested template inside ID 38) --
  // Sub-ID 00: bank BIN
  // Sub-ID 01: account number
  const beneficiary =
    tlv("00", bankBin) + tlv("01", accountNumber);

  // -- Merchant account information (ID 38) --
  // Sub-ID 00: NAPAS globally unique identifier
  // Sub-ID 01: beneficiary info (nested)
  // Sub-ID 02: service code
  const merchantAccount =
    tlv(NAPAS.GLOBALLY_UNIQUE_ID, NAPAS_GUID) +
    tlv(NAPAS.BENEFICIARY_INFO, beneficiary) +
    tlv(NAPAS.SERVICE_CODE, SERVICE_CODE);

  // -- Additional data field (ID 62, transfer note) --
  const additionalData = description
    ? tlv("08", description) // Sub-ID 08: payment note
    : "";

  // -- Assemble the full payload --
  // ID 00: Payload Format Indicator
  let payload = tlv(EMV.PAYLOAD_FORMAT, "01");

  // ID 01: Point of Initiation Method ("11" = static QR)
  payload += tlv(EMV.POINT_OF_INITIATION, "11");

  // ID 38: Merchant Account Information (template)
  payload += tlv(EMV.MERCHANT_ACCOUNT, merchantAccount);

  // ID 53: Transaction Currency ("704" = VND)
  payload += tlv(EMV.TRANSACTION_CURRENCY, "704");

  // ID 54: Transaction Amount (optional)
  if (amount != null && amount > 0) {
    payload += tlv(EMV.TRANSACTION_AMOUNT, amount.toString());
  }

  // ID 58: Country Code
  payload += tlv(EMV.COUNTRY_CODE, "VN");

  // ID 62: Additional Data Field Template (optional)
  if (additionalData) {
    payload += "62" + pad2(additionalData.length) + additionalData;
  }

  // ID 63: CRC-16 checksum (computed over everything before it)
  payload += "6304" + crc16(payload + "6304");

  return payload;
}

// ---------------------------------------------------------------------------
// QR code generation
// ---------------------------------------------------------------------------

/**
 * Generate a VietQR payment QR code as a data URL.
 *
 * Builds the EMVCo payload from bank/account/amount info and renders it
 * as a QR code image using the `qrcode` package.
 *
 * @returns A base64 data URL (e.g., "data:image/png;base64,...") suitable
 *          for use in an `<img src>`.
 */
export async function generateVietQrDataUrl(options: VietQROptions): Promise<string> {
  const payload = buildVietQrPayload(options);
  return QRCode.toDataURL(payload, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 256,
  });
}
