# QA And Bug-Fix Workflow

## Principle

QA tests the app like real users. Engineering protects the app with automated tests. A bug is not truly fixed until both are true:

- Automated tests pass.
- QA confirms the real user problem no longer reproduces.

## QA Responsibilities

QA should validate:

- Real host workflow from empty app to final settlement.
- Real member workflow from shared summary to transfer action.
- Calculation correctness.
- Formula transparency.
- Bank account and QR visibility.
- Import/export reliability.
- English and Vietnamese copy.
- Mobile and desktop usability.
- Error recovery.

## Engineering Responsibilities

Engineering should:

- Keep calculation logic covered by unit tests.
- Keep user flows covered by component/E2E tests.
- Turn QA bugs into failing automated tests when practical.
- Fix root causes, not only visible symptoms.
- Rerun regression tests before sending back to QA.

## Bug Lifecycle

```text
QA finds bug
-> QA writes reproduction steps
-> Engineering reproduces
-> Engineering adds failing test if practical
-> Engineering fixes
-> Automated tests pass
-> QA retests
-> QA closes or reopens
```

## Bug Report Template

```text
Title:
Severity:
Environment:
Language:
Device / viewport:

Steps to reproduce:
1.
2.
3.

Expected result:

Actual result:

Evidence:

Notes:
```

## Severity Definitions

### P0

Data loss, wrong settlement math, app cannot calculate, exported summary is unusable.

### P1

Core workflow blocked, payment instruction wrong, formula contradicts balance, import/export broken.

### P2

Confusing UX, validation missing, mobile layout issue, QR/payment details hard to use.

### P3

Copy polish, visual polish, minor spacing or alignment issue.

## Required Regression Before Release

- All unit tests pass.
- All component tests pass.
- All E2E tests pass.
- QA full-trip scenario passes.
- QA shared-summary scenario passes.
- QA Vietnamese scenario passes.
- No open P0/P1 bugs.
- P2 bugs are either fixed or explicitly accepted.

## Automation Rule

If QA finds a bug in calculation, settlement, import/export, language formatting, or a repeatable UI flow, engineering should add an automated test for it.

If automation is not practical, add the bug scenario to the manual regression checklist with the reason.

