import { Check } from "lucide-react";
import { Language } from "../../domain/types";
import { getQaChecklist, t } from "../../i18n/translations";
import { PanelHeader } from "../shared/PanelHeader";

export function QaSection({
  bugText,
  language,
  setBugText,
}: {
  bugText: string;
  language: Language;
  setBugText: (value: string) => void;
}) {
  const checklist = getQaChecklist(language);

  return (
    <div>
      <PanelHeader title={t(language, "qaRelease")} subtitle={t(language, "qaReleaseSubtitle")} />
      <div className="qaGrid">
        {checklist.map((item) => (
          <div className="qaItem" key={item}>
            <Check size={18} />
            <span>{item}</span>
          </div>
        ))}
      </div>
      <div className="formulaBox">
        <strong>{t(language, "qaRule")}</strong>
      </div>
      <label>
        {t(language, "qaBugReportDraft")}
        <textarea
          value={bugText}
          onChange={(event) => setBugText(event.target.value)}
          placeholder={t(language, "qaBugPlaceholder")}
        />
      </label>
    </div>
  );
}
