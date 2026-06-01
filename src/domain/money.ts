import type { Language } from "./types";

export function formatMoney(amountMinor: number, language: Language = "en"): string {
  const normalizedAmount = Object.is(amountMinor, -0) ? 0 : amountMinor;
  const locale = language === "vi" ? "vi-VN" : "en-US";

  return `${new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(normalizedAmount)} VND`;
}
