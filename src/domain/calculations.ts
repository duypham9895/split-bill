import type { MemberBalance, SettlementPayment, Trip } from "./types";
import { calculateExpenseShares } from "./split";

export function calculateTrip(trip: Trip): {
  balances: MemberBalance[];
  simplifiedSettlement: SettlementPayment[];
  directPaybackSettlement: SettlementPayment[];
} {
  const memberIds = new Set(trip.members.map((member) => member.id));
  const balances = new Map(
    trip.members.map((member) => [
      member.id,
      {
        memberId: member.id,
        name: member.name,
        totalPaid: 0,
        totalOwed: 0,
        transferPaid: 0,
        transferReceived: 0,
        balance: 0,
      } satisfies MemberBalance,
    ]),
  );

  for (const expense of trip.expenses) {
    validateExpenseMembers(expense.payers.map((payer) => payer.memberId), memberIds, "payer");
    validateExpenseMembers(
      expense.participants.map((participant) => participant.memberId),
      memberIds,
      "participant",
    );

    const payerTotal = expense.payers.reduce((sum, payer) => sum + payer.amountMinor, 0);
    if (payerTotal !== expense.amountMinor) {
      throw new Error("Payer contributions must equal the expense amount");
    }

    const shares = calculateExpenseShares(expense);

    for (const payer of expense.payers) {
      const balance = getBalance(balances, payer.memberId);
      balance.totalPaid += payer.amountMinor;
    }

    for (const [memberId, amountMinor] of shares) {
      const balance = getBalance(balances, memberId);
      balance.totalOwed += amountMinor;
    }
  }

  for (const transfer of trip.transfers) {
    if (transfer.fromMemberId === transfer.toMemberId) {
      throw new Error("Transfer sender and receiver cannot be the same member");
    }
    if (transfer.amountMinor <= 0) {
      throw new Error("Transfer amount must be greater than 0");
    }
    validateExpenseMembers([transfer.fromMemberId, transfer.toMemberId], memberIds, "transfer member");

    getBalance(balances, transfer.fromMemberId).transferPaid += transfer.amountMinor;
    getBalance(balances, transfer.toMemberId).transferReceived += transfer.amountMinor;
  }

  const balanceList = trip.members.map((member) => {
    const balance = getBalance(balances, member.id);
    balance.balance =
      balance.totalPaid - balance.totalOwed - balance.transferReceived + balance.transferPaid;
    return balance;
  });

  const netTotal = balanceList.reduce((sum, balance) => sum + balance.balance, 0);
  if (netTotal !== 0) {
    throw new Error("Balances must sum to zero");
  }

  return {
    balances: balanceList,
    simplifiedSettlement: createSimplifiedSettlement(balanceList),
    directPaybackSettlement: createDirectPaybackSettlement(trip),
  };
}

function createSimplifiedSettlement(balances: MemberBalance[]): SettlementPayment[] {
  const debtors = balances
    .filter((balance) => balance.balance < 0)
    .map((balance) => ({ memberId: balance.memberId, remaining: Math.abs(balance.balance) }));
  const creditors = balances
    .filter((balance) => balance.balance > 0)
    .map((balance) => ({ memberId: balance.memberId, remaining: balance.balance }));
  const payments: SettlementPayment[] = [];

  let debtorIndex = 0;
  let creditorIndex = 0;

  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const amountMinor = Math.min(debtor.remaining, creditor.remaining);

    if (amountMinor > 0) {
      payments.push({
        fromMemberId: debtor.memberId,
        toMemberId: creditor.memberId,
        amountMinor,
      });
    }

    debtor.remaining -= amountMinor;
    creditor.remaining -= amountMinor;

    if (debtor.remaining === 0) {
      debtorIndex += 1;
    }
    if (creditor.remaining === 0) {
      creditorIndex += 1;
    }
  }

  return payments;
}

function createDirectPaybackSettlement(trip: Trip): SettlementPayment[] {
  const netPayments = new Map<string, SettlementPayment>();

  for (const expense of trip.expenses) {
    const shares = calculateExpenseShares(expense);

    for (const [participantId, shareAmount] of shares) {
      for (const payer of expense.payers) {
        if (participantId === payer.memberId) {
          continue;
        }
        const amountMinor = Math.floor((shareAmount * payer.amountMinor) / expense.amountMinor);
        if (amountMinor === 0) {
          continue;
        }

        addNetPayment(netPayments, {
          fromMemberId: participantId,
          toMemberId: payer.memberId,
          amountMinor,
          expenseId: expense.id,
        });
      }
    }
  }

  for (const transfer of trip.transfers) {
    addNetPayment(netPayments, {
      fromMemberId: transfer.toMemberId,
      toMemberId: transfer.fromMemberId,
      amountMinor: transfer.amountMinor,
    });
  }

  return Array.from(netPayments.values()).filter((payment) => payment.amountMinor > 0);
}

function addNetPayment(payments: Map<string, SettlementPayment>, payment: SettlementPayment) {
  const forwardKey = `${payment.fromMemberId}->${payment.toMemberId}`;
  const reverseKey = `${payment.toMemberId}->${payment.fromMemberId}`;
  const reversePayment = payments.get(reverseKey);

  if (reversePayment) {
    if (reversePayment.amountMinor > payment.amountMinor) {
      reversePayment.amountMinor -= payment.amountMinor;
      return;
    }
    if (reversePayment.amountMinor === payment.amountMinor) {
      payments.delete(reverseKey);
      return;
    }
    payments.delete(reverseKey);
    payments.set(forwardKey, {
      ...payment,
      amountMinor: payment.amountMinor - reversePayment.amountMinor,
    });
    return;
  }

  const existing = payments.get(forwardKey);
  if (existing) {
    existing.amountMinor += payment.amountMinor;
    return;
  }

  payments.set(forwardKey, { ...payment });
}

function validateExpenseMembers(memberIds: string[], validMemberIds: Set<string>, label: string) {
  for (const memberId of memberIds) {
    if (!validMemberIds.has(memberId)) {
      throw new Error(`Unknown ${label}: ${memberId}`);
    }
  }
}

function getBalance(balances: Map<string, MemberBalance>, memberId: string): MemberBalance {
  const balance = balances.get(memberId);

  if (!balance) {
    throw new Error(`Unknown member: ${memberId}`);
  }

  return balance;
}
