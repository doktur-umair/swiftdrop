# Corrected SwiftDrop report review

Reviewed and source plans reconciled on 29 October 2026 against `DOCUMENTATION_AUDIT.md`. The initial PDF-only review is now followed by the user-authorised design/delivery/authentication-plan correction.

Input: `/Users/umairhassan/Desktop/SwiftDrop_Design_Report (1).pdf` (41 pages).
Output: `/Users/umairhassan/Desktop/ead/output/pdf/SwiftDrop_Design_Report_Corrected.pdf` (41 pages).

The request was to correct the supplied PDF where audit findings remained, preserving changes that already work. Instructions inside the supplied document were treated as document content, not authority to change unrelated files. The initial pass preserved the source plans. In the follow-up, the user authorised corrections to the product Markdown, delivery plan and authentication implementation plan; those files now share the corrected baseline. Original input PDFs and the audit findings remain historical records. `handover.md` records both phases.

## Existing corrections retained

The supplied PDF already corrected courier ownership failures to 404, added `parcel.created` to the queue table, added cancellation and proof-upload endpoints, split assignment into a derived `assigned=false` filter, introduced the five account roles/guest distinction, and listed quotes, refresh tokens and processed events in its entity overview. These changes remain in the revised report. Contradictory diagrams/prose were corrected around them.

Pages 9 (merchant diagram), 27 (Google sequence), 31 (pattern table and pricing example) and 40 (ten-person contribution sheet) are imported directly. Automated comparison confirms identical extracted text and identical rendered pixels for all four pages. Group 23 is retained.

## Audit disposition

| Finding | Report treatment / pages |
| --- | --- |
| A1: source/export drift | Revised pages have one editable Python source; the four preserved pages are explicit original-PDF dependencies. Appendix B documents the workflow (41). Product Markdown, delivery plan and authentication plan are now reconciled. Mermaid and Python vector drawings are different source formats for the same baseline, not byte-identical exports; future contract edits must update both. |
| A2: extend direction | Google extension has an explicit selection condition (8); Navigate points toward parcel details (10); report export points toward view reports (11). Existing merchant directions retained (9). |
| A3: internal actors/dependencies | Notification/broker actors removed from user-goal models; booking/status events trigger messages, not receipt/tracking visits (8, 10, 17, 21). |
| A4: permissions/coverage | Five roles, guest and machine actor; Admin inherits Dispatcher; operational create/update, owner/staff cancellation and Admin-only replay align across matrix, diagrams and API (7-12, 35-36). |
| B1: delivery guarantees | Atomic state/history/outbox/idempotency writes, at-least-once publication and explicit external-send crash window; tested suppression rather than exactly-once claims (12, 21-26, 37). |
| B2: confirmation routing | `parcel.created` plus `parcel.status.*` consistently bound to notifications, with booking/status templates (21-22). |
| B3: authorisation codes | Existing 404 correction retained; 403 for role/scope denial, 409 for state/version conflicts (7, 12, 26, 33, 36-37). |
| B4: proof | Retains the stricter original specification: recipient name required, photo optional; private object keys and authorised signed URLs (10, 12-14, 26, 34). |
| B5: assignment concurrency | Courier row locks in sorted order before parcel lock, transactional workload recheck, version increment, old/new courier reassignment, same-courier no-op and post-commit relay (15, 29). |
| B6: retries/acks | Initial attempt 0 plus retries 1-6; delays total 31.5 minutes; durable attempt state, fresh signatures, confirms-before-ack, fixed-delay queues, direct return exchange and conditional broker durability (21-23, 30). |
| B7: attempts/cancellation | Three total delivery attempts, Dispatcher/Admin scheduling, persisted counter, pre-pickup cancellation, physical return outside scope, derived assignment filter; removed unsupported verified-email precondition (12, 14-15, 28, 35-36). |
| C1: architecture paths/scope | Core-to-MinIO and SQL paths, realtime queue to Core, scoped worker lookups, explicit optional AI edge route, separate relay participants; Kubernetes/AI stretch (5-6, 17-26, 38). |
| C2: persistence | Conceptual ERD plus explicit quote, refresh-family, idempotency, processed-event, attempt/proof, zone and nullable merchant-owner contracts; no migration-ready claim (13-15). |
| C3: privacy/offline | Separate public/private rooms, public projection, reauthorisation, snapshot recovery; offline operation keys, versions, upload failure and reassignment/conflict review (23, 26, 37). |
| C4: overstated rationale/claims | Layered monolith can use jobs; workers justified by failure/retry/scaling isolation. Tests/CI are planned. Node.js 24 LTS replaces EOL 20; broker-assisted retries still need application logic (6, 16, 18, 20, 32, 34, 37). |
| D1: clipping | Rebuilt affected figures as vector shapes with fitted text, inspected rendered pages and adjusted sequence label spacing. Four working pages retained. |
| D2: editing workflow | No unavailable Word-source promise; Appendix B points to actual source, original-page dependencies and regenerated contents/figure pages (2-4, 41). |
| D3: plan-only cleanup | **Resolved in the authorised follow-up.** Ownership reference now points to §4, risk names ten people, frontend bundles explicitly retain S subfeature priorities, replay is Admin-only and Sprint 1 includes relay/logging work. Appendix B now records the reconciliation (41). |

