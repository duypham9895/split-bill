import type { Expense, MemberId } from "./types";

type WeightedAllocation = {
  memberId: MemberId;
  numerator: number;
};

export function calculateExpenseShares(expense: Expense): Map<MemberId, number> {
  if (expense.amountMinor <= 0) {
    throw new Error("Expense amount must be greater than 0");
  }

  if (expense.participants.length === 0) {
    throw new Error("Expense must include at least one participant");
  }

  assertUniqueParticipants(expense.participants.map((participant) => participant.memberId));

  switch (expense.splitMethod) {
    case "equal":
      return allocateByWeights(
        expense.amountMinor,
        expense.participants.map((participant) => ({
          memberId: participant.memberId,
          numerator: 1,
        })),
      );
    case "exact":
      return calculateExactShares(expense);
    case "percentage":
      return allocateByWeights(
        expense.amountMinor,
        expense.participants.map((participant) => {
          const percentage = participant.percentage ?? 0;
          if (percentage < 0) {
            throw new Error("Percentage split cannot include negative values");
          }
          return {
            memberId: participant.memberId,
            numerator: percentage,
          };
        }),
        100,
      );
    case "shares":
      return allocateByWeights(
        expense.amountMinor,
        expense.participants.map((participant) => {
          const shares = participant.shares ?? 0;
          if (shares <= 0) {
            throw new Error("Share split values must be greater than 0");
          }
          return {
            memberId: participant.memberId,
            numerator: shares,
          };
        }),
      );
    default:
      assertNever(expense.splitMethod);
  }
}

function calculateExactShares(expense: Expense): Map<MemberId, number> {
  const entries = expense.participants.map((participant) => {
    const amount = participant.exactAmountMinor ?? 0;
    if (amount < 0) {
      throw new Error("Exact split cannot include negative values");
    }
    return [participant.memberId, amount] as const;
  });
  const total = entries.reduce((sum, [, amount]) => sum + amount, 0);

  if (total !== expense.amountMinor) {
    throw new Error("Exact split amounts must equal the expense amount");
  }

  return new Map(entries);
}

function allocateByWeights(
  amountMinor: number,
  allocations: WeightedAllocation[],
  expectedTotalWeight?: number,
): Map<MemberId, number> {
  const totalWeight = allocations.reduce((sum, allocation) => sum + allocation.numerator, 0);

  if (totalWeight <= 0) {
    throw new Error("Split weights must be greater than 0");
  }

  if (expectedTotalWeight !== undefined && !nearlyEqual(totalWeight, expectedTotalWeight)) {
    throw new Error("Percentage split must total 100%");
  }

  const rawShares = allocations.map((allocation, index) => {
    const rawAmount = (amountMinor * allocation.numerator) / totalWeight;
    const floorAmount = Math.floor(rawAmount);

    return {
      memberId: allocation.memberId,
      amount: floorAmount,
      fraction: rawAmount - floorAmount,
      index,
    };
  });

  let remaining = amountMinor - rawShares.reduce((sum, share) => sum + share.amount, 0);
  const remainderOrder = [...rawShares].sort((left, right) => {
    if (right.fraction !== left.fraction) {
      return right.fraction - left.fraction;
    }
    return left.index - right.index;
  });

  for (const share of remainderOrder) {
    if (remaining <= 0) {
      break;
    }
    share.amount += 1;
    remaining -= 1;
  }

  return new Map(
    [...rawShares]
      .sort((left, right) => left.index - right.index)
      .map((share) => [share.memberId, share.amount]),
  );
}

function assertUniqueParticipants(memberIds: MemberId[]) {
  const seen = new Set<MemberId>();

  for (const memberId of memberIds) {
    if (seen.has(memberId)) {
      throw new Error(`Duplicate participant: ${memberId}`);
    }
    seen.add(memberId);
  }
}

function nearlyEqual(left: number, right: number) {
  return Math.abs(left - right) < 0.000001;
}

function assertNever(value: never): never {
  throw new Error(`Unsupported split method: ${value}`);
}
