import { ChangeEvent } from "react";
import { Plus, Pencil, X, Check } from "lucide-react";
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
  const isEditing = editingMemberId !== null;

  return (
    <div>
      <PanelHeader
        title={isEditing ? "Edit member" : t(language, "tripsMembers")}
        subtitle="Create trips, members, and payment profiles."
      />
      <div className="twoColumn">
        <div className="formStack">
          <label>
            Trip name
            <input
              value={trip.name}
              onChange={(event) => updateTrip((current) => ({ ...current, name: event.target.value }))}
            />
          </label>
          <label>
            Member name
            <input
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              placeholder="Duy"
            />
          </label>
          <div className="inputGrid">
            <label>
              Bank
              <input
                value={form.bankName}
                onChange={(event) => setForm({ ...form, bankName: event.target.value })}
                placeholder="Vietcombank"
              />
            </label>
            <label>
              Bank code
              <input
                value={form.bankCode}
                onChange={(event) => setForm({ ...form, bankCode: event.target.value })}
                placeholder="970436"
              />
            </label>
          </div>
          <div className="inputGrid">
            <label>
              Account number
              <input
                value={form.accountNumber}
                onChange={(event) => setForm({ ...form, accountNumber: event.target.value })}
              />
            </label>
            <label>
              Account holder
              <input
                value={form.accountHolder}
                onChange={(event) => setForm({ ...form, accountHolder: event.target.value })}
              />
            </label>
          </div>
          <label>
            Transfer note template
            <input
              value={form.transferNoteTemplate}
              onChange={(event) => setForm({ ...form, transferNoteTemplate: event.target.value })}
              placeholder="Da Nang trip"
            />
          </label>
          <label>
            Payment QR image
            <input
              accept="image/*"
              type="file"
              onChange={(event) => uploadMemberQr(event, form, setForm)}
            />
          </label>
          {form.qrImageDataUrl && (
            <div className="qrPreview">
              <img alt="Uploaded payment QR preview" src={form.qrImageDataUrl} />
              <button
                className="ghostButton"
                onClick={() => setForm({ ...form, qrImageDataUrl: "" })}
                type="button"
              >
                <X size={18} />
                Remove QR
              </button>
            </div>
          )}
          {error && <div className="errorBox">{error}</div>}
          <div className="buttonRow">
            <button className="primaryButton" onClick={onSaveMember} type="button">
              {isEditing ? <Check size={18} /> : <Plus size={18} />}
              {isEditing ? "Save member" : t(language, "addMember")}
            </button>
            {isEditing && (
              <button className="ghostButton" onClick={onCancelEdit} type="button">
                <X size={18} />
                Cancel
              </button>
            )}
          </div>
        </div>

        <div className="listPanel">
          {trip.members.map((member) => (
            <div className="memberRow" key={member.id}>
              <Avatar member={member} />
              <div>
                <strong>{member.name}</strong>
                <small>
                  {member.payment?.bankName
                    ? `${member.payment.bankName} · ${member.payment.accountNumber ?? "no account"}`
                    : "No payment info yet"}
                  {member.payment?.qrImageDataUrl ? " · QR uploaded" : ""}
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
                  {member.active ? "Active" : "Archived"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
