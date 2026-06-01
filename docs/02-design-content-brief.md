# Design And Content Brief

## Design Principle

This is a practical money tool for groups after a trip. It should feel clear, calm, trustworthy, and fast. Avoid a marketing-first landing page. The first screen should be the usable app.

## Primary Workflow

1. Create or name trip
2. Add members
3. Add payment details and QR images where available
4. Add expenses with one or multiple payers
5. Choose split method
6. Add transfers/reimbursements when needed
7. Review formulas
8. Review balances
9. Generate simplified or direct payback settlement
10. Track payment status
11. Share final summary

## Recommended App Layout

Use a desktop-friendly multi-panel layout and a mobile-friendly step layout.

### Desktop

- Left rail: trip, members, language, export/import
- Main area: current workflow section
- Right summary: balances and settlement preview

### Mobile

- Top bar: trip name, language switch
- Segmented navigation:
  - Members
  - Expenses
  - Balances
  - Settle
  - Share
- Sticky primary action for current tab

## Core Screens

### Members Screen

Purpose:

- Add people.
- Add optional payment info.

Fields:

- Name
- Bank name
- Bank code
- Account number
- Account holder
- Transfer note
- QR upload
- Generate VietQR

States:

- Empty: no members yet
- Editing member
- Missing name error
- Duplicate name warning
- QR too large error

### Add Expense Screen

Purpose:

- Record who paid and who shared the expense.

Fields:

- Expense name
- Amount
- Paid by, supporting one or multiple payers
- Shared by
- Split method
- Category
- Date
- Note
- Receipt image

Interaction:

- `Shared by` should be a member checklist.
- Include `Select all` and `Clear`.
- Payer should not be auto-forced into `Shared by`; show a clear checkbox state instead.
- Split method should use a segmented control: Equal, Exact, Percent, Shares.
- Multiple payer mode should allow adding payer rows whose amounts must sum to the expense total.
- Live preview should show the formula before saving.

### Expenses List

Each row should show:

- Expense title
- Amount
- Payer
- Shared participants
- Split method
- Formula
- Edit/delete actions

Example:

```text
Dinner
Duy paid 300,000 VND for Alvin, HA, Anh TA.
300,000 / 3 = 100,000 each.
```

### Balances Screen

Table/card fields:

- Member
- Total paid
- Total owed
- Transfers paid/received
- Balance
- Status

Status labels:

- Should receive
- Needs to pay
- Settled

### Settlement Screen

Each payment card should show:

- Debtor
- Receiver
- Amount
- Receiver bank details
- Receiver QR image
- Transfer note
- Payment status
- Mark as paid action in editable mode

Settlement mode control:

- Simplified
- Direct payback

### Shared Summary

Read-only view should show:

- Trip name
- Generated date
- Members
- Expense formulas
- Transfers
- Balances
- Final settlement
- Receiver payment info
- Payment status when shared by host

The shared summary should not show edit controls.

## Content Tone

Tone should be direct and reassuring. Do not use financial jargon when simple words work.

## English Copy Samples

```text
Add member
Add expense
Who paid?
Did more than one person pay?
Who shared this expense?
Split equally
Split by exact amounts
Split by percentages
Split by shares
Formula preview
This expense must include at least one participant.
Payer contributions must equal the expense total.
Duy paid 300,000 VND for Alvin, HA, Anh TA.
300,000 / 3 = 100,000 each.
Alvin pays Duy 100,000 VND.
Mark as paid
No payments needed. Everyone is settled.
```

## Vietnamese Copy Samples

```text
Thêm thành viên
Thêm khoản chi
Ai đã trả tiền?
Có nhiều người cùng trả không?
Khoản này chia cho ai?
Chia đều
Chia theo số tiền cụ thể
Chia theo phần trăm
Chia theo phần
Xem công thức
Khoản chi này cần ít nhất một người tham gia.
Tổng tiền người trả phải bằng tổng khoản chi.
Duy đã trả 300.000 VND cho Alvin, HA, Anh TA.
300.000 / 3 = 100.000 mỗi người.
Alvin chuyển cho Duy 100.000 VND.
Đánh dấu đã chuyển
Không cần thanh toán thêm. Mọi người đã cân bằng.
```

## UX Rules For Money Trust

- Always show formula before final settlement.
- Never hide who was included in an expense.
- Never assume payer is included.
- Never assume there is only one payer.
- Show which split method is active.
- Avoid ambiguous words like "for everyone" unless all members are selected.
- Show warnings before deleting members or expenses.
- Keep transfer instructions copyable.
- Show `0 VND` instead of `-0 VND`.
- For rounded splits, show who receives/pays the remainder.

## Accessibility Rules

- Every input has a visible label.
- Error messages appear as text near the field.
- Buttons have clear names.
- Keyboard users can add expenses and toggle participants.
- Color is not the only way to show pay/receive status.
- Currency amounts are text-readable, not image-only.
