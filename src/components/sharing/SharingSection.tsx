import { type ChangeEvent, useState } from "react";
import { AlertTriangle, ClipboardCheck, Copy, Download, FileJson, Link, QrCode, Send, Share2, Upload } from "lucide-react";
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
  onNativeShare,
  onShareToZalo,
  onShareToMessenger,
  trip,
}: {
  importJson: (event: ChangeEvent<HTMLInputElement>) => void;
  language: Language;
  message: string;
  onCopyShareLink: () => void;
  onDownloadCsv: () => void;
  onDownloadJson: () => void;
  onNativeShare: () => void;
  onShareToZalo: () => void;
  onShareToMessenger: () => void;
  trip: Trip;
}) {
  const [shareStatus, setShareStatus] = useState<"idle" | "copied" | "error">("idle");
  const [shareMessage, setShareMessage] = useState("");

  const handleCopyShareLink = async () => {
    try {
      await onCopyShareLink();
      setShareStatus("copied");
      setShareMessage(language === "vi" ? "Đã sao chép liên kết!" : "Link copied!");
    } catch {
      setShareStatus("error");
      setShareMessage(language === "vi" ? "Không thể sao chép liên kết" : "Failed to copy link");
    }
  };

  return (
    <div>
      <PanelHeader title={t(language, "sharingPayment")} subtitle={t(language, "sharingSubtitle")} />

      {/* Share Link Card */}
      <div className="formCard" style={{ marginBottom: "var(--space-4)" }}>
        <div className="formCardHeader">
          <Link size={18} />
          {t(language, "shareLink")}
        </div>
        <div className="formCardBody">
          <div className="warningBox" style={{ marginBottom: "var(--space-3)" }}>
            <AlertTriangle size={16} />
            <span>{t(language, "privacyWarning")}</span>
          </div>

          <div className="actionGrid actionGrid--primary">
            <button className="primaryButton" onClick={handleCopyShareLink} type="button">
              <Copy size={18} />
              {t(language, "copyShareLink")}
            </button>
            <button className="ghostButton" onClick={onNativeShare} type="button">
              <Share2 size={18} />
              {language === "vi" ? "Chia sẻ..." : "Share..."}
            </button>
          </div>

          {/* Messaging app share */}
          <div className="actionGrid actionGrid--messaging">
            <button className="ghostButton" onClick={onShareToZalo} type="button">
              <Send size={16} />
              Zalo
            </button>
            <button className="ghostButton" onClick={onShareToMessenger} type="button">
              <Send size={16} />
              Messenger
            </button>
            <button className="ghostButton" onClick={() => window.print()} type="button">
              <ClipboardCheck size={16} />
              {t(language, "printSummary")}
            </button>
          </div>

          {/* Message */}
          {shareMessage && (
            <div className={shareStatus === "copied" ? "formulaBox" : shareStatus === "error" ? "errorBox" : ""}>
              {shareMessage}
            </div>
          )}
        </div>
      </div>

      {/* Export Card */}
      <div className="formCard" style={{ marginBottom: "var(--space-4)" }}>
        <div className="formCardHeader">
          <Download size={18} />
          {t(language, "exportData")}
        </div>
        <div className="formCardBody">
          <div className="actionGrid actionGrid--secondary">
            <button className="ghostButton" onClick={onDownloadJson} type="button">
              <FileJson size={16} />
              {t(language, "exportJson")}
            </button>
            <button className="ghostButton" onClick={onDownloadCsv} type="button">
              <Download size={16} />
              {t(language, "exportCsv")}
            </button>
          </div>
        </div>
      </div>

      {/* Import Card */}
      <div className="formCard" style={{ marginBottom: "var(--space-4)" }}>
        <div className="formCardHeader">
          <Upload size={18} />
          {t(language, "importData")}
        </div>
        <div className="formCardBody">
          <label className="fileButton">
            <Upload size={16} />
            {t(language, "importJson")}
            <input accept="application/json" onChange={importJson} type="file" />
          </label>
          {message && (
            <div className={message.includes("imported") || message.includes("Đã") ? "formulaBox" : "errorBox"}>
              {message}
            </div>
          )}
        </div>
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