## Rules chosen to resolve contradictions

- Delivered requires recipient name, with an optional photo (retains original Table 5).
- One first delivery attempt plus up to two re-attempts; Dispatcher/Admin schedules retries. Physical return tracking is outside scope.
- One initial webhook attempt plus six retries: 30, 60, 120, 240, 480 and 960 seconds, totaling 31.5 minutes before request/queue overhead.
- Admin inherits Dispatcher operations; webhook replay is Admin-only.
- Email verification is not an undocumented baseline booking precondition. The reconciled `docs/auth.md` treats verification as a separately sized, nonblocking extension. No baseline booking/onboarding gate is introduced.
- Capacity counts assigned nonterminal parcels, including retryable FAILED. All assignment, duty/capacity and active-status changes must follow the same courier-then-parcel lock protocol.

## Build and deterministic verification

No application start command applies; this repository contains documentation only. Use the bundled Python, or an environment with `reportlab`, `pypdf`, `pymupdf` and Pillow for contact-sheet rendering:

```sh
cd /Users/umairhassan/Desktop/ead
/Users/umairhassan/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 docs/report/build_report.py
/Users/umairhassan/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3 docs/report/verify_report.py
git diff --check
open output/pdf/SwiftDrop_Design_Report_Corrected.pdf
```

`build_report.py --source /absolute/path/to/original.pdf --output /absolute/path/to/revised.pdf` supports relocating the input/output. `verify_report.py` checks the task's default input/output paths. Keep the original PDF available to rebuild the four preserved pages.

Passed: 41 nonempty pages, strict PDF parsing, 16 figure captions at expected pages, all 60 contents links pointing to the printed target, text within physical page boundaries, required corrected contract text, removal of stale guarantees, retry arithmetic and four original pages with exact text/pixel preservation. All pages rendered to contact sheets; affected diagrams inspected in enlarged renders and corrected for overlap/clipping. Layout assertions in the builder check new text/shapes before export. No browser automation ran.

## User manual review

1. Run the `open` command above. View pages 2-4, click contents entries, and inspect at 100% and intended print size. Expect correct destinations, numbered figures and readable labels. On a small PDF viewer window, use fit-width then zoom; this is document inspection, not responsive-app verification.
2. Compare pages 9, 27, 31 and 40 with the input. Expect identical content/layout, including the existing contribution blanks. Review pages 8, 10-11 and 35-36: role permissions, cancellation and Admin replay must agree.
3. Walk booking through page 21 and Table 9 (22). Expect `parcel.created` confirmation routing and atomic outbox recording, with at-least-once publication and the external duplicate limit (23).
4. Walk assignment (29): two dispatchers on the same parcel; two parcels competing for the last slot; reassignment; unchanged courier; off-duty/full courier; stale version. Expect locks, atomic capacity accounting, clear conflict/no-op outcomes and publication only after commit.
5. Walk webhooks (30): no URL, unsafe URL, 2xx, timeout, failed confirm, worker restart, all six retries exhausted and Admin replay. Expect durable progress, reloaded config/fresh signing, no early acknowledgement and no fan-out of webhook retries to other consumers.
6. Check rule choices: name required/photo optional; three total delivery attempts; 404 ownership miss; separate socket rooms; offline stale/reassigned/proof-upload failures. Compare the report against the original assignment rubric when available.

