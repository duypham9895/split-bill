import type { Language } from "../domain/types";

const en = {
  // App shell
  appName: "Trip Split Bill",
  fullLocalApp: "Full local app",
  localFirst: "Local-first mode",
  localFirstHint: "All data is stored on this device.",

  // Navigation
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
  trip: "Trip",
  expenses: "Expenses",
  settle: "Settle",
  share: "Share",

  // Top bar
  activeTrip: "Active trip",
  createTrip: "Create trip",
  editTripName: "Edit trip name",

  // Members section
  editMember: "Edit member",
  membersSubtitle: "Create trips, members, and payment profiles.",
  tripName: "Trip name",
  memberName: "Member name",
  memberNamePlaceholder: "Duy",
  bank: "Bank",
  bankPlaceholder: "Vietcombank",
  bankCode: "Bank code",
  bankCodePlaceholder: "970436",
  accountNumber: "Account number",
  accountHolder: "Account holder",
  transferNoteTemplate: "Transfer note template",
  transferNotePlaceholder: "Da Nang trip",
  paymentQrImage: "Payment QR image",
  uploadedQrPreview: "Uploaded payment QR preview",
  removeQr: "Remove QR",
  saveMember: "Save member",
  addMember: "Add member",
  cancel: "Cancel",
  noAccount: "no account",
  noPaymentInfo: "No payment info yet",
  qrUploaded: "QR uploaded",
  active: "Active",
  archived: "Archived",

  // Expenses section
  editExpense: "Edit expense",
  expensesSubtitle: "Record who paid, who joined, and exactly how the bill is split.",
  whatWasExpense: "What was the expense?",
  titleLabel: "Title",
  titlePlaceholder: "e.g. Seafood dinner, Airport taxi",
  categoryLabel: "Category",
  categoryPlaceholder: "Food, Transport, Hotel...",
  amountLabel: "Amount (VND)",
  dateLabel: "Date",
  whoPaid: "Who paid?",
  amountPlaceholder: "Amount",
  removePayer: "Remove payer",
  addPayer: "Add payer",
  whoShared: "Who shared this?",
  selected: "selected",
  selectAll: "Select all",
  clearAll: "Clear all",
  splitMethod: "Split method",
  splitDetails: "Split details",
  participant: "Participant",
  noteOptional: "Note (optional)",
  notePlaceholder: "Any additional details...",
  saveExpense: "Save expense",
  saveChanges: "Save changes",
  noExpensesYet: "No expenses yet",
  noExpensesDesc: "Add your first expense to start splitting.",
  formulaPreview: "Formula preview",
  formulaCannotCalc: "Formula cannot be calculated yet.",

  // Split methods
  equal: "Equal",
  exact: "Exact",
  percentage: "Percent",
  shares: "Shares",

  // Settlement
  simplified: "Simplified",
  directPayback: "Direct payback",
  shouldReceive: "should receive",
  shouldPay: "should pay",
  settled: "settled",
  markPaid: "Mark paid",
  settlement: "Settlement",
  fewestTransfers: "Fewest transfers",
  payWhoYouOwe: "Pay who you owe",
  transfers: "Transfers",
  noTransfersYet: "No transfers yet",
  noTransfersDesc: "Mark a settlement payment as paid to record a transfer.",
  noPaymentsNeeded: "No payments needed. Everyone is settled.",

  // Balance cards
  paid: "Paid",
  owed: "Owed",
  transferPaid: "Transfer paid",
  transferReceived: "Transfer received",
  balance: "Balance",
  viewFullBreakdown: "View full balance breakdown",
  balancesSubtitle: "Audit totals, settlement modes, and paid transfers.",

  // Payment card
  paymentTo: "Payment to",
  bankNotAdded: "Bank not added",
  addAccountNumber: "Add account number",
  transferManually: "transfer manually after checking formulas.",

  // Sharing
  sharingSubtitle: "Share a read-only summary and payment details.",
  privacyNote: "Privacy note",
  privacyWarning: "Anyone with an exported file or link can see member payment details. Share only with your trip group.",
  paymentProfiles: "Payment profiles",
  noMembersYet: "No members yet",
  noMembersDesc: "Add members with payment info to see their profiles here.",
  noBank: "No bank",
  noAccountLabel: "No account",
  exportJson: "Export JSON",
  importJson: "Import JSON",
  exportCsv: "Export CSV",
  printSummary: "Print summary",
  copyShareLink: "Copy share link",

  // Dialog actions
  deleteExpenseTitle: "Delete expense",
  deleteExpenseConfirm: "Are you sure? This can't be undone.",
  deleteAction: "Delete",
  importTripTitle: "Import trip",
  importTripConfirm: "This will replace your current trip. Continue?",
  importAction: "Import",
  selectCategory: "Select category…",
  shareLink: "Share link",
  exportData: "Export data",
  importData: "Import data",
  viewAllTransfers: "View all {count} transfers",

  // Status messages
  shareCopied: "Share link copied. Keep in mind that payment details are visible to anyone with the link.",
  tripImported: "Trip imported.",
  importFailed: "Import failed.",
  markedPaidNote: "Marked paid from settlement",

  // Validation errors
  memberNameRequired: "Enter a name for this member.",
  duplicateMemberName: "A member with this name already exists. Use a different name.",
  cannotSaveExpense: "Cannot save expense. Check the form for errors.",
  expenseTitleRequired: "Give this expense a name (e.g., 'Dinner,' 'Taxi').",
  expenseAmountRequired: "Enter an amount greater than 0.",
  payerTotalMismatch: "Payer contributions must equal the expense total.",

  // QA
  qaReleaseSubtitle: "QA validates the real user path and engineering turns bugs into regression tests.",
  qaRule: "QA bug -> failing test -> fix -> regression test -> QA retest -> close",
  qaBugReportDraft: "QA bug report draft",
  qaBugPlaceholder: "Steps to reproduce, expected result, actual result...",
};

