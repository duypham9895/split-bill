/**
 * Maps Vietnamese bank short codes to their 6-digit NAPAS BIN,
 * used to build VietQR EMVCo payloads. Extend as needed.
 */
const BANK_BINS: Record<string, string> = {
  VCB: "970436", // Vietcombank
  TCB: "970407", // Techcombank
  BIDV: "970418",
  VTB: "970415", // VietinBank
  ICB: "970415", // VietinBank (alt code)
  ACB: "970416",
  MB: "970422", // MBBank
  MBB: "970422",
  VPB: "970432", // VPBank
  TPB: "970423", // TPBank
  STB: "970403", // Sacombank
  VIB: "970441",
  SHB: "970443",
  AGRIBANK: "970405",
  VBA: "970405", // Agribank (alt)
  HDB: "970437", // HDBank
  OCB: "970448",
  MSB: "970426",
  SCB: "970429",
  EIB: "970431", // Eximbank
  SEAB: "970440", // SeABank
};

/** Resolve a user-entered bank code to a 6-digit NAPAS BIN, or null if unknown. */
export function resolveBankBin(code: string | undefined): string | null {
  if (!code) return null;
  const trimmed = code.trim();
  if (/^\d{6}$/.test(trimmed)) return trimmed; // already a BIN
  return BANK_BINS[trimmed.toUpperCase()] ?? null;
}