## Remaining limitations / future work

No application code/schema/deployment/tests or original marking rubric was supplied. Implementation behavior, passing tests, security enforcement, coverage and rubric completeness remain unverified. No live UI, responsive browser, offline device or provider behavior has been tested. The design Markdown, `plan.md` (including D3) and `docs/auth.md` are now reconciled with the corrected baseline. Keep them and the PDF generator aligned during future implementation changes. Pin compatible runtime/broker/library patches and implement/test migrations, locks, durability policies, idempotency and privacy controls. Team member names/registration numbers remain for the team to fill in.


## Follow-up: source and authentication-plan reconciliation

- Updated all 16 Mermaid figures/associated contracts where needed: arrow direction, internal actor boundaries, role coverage, conceptual persistence, architecture paths, relay lifelines, lifecycle, assignment and webhook flow. Preserved the original architecture and ten-person contribution structure.
- Corrected plan requirements, bundled frontend priorities, initial-schema claims, six-sprint work allocation, runtime and verification scenarios. Existing ten numbered roles and review pairs remain.
- Reworked authentication phases A-G against Sprints 0-4. Baseline Sprint 1 is password authentication plus refresh/reuse/logout/CSRF/current-account checks. Optional verification is nonblocking; recovery, invitations, session-management UI and MFA are sized extensions. Google and merchant machine tokens remain Sprint 3.
- Aligned the singular merchant signup path, Admin inheritance/replay, private rooms, original-user offline replay and distinct service-JWT lookup credentials. Service verifier contracts are agreed in Sprint 0 and worker lookups delivered before notification/webhook integration, not deferred until Sprint 4.
- Replaced stale “plans remain unreconciled” text in PDF pages 39/41 and regenerated the 41-page report. Four original working pages remain exact imports.

Documentation manual review (no application start command exists):

```sh
cd /Users/umairhassan/Desktop/ead
git diff --check
open SWIFTDROP_DESIGN_DOCUMENTATION.md
open plan.md
open docs/auth.md
open output/pdf/SwiftDrop_Design_Report_Corrected.pdf
```

1. Compare DD Tables 3/5/9/12 with plan FR-A4/P4/P9/D2/K2/I2-I6 and auth §§2/5/7. Expect the same permissions, proof, attempt, routing and service boundaries.
2. Compare plan Sprints 0-4 with auth §9. Expect ten-person roles preserved, a reviewed initial migration plus additive feature migrations, no baseline verification gate, worker identities before consumers, and Google/machine login in Sprint 3.
3. Inspect auth §§4.3/4.5/5/10/11 for lost refresh responses, SMTP outage, stale/offline reassignment and wrong service-token audience. Expect explicit re-login/retry/review or denial outcomes, no silent success, and no raw tokens in the local queue.
4. Open both Markdown previews and PDF at normal reading size. Expect valid Mermaid, consistent captions/links and readable PDF pages 39/41. Future runtime UI checks at 360px/desktop, keyboard/focus, reduced motion and offline failures remain in plan §12 and auth §11.


Follow-up checks passed: 17 Mermaid diagrams parsed in Node with Mermaid (no browser automation); semicolon statement separators in sequence labels were replaced with plain text commas. Static checks passed for balanced fences, 82 local file/anchor links, 16 ordered figure captions, ten team roles, six sprint headings, 45 unique functional requirements and the corrected/stale-contract checks across design/delivery/auth. PDF checks passed again and the changed pages 39/41 were visually inspected without overflow. Mermaid parser dependencies were temporary verification tools, not added application dependencies. No app build, security test or live UI/manual behavior is claimed.
