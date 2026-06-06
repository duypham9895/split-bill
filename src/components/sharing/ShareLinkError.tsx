import { Link2Off, ReceiptText } from "lucide-react";
import { t } from "../../i18n/translations";
import type { Language } from "../../domain/types";

/**
 * Shown when a `view=share` URL has a missing or undecodable `trip` payload
 * (truncated by a messenger app, stale export version, corrupted paste).
 * Reuses the share-view shell so the friend still sees app branding rather
 * than landing in the editor with the sample trip.
 */
export function ShareLinkError() {
  // No trip payload means no trip language — guess from the browser.
  const language: Language = navigator.language?.toLowerCase().startsWith("vi") ? "vi" : "en";
  const appUrl = `${window.location.origin}${window.location.pathname}`;

  return (
    <div className="shareView">
      <div className="shareViewCard">
        <div className="shareViewBrand">
          <div className="brandMark">
            <ReceiptText size={22} />
          </div>
          <strong>{t(language, "appName")}</strong>
        </div>
        <div className="shareViewStatus shareViewStatus--owe">
          <Link2Off size={20} />
          <strong>{t(language, "shareLinkBrokenTitle")}</strong>
        </div>
        <p className="shareViewScanHint">{t(language, "shareLinkBrokenDesc")}</p>
        <a className="primaryButton" href={appUrl}>
          {t(language, "openApp")}
        </a>
        <p className="shareViewFooter">{t(language, "readOnlySummary")}</p>
      </div>
    </div>
  );
}
