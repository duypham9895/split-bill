import { useEffect, useState } from "react";
import type { Member, SettlementPayment } from "../domain/types";
import { generatePaymentQr } from "./qr";

/**
 * Generate (or resolve the uploaded) payment QR for a settlement payment.
 *
 * Returns `{ qr, loading }` where `qr` prefers the receiver's uploaded QR image
 * and falls back to a generated VietQR/encoded data URL. The async generation is
 * cancelled on unmount or when the payment/receiver changes.
 */
export function useGeneratedQr(
  receiver: Member | undefined,
  payment: SettlementPayment,
): { qr: string; loading: boolean } {
  const [generated, setGenerated] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!receiver) {
      setLoading(false);
      return;
    }
    setLoading(true);
    let cancelled = false;
    void generatePaymentQr(receiver, payment)
      .then((dataUrl) => {
        if (!cancelled) {
          setGenerated(dataUrl);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [payment, receiver]);

  const qr = receiver?.payment?.qrImageDataUrl || generated;
  return { qr, loading };
}
