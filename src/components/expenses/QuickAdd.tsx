import { Car, Hotel, MoreHorizontal, ReceiptText, ShoppingBag, Ticket, UtensilsCrossed, Wine } from "lucide-react";
import type { Expense, Language, Trip } from "../../domain/types";
import { t } from "../../i18n/translations";

const CATEGORY_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  food: UtensilsCrossed,
  transport: Car,
  hotel: Hotel,
  activity: Ticket,
  shopping: ShoppingBag,
  drinks: Wine,
  other: MoreHorizontal,
};

function getCategoryIcon(category: string | undefined) {
  if (!category) return ReceiptText;
  return CATEGORY_ICONS[category] ?? ReceiptText;
}

function templateKey(expense: Expense): string {
  return `${expense.title.trim().toLowerCase()}|${expense.category ?? ""}`;
}

function deriveTemplates(expenses: Expense[]): Expense[] {
  // Sort descending by createdAt (fallback to array order by negating index)
  const sorted = [...expenses].sort((a, b) => {
    const aTime = a.createdAt ?? "";
    const bTime = b.createdAt ?? "";
    if (bTime > aTime) return 1;
    if (bTime < aTime) return -1;
    return 0;
  });

  // Dedupe by title|category — keep the most recent of each key
  const seen = new Set<string>();
  const unique: Expense[] = [];
  for (const expense of sorted) {
    const key = templateKey(expense);
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(expense);
    }
    if (unique.length >= 5) break;
  }
  return unique;
}

export function QuickAdd({
  trip,
  language,
  onPick,
}: {
  trip: Trip;
  language: Language;
  onPick: (expense: Expense) => void;
}) {
  if (trip.expenses.length === 0) return null;

  const templates = deriveTemplates(trip.expenses);
  if (templates.length === 0) return null;

  return (
    <div className="quickAdd">
      <span className="quickAddLabel">{t(language, "quickAdd")}</span>
      <div className="quickAddChips">
        {templates.map((expense) => {
          const Icon = getCategoryIcon(expense.category);
          return (
            <button
              key={expense.id}
              className="quickAddChip"
              type="button"
              onClick={() => onPick(expense)}
              title={expense.title}
            >
              <Icon size={14} />
              <span>{expense.title}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
