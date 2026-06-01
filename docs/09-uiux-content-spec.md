# UI/UX And Content Spec

## Information Architecture

The app uses five main sections:

1. Trips & Members
2. Expenses & Splits
3. Balances & Settlement
4. Sharing & Payment
5. QA & Release

## Desktop Layout

- Left sidebar: section navigation and local-first status.
- Top bar: trip selector, create trip, language switch.
- Main panel: active workflow.
- Right rail: net balances, settlement preview, payment card.

## Mobile Layout

- Sidebar stacks above content.
- Main and summary panels stack vertically.
- Forms collapse to one column.
- Participant and action grids collapse to one column.

## Key Interaction Rules

- Payer is never auto-assumed to be a participant.
- Multiple payer rows must sum to total expense.
- Split method is explicit through segmented control.
- Formula preview updates before save.
- Marking settlement paid creates a local transfer.
- Shared/exported data warns about payment detail exposure.

## Core EN Copy

- Add member
- Save expense
- Formula preview
- Simplified
- Direct payback
- Mark paid
- Export JSON
- Export CSV
- Print summary
- QA bug -> failing test -> fix -> regression test -> QA retest -> close

## Core VN Copy

- Them thanh vien
- Luu khoan chi
- Xem cong thuc
- Rut gon
- Tra ve nguoi da tra
- Danh dau da tra
- Xuat JSON
- Xuat CSV
- In tong ket
- Bug QA -> test fail -> sua -> regression test -> QA retest -> dong bug

## Accessibility

- Inputs use visible labels.
- Buttons use text or clear icons with labels.
- Positive/negative balances use color and text/amount position.
- Mobile layout avoids horizontal scrolling.
- QR is not the only payment information; account details are text.

