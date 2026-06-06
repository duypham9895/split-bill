import { ChangeEvent, useEffect, useState } from "react";
import { Plus, Pencil, X, Check, UserPlus, CreditCard } from "lucide-react";
import { Language, Member, Trip } from "../../domain/types";
import { t } from "../../i18n/translations";
import { Avatar } from "../shared/Avatar";
import { PanelHeader } from "../shared/PanelHeader";

export type MemberForm = {
  name: string;
  bankName: string;
  bankCode: string;
  accountNumber: string;
  accountHolder: string;
  transferNoteTemplate: string;
  qrImageDataUrl: string;
};

export function uploadMemberQr(
  event: ChangeEvent<HTMLInputElement>,
  form: MemberForm,
  setForm: (form: MemberForm) => void,
) {
  const file = event.target.files?.[0];

  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    setForm({ ...form, qrImageDataUrl: String(reader.result) });
  };
  reader.readAsDataURL(file);
  event.target.value = "";
}

export function MembersSection({
  editingMemberId,
  error,
  form,
  language,
  onCancelEdit,
  onEditMember,
  onSaveMember,
  setForm,
  trip,
  updateTrip,
}: {
  editingMemberId: string | null;
  error: string;
  form: MemberForm;
  language: Language;
  onCancelEdit: () => void;
  onEditMember: (member: Member) => void;
  onSaveMember: () => void;
  setForm: (form: MemberForm) => void;
  trip: Trip;
  updateTrip: (updater: (trip: Trip) => Trip) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const isEditing = editingMemberId !== null;

  // Auto-expand payment section when editing a member who already has payment data.
  // Keyed on editingMemberId so it only fires when a new edit session begins, not on every form keystroke.
  useEffect(() => {
    if (editingMemberId !== null) {
      const hasPayment = !!(
        form.bankName ||
        form.bankCode ||
        form.accountNumber ||
        form.accountHolder ||
        form.transferNoteTemplate ||
        form.qrImageDataUrl
      );
      setShowPayment(hasPayment);
    } else {
      // Form closed (cancel or save) — collapse for next "add" session.
      setShowPayment(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingMemberId]);

  return (
    <div>
      <PanelHeader
        title={isEditing ? t(language, "editMember") : t(language, "tripsMembers")}
        subtitle={t(language, "membersSubtitle")}
      />
      <div className="twoColumn">
        <div className="formStack">
          {!showForm && !isEditing ? (
            <button className="ghostButton" onClick={() => setShowForm(true)} type="button">
              <UserPlus size={16} />
              {t(language, "addMember")}
            </button>
          ) : (
            <div className="formCard">
              <div className="formCardHeader">
                <CreditCard size={18} />
                {isEditing ? t(language, "editMember") : t(language, "addMember")}
              </div>
              <div className="formCardBody">
                <label>
            {t(language, "memberName")}
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder={t(language, "memberNamePlaceholder")}
            />
          </label>
          {!showPayment ? (
            <button
              className="ghostButton"
              onClick={() => setShowPayment(true)}
              type="button"
            >
              + {t(language, "addPaymentDetails")}
            </button>
          ) : (
            <>
              <div className="inputGrid">
                <label>
                  {t(language, "bank")}
                  <input
                    value={form.bankName}
                    onChange={(event) => setForm({ ...form, bankName: event.target.value })}
                    placeholder={t(language, "bankPlaceholder")}
                  />
                </label>
                <label>
                  {t(language, "bankCode")}
                  <input
                    value={form.bankCode}
                    onChange={(event) => setForm({ ...form, bankCode: event.target.value })}
                    placeholder={t(language, "bankCodePlaceholder")}
                  />
                </label>
              </div>
              <div className="inputGrid">
                <label>
                  {t(language, "accountNumber")}
                  <input
                    value={form.accountNumber}
                    onChange={(event) => setForm({ ...form, accountNumber: event.target.value })}
                  />
                </label>
                <label>
                  {t(language, "accountHolder")}
                  <input
                    value={form.accountHolder}
                    onChange={(event) => setForm({ ...form, accountHolder: event.target.value })}
                  />
                </label>
              </div>
              <label>
                {t(language, "transferNoteTemplate")}
                <input
                  value={form.transferNoteTemplate}
                  onChange={(event) => setForm({ ...form, transferNoteTemplate: event.target.value })}
                  placeholder={t(language, "transferNotePlaceholder")}
                />
              </label>
              <label>
                {t(language, "paymentQrImage")}
                <input
                  accept="image/*"
                  type="file"
                  onChange={(event) => uploadMemberQr(event, form, setForm)}
                />
              </label>
              {form.qrImageDataUrl && (
                <div className="qrPreview">
                  <img alt={t(language, "uploadedQrPreview")} src={form.qrImageDataUrl} />
                  <button
                    className="ghostButton"
                    onClick={() => setForm({ ...form, qrImageDataUrl: "" })}
                    type="button"
                  >
                    <X size={18} />
                    {t(language, "removeQr")}
                  </button>
                </div>
              )}
            </>
          )}
                {error && <div className="errorBox">{error}</div>}
                <div className="buttonRow">
                  <button className="primaryButton" onClick={onSaveMember} type="button">
                    {isEditing ? <Check size={18} /> : <Plus size={18} />}
                    {isEditing ? t(language, "saveMember") : t(language, "addMember")}
                  </button>
                  <button
                    className="ghostButton"
                    onClick={() => {
                      if (isEditing) {
                        onCancelEdit();
                      } else {
                        setShowForm(false);
                        setShowPayment(false);
                      }
                    }}
                    type="button"
                  >
                    <X size={18} />
                    {t(language, "cancel")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="listPanel">
          {trip.members.map((member) => {
            return (
              <div className="memberCard" key={member.id}>
                <div className="memberRow">
                  <Avatar member={member} />
                  <div>
                    <strong>{member.name}</strong>
                    <small>
                      {member.payment?.bankName
                        ? `${member.payment.bankName} · ${member.payment.accountNumber ?? t(language, "noAccount")}`
                        : t(language, "noPaymentInfo")}
                      {member.payment?.qrImageDataUrl ? ` · ${t(language, "qrUploaded")}` : ""}
                    </small>
                  </div>
                  <div className="rowActions">
                    <button
                      aria-label={`Edit ${member.name}`}
                      className="iconButton"
                      onClick={() => onEditMember(member)}
                      title={`Edit ${member.name}`}
                      type="button"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="ghostButton"
                      onClick={() =>
                        updateTrip((current) => ({
                          ...current,
                          members: current.members.map((item) =>
                            item.id === member.id ? { ...item, active: !item.active } : item,
                          ),
                        }))
                      }
                      type="button"
                    >
                      {member.active ? t(language, "active") : t(language, "archived")}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
