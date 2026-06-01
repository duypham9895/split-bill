import type { Language } from "../domain/types";

const en = {
  appName: "Trip Split Bill",
  tripsMembers: "Trip",
  tripsMembersHint: "Members & payments",
  expensesSplits: "Expenses",
  expensesSplitsHint: "Who paid, how to split",
  balancesSettlement: "Settle",
  balancesSettlementHint: "Balances & transfers",
  sharingPayment: "Share",
  sharingPaymentHint: "Export & share",
  qaRelease: "QA & Release",
  qaReleaseHint: "Test like real users",
  localFirst: "Local-first mode",
  localFirstHint: "All data is stored on this device.",
  addMember: "Add member",
  addExpense: "Save expense",
  splitMethod: "Split method",
  formulaPreview: "Formula preview",
  simplified: "Simplified",
  directPayback: "Direct payback",
  shouldReceive: "should receive",
  shouldPay: "should pay",
  settled: "settled",
  markPaid: "Mark paid",
  exportJson: "Export JSON",
  importJson: "Import JSON",
  exportCsv: "Export CSV",
  printSummary: "Print summary",
  copyShareLink: "Copy share link",
  qaRule: "QA bug -> failing test -> fix -> regression test -> QA retest -> close",
  trip: "Trip",
  expenses: "Expenses",
  settle: "Settle",
  share: "Share",
};

const vi: Record<keyof typeof en, string> = {
  appName: "Trip Split Bill",
  tripsMembers: "Chuyến đi",
  tripsMembersHint: "Thành viên & thanh toán",
  expensesSplits: "Chi phí",
  expensesSplitsHint: "Ai trả, chia thế nào",
  balancesSettlement: "Quyết toán",
  balancesSettlementHint: "Số dư & chuyển tiền",
  sharingPayment: "Chia sẻ",
  sharingPaymentHint: "Xuất & chia sẻ",
  qaRelease: "QA & Phát hành",
  qaReleaseHint: "Kiểm thử như người dùng thật",
  localFirst: "Chế độ local-first",
  localFirstHint: "Tất cả dữ liệu được lưu trên thiết bị này.",
  addMember: "Thêm thành viên",
  addExpense: "Lưu khoản chi",
  splitMethod: "Cách chia",
  formulaPreview: "Xem công thức",
  simplified: "Rút gọn",
  directPayback: "Trả về người đã trả",
  shouldReceive: "sẽ nhận",
  shouldPay: "cần trả",
  settled: "đã cân bằng",
  markPaid: "Đánh dấu đã trả",
  exportJson: "Xuất JSON",
  importJson: "Nhập JSON",
  exportCsv: "Xuất CSV",
  printSummary: "In tổng kết",
  copyShareLink: "Copy link chia sẻ",
  qaRule: "Bug QA -> test fail -> sửa -> regression test -> QA retest -> đóng bug",
  trip: "Chuyến đi",
  expenses: "Chi phí",
  settle: "Quyết toán",
  share: "Chia sẻ",
};

const dictionaries = { en, vi };

export type TranslationKey = keyof typeof en;

export function t(language: Language, key: TranslationKey) {
  return dictionaries[language][key];
}

