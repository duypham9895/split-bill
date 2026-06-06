import type { SplitMethod, Language } from "../../domain/types";
import type { TranslationKey } from "../../i18n/translations";
import { t } from "../../i18n/translations";

interface SplitMethodPickerProps {
  method: SplitMethod;
  language: Language;
  onChange: (m: SplitMethod) => void;
}

const METHODS: SplitMethod[] = ["equal", "exact", "percentage", "shares"];

const METHOD_LABEL_KEY: Record<SplitMethod, TranslationKey> = {
  equal: "equal",
  exact: "exact",
  percentage: "percentage",
  shares: "shares",
};

const METHOD_SUMMARY_KEY: Record<SplitMethod, TranslationKey> = {
  equal: "splitEqualSummary",
  exact: "splitExactSummary",
  percentage: "splitPercentSummary",
  shares: "splitSharesSummary",
};

const METHOD_FORMULA_KEY: Record<SplitMethod, TranslationKey> = {
  equal: "splitEqualFormula",
  exact: "splitExactFormula",
  percentage: "splitPercentFormula",
  shares: "splitSharesFormula",
};

export function SplitMethodPicker({ method, language, onChange }: SplitMethodPickerProps) {
  return (
    <div>
      <div className="segmented">
        {METHODS.map((m) => (
          <button
            key={m}
            type="button"
            className={m === method ? "active" : undefined}
            onClick={() => onChange(m)}
          >
            {t(language, METHOD_LABEL_KEY[m])}
          </button>
        ))}
      </div>
      <div className="splitHelp">
        <p className="splitHelpSummary">{t(language, METHOD_SUMMARY_KEY[method])}</p>
        <span className="splitHelpFormula">{t(language, METHOD_FORMULA_KEY[method])}</span>
      </div>
    </div>
  );
}
