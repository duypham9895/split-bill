import type { Member, Language } from "../../domain/types";
import { t } from "../../i18n/translations";

interface ParticipantSelectorProps {
  members: Member[];
  selected: string[];
  language: Language;
  onChange: (ids: string[]) => void;
}

export function ParticipantSelector({
  members,
  selected,
  language,
  onChange,
}: ParticipantSelectorProps) {
  const activeMembers = members.filter((m) => m.active);
  const allIds = activeMembers.map((m) => m.id);
  const noneSelected = selected.length === 0;
  const allSelected = allIds.length > 0 && allIds.every((id) => selected.includes(id));
  const someSelected = !noneSelected && !allSelected;

  function handleAllClick() {
    if (allSelected) {
      onChange([]);
    } else {
      onChange(allIds);
    }
  }

  function handleMemberClick(id: string) {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  }

  const allStateClass = allSelected ? "on" : someSelected ? "some" : "";

  return (
    <div className="participantSelector">
      <button
        type="button"
        className={`allTag${allStateClass ? ` ${allStateClass}` : ""}`}
        aria-label={t(language, "all")}
        onClick={handleAllClick}
      >
        <span className="allTagIndicator" aria-hidden="true">
          {allSelected ? "✓" : someSelected ? "–" : ""}
        </span>
        {t(language, "all")}
      </button>
      {activeMembers.map((member) => {
        const isOn = selected.includes(member.id);
        return (
          <button
            key={member.id}
            type="button"
            className={`memberTag${isOn ? " on" : ""}`}
            aria-label={member.name}
            onClick={() => handleMemberClick(member.id)}
          >
            {member.name}
          </button>
        );
      })}
    </div>
  );
}