const vi: Record<keyof typeof en, string> = {
  // App shell
  appName: "Trip Split Bill",
  fullLocalApp: "Ứng dụng local",
  localFirst: "Chế độ local-first",
  localFirstHint: "Tất cả dữ liệu được lưu trên thiết bị này.",

  // Navigation
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
  trip: "Chuyến đi",
  expenses: "Chi phí",
  settle: "Quyết toán",
  share: "Chia sẻ",

  // Top bar
  activeTrip: "Chuyến đi hiện tại",
  createTrip: "Tạo chuyến đi",
  editTripName: "Sửa tên chuyến đi",

  // Members section
  editMember: "Sửa thành viên",
  membersSubtitle: "Tạo chuyến đi, thành viên và thông tin thanh toán.",
  tripName: "Tên chuyến đi",
  memberName: "Tên thành viên",
  memberNamePlaceholder: "Duy",
  bank: "Ngân hàng",
  bankPlaceholder: "Vietcombank",
  bankCode: "Mã ngân hàng",
  bankCodePlaceholder: "970436",
  accountNumber: "Số tài khoản",
  accountHolder: "Chủ tài khoản",
  transferNoteTemplate: "Mẫu nội dung chuyển khoản",
  transferNotePlaceholder: "Chuyến đi Đà Nẵng",
  paymentQrImage: "Ảnh QR thanh toán",
  uploadedQrPreview: "Xem trước QR đã tải lên",
  removeQr: "Xóa QR",
  saveMember: "Lưu thành viên",
  addMember: "Thêm thành viên",
  cancel: "Hủy",
  noAccount: "chưa có số tài khoản",
  noPaymentInfo: "Chưa có thông tin thanh toán",
  qrUploaded: "đã tải QR",
  active: "Đang hoạt động",
  archived: "Đã lưu trữ",

  // Expenses section
  editExpense: "Sửa khoản chi",
  expensesSubtitle: "Ghi nhận ai đã trả, ai tham gia, và cách chia chính xác.",
  whatWasExpense: "Khoản chi này là gì?",
  titleLabel: "Tiêu đề",
  titlePlaceholder: "VD: Ăn hải sản, Taxi sân bay",
  categoryLabel: "Danh mục",
  categoryPlaceholder: "Ăn uống, Di chuyển, Khách sạn...",
  amountLabel: "Số tiền (VND)",
  dateLabel: "Ngày",
  whoPaid: "Ai đã trả?",
  amountPlaceholder: "Số tiền",
  removePayer: "Xóa người trả",
  addPayer: "Thêm người trả",
  whoShared: "Khoản này chia cho ai?",
  selected: "đã chọn",
  selectAll: "Chọn tất cả",
  clearAll: "Bỏ chọn tất cả",
  splitMethod: "Cách chia",
  splitDetails: "Chi tiết chia",
  participant: "Người tham gia",
  noteOptional: "Ghi chú (tùy chọn)",
  notePlaceholder: "Thêm chi tiết...",
  saveExpense: "Lưu khoản chi",
  saveChanges: "Lưu thay đổi",
  noExpensesYet: "Chưa có khoản chi nào",
  noExpensesDesc: "Thêm khoản chi đầu tiên để bắt đầu chia.",
  formulaPreview: "Xem công thức",
  formulaCannotCalc: "Chưa thể tính công thức.",

  // Split methods
  equal: "Chia đều",
  exact: "Số tiền cụ thể",
  percentage: "Phần trăm",
  shares: "Theo phần",

  // Settlement
  simplified: "Rút gọn",
  directPayback: "Trả về người đã trả",
  shouldReceive: "sẽ nhận",
  shouldPay: "cần trả",
  settled: "đã cân bằng",
  markPaid: "Đánh dấu đã trả",
  settlement: "Quyết toán",
  fewestTransfers: "Ít giao dịch nhất",
  payWhoYouOwe: "Trả người bạn nợ",
  transfers: "Giao dịch",
  noTransfersYet: "Chưa có giao dịch nào",
  noTransfersDesc: "Đánh dấu một khoản thanh toán là đã trả để ghi nhận giao dịch.",
  noPaymentsNeeded: "Không cần thanh toán thêm. Mọi người đã cân bằng.",

  // Balance cards
  paid: "Đã trả",
  owed: "Nợ",
  transferPaid: "Đã chuyển",
  transferReceived: "Đã nhận",
  balance: "Số dư",
  viewFullBreakdown: "Xem bảng chi tiết",
  balancesSubtitle: "Kiểm tra tổng, chế độ quyết toán, và giao dịch đã trả.",

  // Payment card
  paymentTo: "Chuyển cho",
  bankNotAdded: "Chưa thêm ngân hàng",
  addAccountNumber: "Thêm số tài khoản",
  transferManually: "chuyển khoản thủ công sau khi kiểm tra công thức.",

  // Sharing
  sharingSubtitle: "Chia sẻ tổng kết và thông tin thanh toán.",
  privacyNote: "Lưu ý bảo mật",
  privacyWarning: "Bất kỳ ai có file hoặc link xuất ra đều có thể thấy thông tin thanh toán. Chỉ chia sẻ với nhóm đi chung.",
  paymentProfiles: "Hồ sơ thanh toán",
  noMembersYet: "Chưa có thành viên nào",
  noMembersDesc: "Thêm thành viên có thông tin thanh toán để xem hồ sơ ở đây.",
  noBank: "Chưa có ngân hàng",
  noAccountLabel: "Chưa có tài khoản",
  exportJson: "Xuất JSON",
  importJson: "Nhập JSON",
  exportCsv: "Xuất CSV",
  printSummary: "In tổng kết",
  copyShareLink: "Copy link chia sẻ",

  // Dialog actions
  deleteExpenseTitle: "Xóa khoản chi",
  deleteExpenseConfirm: "Bạn chắc chứ? Không thể hoàn tác.",
  deleteAction: "Xóa",
  importTripTitle: "Nhập chuyến đi",
  importTripConfirm: "Thao tác này sẽ thay thế chuyến đi hiện tại. Tiếp tục?",
  importAction: "Nhập",
  selectCategory: "Chọn danh mục…",
  shareLink: "Chia sẻ liên kết",
  exportData: "Xuất dữ liệu",
  importData: "Nhập dữ liệu",
  viewAllTransfers: "Xem tất cả {count} chuyển khoản",

  // Status messages
  shareCopied: "Đã copy link chia sẻ. Lưu ý rằng thông tin thanh toán hiển thị cho bất kỳ ai có link.",
  tripImported: "Đã nhập chuyến đi.",
  importFailed: "Nhập thất bại.",
  markedPaidNote: "Đánh dấu đã trả từ quyết toán",

  // Validation errors
  memberNameRequired: "Nhập tên cho thành viên này.",
  duplicateMemberName: "Thành viên tên này đã tồn tại. Dùng tên khác.",
  cannotSaveExpense: "Không lưu được khoản chi. Kiểm tra lại biểu mẫu.",
  expenseTitleRequired: "Đặt tên cho khoản chi (VD: 'Ăn tối,' 'Taxi').",
  expenseAmountRequired: "Nhập số tiền lớn hơn 0.",
  payerTotalMismatch: "Tổng tiền người trả phải bằng tổng khoản chi.",

  // QA
  qaReleaseSubtitle: "QA kiểm thử như người dùng thật và kỹ sư biến bug thành test hồi quy.",
  qaRule: "Bug QA -> test fail -> sửa -> regression test -> QA retest -> đóng bug",
  qaBugReportDraft: "Mẫu báo cáo bug QA",
  qaBugPlaceholder: "Các bước tái hiện, kết quả mong đợi, kết quả thực tế...",
};

// QA checklist items (arrays, not simple strings)
const qaChecklistEn = [
  "Host creates a trip and settlement",
  "Member reviews shared summary",
  "VN and EN copy fits mobile",
  "All split methods match formulas",
  "QA bug has failing test before fix",
];

const qaChecklistVi = [
  "Chủ chuyến đi tạo chuyến đi và quyết toán",
  "Thành viên xem tổng kết chia sẻ",
  "Bản VN và EN hiển thị tốt trên mobile",
  "Tất cả cách chia khớp công thức",
  "Bug QA có test fail trước khi sửa",
];

export type TranslationKey = keyof typeof en;

const dictionaries = { en, vi };

export function t(language: Language, key: TranslationKey, vars?: Record<string, string | number>) {
  let text: string = dictionaries[language][key];
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }
  return text;
}

export function getQaChecklist(language: Language) {
  return language === "vi" ? qaChecklistVi : qaChecklistEn;
}
