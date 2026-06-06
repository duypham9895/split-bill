export type MemberId = string;

export type CurrencyCode = "VND";

export type Language = "en" | "vi";

export type PaymentInfo = {
  bankName?: string;
  bankCode?: string;
  accountNumber?: string;
  accountHolder?: string;
  transferNoteTemplate?: string;
  qrImageDataUrl?: string;
};

export type Member = {
  id: MemberId;
  name: string;
  active: boolean;
  payment?: PaymentInfo;
};

export type PayerContribution = {
  memberId: MemberId;
  amountMinor: number;
};

export type SplitMethod = "equal" | "exact" | "percentage" | "shares";

export type ParticipantShare = {
  memberId: MemberId;
  exactAmountMinor?: number;
  percentage?: number;
  shares?: number;
};

export type Expense = {
  id: string;
  title: string;
  amountMinor: number;
  payers: PayerContribution[];
  participants: ParticipantShare[];
  splitMethod: SplitMethod;
  category?: string;
  date: string;
  note?: string;
  receiptImageDataUrl?: string;
  createdAt: string;
  updatedAt: string;
};

export type Transfer = {
  id: string;
  fromMemberId: MemberId;
  toMemberId: MemberId;
  amountMinor: number;
  date: string;
  note?: string;
  status: "pending" | "paid";
};

export type Trip = {
  id: string;
  name: string;
  currency: CurrencyCode;
  language: Language;
  members: Member[];
  expenses: Expense[];
  transfers: Transfer[];
  isSample?: boolean;
};

export type MemberBalance = {
  memberId: MemberId;
  name: string;
  totalPaid: number;
  totalOwed: number;
  transferPaid: number;
  transferReceived: number;
  balance: number;
};

export type SettlementPayment = {
  fromMemberId: MemberId;
  toMemberId: MemberId;
  amountMinor: number;
  expenseId?: string;
};

