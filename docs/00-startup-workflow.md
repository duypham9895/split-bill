# Split Bill Startup Workflow

## Goal

Build a full no-database trip expense splitting web app with a startup-quality product process before implementation. The app must handle mixed payers, multiple payers, partial participant splits, equal/custom/percentage/share splits, transfers, clear formulas, bilingual Vietnamese/English UI, payment details, QR support, payment status tracking, and shareable final settlement output.

## Local Project Context

- Project path: `/Users/edwardpham/Documents/Programming/Projects/split-bill`
- Current repo state: no Git repository yet
- Current app state: no source files yet
- Available local runtimes:
  - Node.js `v22.22.0`
  - npm `10.9.4`
  - pnpm `10.31.0`
  - Bun `1.3.10`

## Recommended Delivery Model

Use a lightweight startup workflow with explicit gates:

1. Product discovery
2. PRD
3. UI/UX and content design
4. Engineering debate and technical design
5. Test plan
6. TDD implementation
7. QA real-user test pass
8. Bug-fix loop with engineering
9. Visual, functional, accessibility, and calculation regression QA
10. Release-ready static web app

## Team Roles

### Head of Product

Owns problem definition, scope, user journeys, acceptance criteria, tradeoffs, and launch sequence.

Deliverables:

- PRD
- User stories
- Full product scope and phased delivery order
- Success metrics
- Product risks and assumptions

### Senior UI/UX Designer

Owns app workflow, information architecture, interaction design, responsive behavior, and visual system.

Deliverables:

- Core screens
- Form states
- Empty states
- Error states
- Read-only shared summary view
- Mobile and desktop layout rules

### Content Writer

Owns bilingual copy in English and Vietnamese.

Deliverables:

- UI labels
- Empty states
- Error messages
- Formula explanations
- Payment instruction copy
- Share-summary copy

### Head of Engineering

Owns architecture, domain model, stack choice, quality gates, and implementation sequencing.

Deliverables:

- Technical design
- Data model
- Calculation algorithm
- Persistence and sharing strategy
- Test strategy
- Build/deploy workflow

### Senior Engineer

Owns implementation quality, TDD discipline, edge-case coverage, refactoring, and code review.

Deliverables:

- Tests first
- Calculation engine
- UI implementation
- Import/export/share behavior
- Accessibility and browser verification

### QA Lead

Owns real-user validation, regression coverage, bug reproduction quality, and release sign-off.

Deliverables:

- User-flow QA scenarios
- Bug reports with reproduction steps
- Severity classification
- Regression checklist
- Confirmation that fixed bugs no longer reproduce
- Confirmation that automated tests cover fixed bugs where practical

## Decision Gates

### Gate 1: PRD Approval

Product, design, content, and engineering must agree on:

- Full app scope
- User journeys
- Required fields
- Split rules
- Payment info scope
- No-database constraints
- Bilingual behavior
- Acceptance criteria

### Gate 2: Design Approval

Design and product must approve:

- Main app shell
- Add member flow
- Add expense flow
- Balance view
- Formula breakdown view
- Settlement view
- Share-read-only view
- Error and empty states
- VN/EN content fit

### Gate 3: Technical Approval

Engineering must approve:

- Stack
- Domain model
- Calculation precision and rounding
- Settlement simplification algorithm
- Local storage format
- Share/export format
- Test matrix
- Accessibility constraints

### Gate 4: TDD Implementation

No production calculation code should be written before failing tests exist.

Required test order:

1. Domain calculation tests
2. Settlement algorithm tests
3. Persistence/import/export tests
4. i18n formatting tests
5. Component interaction tests
6. End-to-end user flow tests

### Gate 5: QA Real-User Validation

QA tests the app like real trip hosts and members, not only like engineers.

QA must verify:

- A host can complete a full trip from empty state to final settlement.
- A member can understand a shared summary without asking the host.
- Formula details match the visible balances.
- Payment instructions contain enough bank or QR information to transfer.
- Vietnamese and English copy are understandable in context.
- Desktop and mobile layouts are usable.
- Validation errors are clear and recoverable.

### Gate 6: Bug-Fix Loop

When QA finds a bug:

1. QA writes clear reproduction steps.
2. Engineering confirms the bug.
3. Engineering writes or updates an automated failing test that captures the bug when practical.
4. Engineering fixes the bug.
5. Engineering reruns unit, component, E2E, and relevant manual checks.
6. QA retests the original reproduction steps.
7. The bug is closed only when QA confirms it is fixed and no related regression is found.

Rule:

```text
QA bug -> failing test -> fix -> regression test -> QA retest -> close
```

If a QA bug cannot reasonably be automated, engineering must document why and add it to the manual regression checklist.

## Recommended Stack

Because there is no database and the app is browser-first:

- React + Vite + TypeScript
- Vitest for unit tests
- React Testing Library for component behavior
- Playwright for end-to-end flows
- LocalStorage for lightweight saved trip data
- IndexedDB if QR images and receipt images make localStorage too large
- URL encoded data for small share payloads
- Exported HTML/JSON/PDF/CSV for complete summaries
- `Intl.NumberFormat` for currency display
- Small dictionary-based i18n layer or `i18next` if copy grows

## Internet Research Summary

Product workflow:

- PRDs should define purpose, features, assumptions, UX design, scope, user stories, and success metrics.
- A good PRD should also capture open questions and explicitly define out-of-scope items.

Expense-splitting product patterns:

- Successful apps treat each expense independently.
- Each expense stores the payer, amount, and participants affected by that expense.
- Apps distinguish expenses from reimbursements/transfers.
- Debt simplification minimizes number of final payments without changing final balances.
- Rounding must be explicit because exact equal splits can create cent-level differences.

Testing:

- Use red-green-refactor for domain logic.
- Test user-visible behavior rather than implementation details.
- Use browser E2E tests for critical flows.

Local-first:

- `localStorage` can persist data across browser sessions on the same origin.
- URL search parameters can carry share data, but large QR images can make URLs too large.
- Exported HTML/JSON is safer for QR-heavy share summaries.

Accessibility and UX:

- Forms need visible labels, clear instructions, and textual error messages.
- Error states should identify which field failed and how the user can fix it.

## Source References

- Atlassian PRD template: https://www.atlassian.com/software/confluence/templates/product-requirements
- Atlassian product requirements guide: https://www.atlassian.com/agile/product-management/requirements
- Splitwise debt simplification: https://feedback.splitwise.com/knowledgebase/articles/107220-what-is-debt-simplification-aka-debt-shuffling-
- Tricount expense management help: https://help.tricount.com/articles/how-can-i-manage-my-tricounts-and-expenses
- Tricount FAQ: https://help.tricount.com/articles/tricount-faqs
- Settle Up: https://settleup.io/
- Splid: https://splid.app/english
- Martin Fowler on TDD: https://martinfowler.com/bliki/TestDrivenDevelopment.html
- Vitest features: https://vitest.dev/guide/features
- Playwright best practices: https://playwright.dev/docs/best-practices
- MDN localStorage: https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage
- MDN URLSearchParams: https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams
- MDN Intl.NumberFormat: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat
- i18next best practices: https://www.i18next.com/principles/best-practices
- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- W3C error identification: https://www.w3.org/WAI/WCAG22/Understanding/error-identification
- NAPAS VietQR: https://en.napas.com.vn/napas-fastfund-247-with-vietqr-code-service
- VietQR API: https://www.vietqr.io/generate/
