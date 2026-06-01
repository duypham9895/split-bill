import { Check } from "lucide-react";
import { Language } from "../../domain/types";
import { t } from "../../i18n/translations";
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
  return (
    <div>
      <PanelHeader title={t(language, "qaRelease")} subtitle="QA validates the real user path and engineering turns bugs into regression tests." />
      <div className="qaGrid">
        {[
          "Host creates a trip and settlement",
          "Member reviews shared summary",
          "VN and EN copy fits mobile",
          "All split methods match formulas",
          "QA bug has failing test before fix",
        ].map((item) => (
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
        QA bug report draft
        <textarea
          value={bugText}
          onChange={(event) => setBugText(event.target.value)}
          placeholder="Steps to reproduce, expected result, actual result..."
        />
      </label>
    </div>
  );
}
