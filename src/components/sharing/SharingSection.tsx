import { type ChangeEvent } from "react";
import { ClipboardCheck, Copy, Download, FileJson, QrCode, Upload } from "lucide-react";
import type { Language, Trip } from "../../domain/types";
import { t } from "../../i18n/translations";
import { Avatar } from "../shared/Avatar";
import { PanelHeader } from "../shared/PanelHeader";

export function SharingSection({
  importJson,
  language,
  message,
  onCopyShareLink,
  onDownloadCsv,
  onDownloadJson,
  trip,
}: {
  importJson: (event: ChangeEvent<HTMLInputElement>) => void;
  language: Language;
  message: string;
  onCopyShareLink: () => void;
  onDownloadCsv: () => void;
  onDownloadJson: () => void;
  trip: Trip;
}) {
  return (
    <div>
      <PanelHeader title={t(language, "sharingPayment")} subtitle={t(language, "sharingSubtitle")} />

      {/* Primary actions */}
      <div className="actionGrid actionGrid--primary">
        <button className="primaryButton" onClick={onCopyShareLink} type="button">
          <Copy size={18} />
          {t(language, "copyShareLink")}
        </button>
        <button className="ghostButton" onClick={() => window.print()} type="button">
          <ClipboardCheck size={18} />
          {t(language, "printSummary")}
        </button>
      </div>

      {/* Secondary actions */}
      <div className="actionGrid actionGrid--secondary">
        <button className="ghostButton" onClick={onDownloadJson} type="button">
          <FileJson size={16} />
          {t(language, "exportJson")}
        </button>
        <label className="fileButton">
          <Upload size={16} />
          {t(language, "importJson")}
          <input accept="application/json" onChange={importJson} type="file" />
        </label>
        <button className="ghostButton" onClick={onDownloadCsv} type="button">
          <Download size={16} />
          {t(language, "exportCsv")}
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={message.includes("copied") || message.includes("imported") || message.includes("Đã") ? "formulaBox" : "formulaBox warning"}>
          {message}
        </div>
      )}

      {/* Privacy notice */}
      <div className="privacyNotice">
        <strong>⚠️ {t(language, "privacyNote")}</strong>
        <p>{t(language, "privacyWarning")}</p>
      </div>

      {/* Payment profiles */}
      <div className="shareSummary">
        <h3>{trip.name} — {t(language, "paymentProfiles")}</h3>
        {trip.members.length === 0 ? (
          <div className="emptyState">
            <QrCode size={24} />
            <strong>{t(language, "noMembersYet")}</strong>
            <p>{t(language, "noMembersDesc")}</p>
          </div>
        ) : (
          trip.members.map((member) => (
            <div className="paymentProfile" key={member.id}>
              <Avatar member={member} />
              <div>
                <strong>{member.name}</strong>
                <small>
                  {member.payment?.bankName ?? t(language, "noBank")} · {member.payment?.accountNumber ?? t(language, "noAccountLabel")}
                </small>
                {member.payment?.accountHolder && (
                  <small>{member.payment.accountHolder}</small>
                )}
              </div>
              {member.payment?.qrImageDataUrl ? (
                <img
                  alt={`${t(language, "paymentTo")} ${member.name}`}
                  className="paymentProfileQr"
                  src={member.payment.qrImageDataUrl}
                />
              ) : (
                <div className="paymentProfileQrPlaceholder">
                  <QrCode size={20} />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
