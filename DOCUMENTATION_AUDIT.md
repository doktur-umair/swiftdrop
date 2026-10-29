# SwiftDrop documentation audit

Reviewed: 29 October 2026. Scope: availability, internal consistency, diagram accuracy and suitability for a project report. This is an audit, not an approved redesign or an implementation verification.

## Current disposition after correction

The original findings and verdict below are retained as a historical audit. On 29 October 2026 the corrected PDF and the product Markdown, delivery plan and authentication implementation plan were reconciled at the user's request. Plan-only D3 wording/priorities and the unsupported authentication verification gate are corrected. See [current disposition and checks](docs/report/REVIEW.md) and [handover](handover.md) for the completed documentation work. Implementation evidence, actual deployment/configuration, member identities and the original marking rubric remain unavailable; this is not an application verification or rubric-compliance claim.

## Verdict (at the time of the original audit)

**The requested material is available, but it is not yet consistently accurate or ready to submit unchanged.** The overall proposed architecture is coherent: a modular Core API, PostgreSQL, a transactional outbox, RabbitMQ, independent notification/webhook workers, and Socket.IO inside the Core API. Several diagrams and requirements disagree, including between the Markdown and PDF versions.

There is **no application source code, package manifest, database schema, deployment configuration or test suite** in the working tree. Claims about implemented behavior, passing tests, enforced module boundaries or working deployment cannot be verified. Describe the system as a proposed design until implementation evidence exists.

## Sources and availability

Source line numbers below refer to the files as reviewed on this date; PDF references use the printed page numbers, which match its 41 physical pages.

| Source | Available | Purpose / limitation |
| :--- | :--- | :--- |
| [Design document](/Users/umairhassan/Desktop/ead/SWIFTDROP_DESIGN_DOCUMENTATION.md) (DD) | Yes | Main product/design source; 16 Mermaid figure blocks. `plan.md` explicitly declares it the product source of truth. |
| [Existing PDF report](/Users/umairhassan/Desktop/ead/SwiftDrop_Design_Report.pdf) | Yes, 41 pages | Contains rendered diagrams and supporting prose; diagrams are not identical to the Markdown. |
| [Delivery plan](/Users/umairhassan/Desktop/ead/plan.md) (Plan) | Yes | Requirements, ownership, sprints, verification targets; includes one module/dependency diagram. |
| [Handover](/Users/umairhassan/Desktop/ead/handover.md) | Yes | Records repository setup and ten-person work distribution; confirms implementation remains future work. |
| Original assignment brief / marking rubric | No | References to “the brief”, the 20-mark allocation and required features cannot be independently checked. |
| Editable Word report (`.docx`) | No | DD line 13 and Appendix B describe native Word shapes, but no Word source is supplied. The Markdown uses Mermaid; the PDF is an export. |
| Application / schema / OpenAPI / test results | No | These are described or planned, not present artifacts. |

## Coverage of your requested report material

| Requested material | Existing location | Assessment |
| :--- | :--- | :--- |
| Use case diagrams | DD §3, Figures 1–4; PDF pp. 8–11 | Four actor-group diagrams exist: customer/recipient, merchant staff/e-store, courier, dispatcher/admin. Require notation, boundary and coverage corrections below. |
| Architecture | DD §5, Figures 6–7; PDF pp. 17–20 | Logical/layered and deployment views exist. Keep the core design; reconcile missing connections and distinguish optional features. |
| Integration architecture | DD §6, Figure 8; PDF pp. 21–23 | Event topology, envelope, queue bindings and reliability rationale exist. Notification routing and reliability promises need correction. |
| Flowcharts | DD §7.6–7.7, Figures 14–15; PDF pp. 29–30 | Two actual decision/process flowcharts exist: assignment and webhook retries. They need concurrency, acknowledgement and retry details. |
| Other flow diagrams | DD §7.1–7.5, Figures 9–13; PDF pp. 24–28 | Four sequence diagrams and one parcel state diagram exist. These are useful, but should be labelled by their actual diagram type rather than all being called flowcharts. |
| Justifications | DD §§3, 4.2, 5.1, 5.4, 6.1, prose following §7 diagrams, §§8–9 | Substantial rationale exists for actor splits, data choices, modular monolith, outbox, messaging, authentication, pricing and patterns. Some arguments overstate guarantees or misrepresent alternatives. |

If the rubric requires a flowchart for each main business process, booking, merchant order creation, courier updates and login currently have sequences rather than decision flowcharts. Add those only if required; the unavailable rubric prevents a definitive completeness judgment.

## Corrections needed before report reuse

### A. Diagrams and use cases

**A1. The PDF and Markdown are different diagram versions.**

- DD Figure 1, lines 212–216, reverses the Google `extend` arrow and makes receipt download and public tracking include email/SMS alerts. PDF p. 8 correctly points Google login toward Login, shows public tracking including live updates, and shows no such receipt dependency. Neither format can be treated as a faithful export of the other.
- DD Figure 2 declares `UC_M_Filter` at line 244 but connects to `UC_Filter` at line 262. Mermaid will implicitly create a separate unintended node, leaving the labelled filter use case disconnected. PDF p. 9 shows the intended filter connection.
- DD Figure 6 directly connects the AI widget to its service (line 628), while PDF p. 17 draws the widget connection through the Edge layer. Decide and document the public route consistently.

**Recommended correction:** maintain one editable diagram source and regenerate the report from it. Reconcile semantic differences first; do not assume either existing format is universally correct.

**A2. `extend` directions are wrong in the Markdown, and the courier PDF shares one error.**

DD lines 212, 262, 264, 302 and 348–350 point from the base use case to the extension. The arrow should point from the extending use case to the extended/base use case; see the [OMG notation statement](https://issues.omg.org/issues/UML25-428). Examples: `Filter orders → View dashboard`, `Navigate → View parcel details`, `Export CSV → View reports`. PDF pp. 8–9 and 11 generally show the correct directions, but PDF p. 10 still points `View parcel details → Navigate` incorrectly. Treat Google sign-in as an alternative login flow, or define an explicit extension condition if retaining `extend`.

**A3. Some links describe implementation machinery rather than user goals.**

The entire SwiftDrop Platform is the stated boundary, yet DD Figure 1 puts Notification Service outside it and Figure 3 puts Message broker outside it. Both are internal components in Figures 6–8. Model external actors such as Google, the merchant e-store and, when useful, the email provider; explain internal broker publishing in architecture/sequence diagrams. DD lines 215–216 also incorrectly imply that downloading a receipt or opening public tracking necessarily sends alerts. Notifications follow business events, not those page visits.

**A4. Permissions and diagram coverage do not agree.**

DD Table 3 (lines 163–172) grants dispatchers/admins parcel creation and status updates, and admins assignment, but Figure 4 does not show these permissions or an actor-generalization relationship. Table 12 grants parcel creation only to Customer and assignment only to Dispatcher. The lifecycle allows customer/merchant cancellation (line 979), but there is no cancellation use case or endpoint in the endpoint table. Admin replay appears in DD Table 9 and Plan FR-I5, while Plan FR-F8 places the replay UI in the dispatcher console. The role prose also calls recipients a role despite no login and groups Dispatcher/Admin despite their different permissions.

**Recommended correction:** define five authenticated roles (Customer, Merchant, Courier, Dispatcher, Admin), a guest recipient actor and a machine-client actor; then make the role matrix, use cases and endpoint roles agree. Retain the DD Table 3 capabilities unless deliberately changing scope. Add cancellation and admin replay explicitly; define whether admins inherit dispatcher permissions. The endpoint table can remain a summary if its omissions are clearly labelled and it does not contradict the matrix.

### B. Behavior and reliability

**B1. “Exactly once from the outbox” contradicts the stated delivery model.**

DD Table 5 line 377 says the status event is published exactly once. DD §6.5 line 815 and Plan NFR-5 correctly state at-least-once delivery. A relay can publish, crash before marking `published_at`, and publish again. The outbox supports atomic recording with the parcel change, not exactly-once broker publication. Deduplication after sending an external email also leaves a crash window unless the external sender supports idempotency.

**Recommended correction:** promise atomic state/history/outbox writes, at-least-once delivery and idempotent handling by stable `eventId`; describe limits on external side effects. Qualify the “exactly one notification/webhook” test claims in DD Table 13 and Plan Sprint 4 as tested duplicate suppression scenarios, not an unconditional guarantee.

**B2. Booking confirmation email is not routed to notifications.**

DD Table 4 line 366 promises a confirmation email for `parcel.created`, but Figure 8 line 759 and Table 9 line 809 bind `notifications.q` only to `parcel.status.*`. That binding excludes `parcel.created`. Add an explicit `parcel.created` binding and template, or remove the confirmation promise. Do not silently change all notifications to `parcel.#`, which could send unwanted assignment emails.

**B3. Courier authorization failure alternates between 403 and 404.**

DD Table 5 line 376 and §7.3 line 933 say 403 for a foreign parcel; §9.2 line 1116 says 404 for customer/courier ownership failures. Plan NFR-2 says 404, but manual step 7 allows either. Use 404 for ownership-scoped parcel lookups/updates, retaining 403 for a known route-level role/scope denial, and align prose and checks.

**B4. Proof requirements disagree.**

DD §3.3 line 310 and Plan FR-K2 allow name, photo or both. DD Table 5 line 375 requires the recipient's name and makes photo optional. Pick one policy and use it in the use-case specification, flowchart, schema and validation. Also specify private object keys and authorized signed-URL generation for photos; a permanent public `proof_url` would conflict with DD §9.4.

**B5. Assignment protects a parcel, but does not establish safe courier capacity.**

Figure 14 (DD lines 1004–1015, PDF p. 29) checks active jobs before updating a parcel with a version predicate. Two dispatchers assigning two different parcels can both observe the same final free courier slot and both succeed. The depicted update also omits incrementing the version. It only accepts `courier_id IS NULL`, so it does not describe reassignment promised in Figure 4/Plan FR-D2.

**Recommended correction:** serialize the capacity check and reservation for a courier within the transaction, recheck on-duty/capacity under that protection, increment the parcel version, and add a reassignment branch that handles old/new capacity. Show commit → relay → event, making the asynchronous boundary explicit. This is a design gap, not a demonstrated runtime bug.

**B6. Retry flow and timing are underspecified and differ by format.**

Figure 15/§7.7 (DD lines 1030–1052; PDF p. 30) lacks initialization/increment of `attempt`, durable failure recording on each attempt, and confirmed retry publication before acknowledging the original message. The Markdown no-URL branch omits explicit acknowledgement. In the PDF the retry loop returns directly to POST, bypassing configuration reload and signing, while the Markdown returns to consume/reload/sign. A reused signature timestamp can conflict with the five-minute freshness rule (§9.3).

Six total attempts with a first retry of 30 seconds give five waits: 30, 60, 120, 240 and 480 seconds, totaling **15.5 minutes** before request time. Six retries total 31.5 minutes and mean seven total attempts. The report says six attempts and about 30 minutes without defining the counter. Choose one schedule and show it explicitly.

A single retry queue with mixed per-message TTLs can also delay short retries behind longer ones: RabbitMQ dead-letters expired messages at the queue head. Describe timings as minimum/approximate, or use fixed-delay retry queues if timing matters. See [RabbitMQ TTL behavior](https://www.rabbitmq.com/docs/ttl). Durable queues/messages and safe transfer/acknowledgement rules must support the claim that restarts lose nothing.

**B7. Parcel attempts and cancellation need complete rules.**

DD Figure 13 line 988 says “max 2 attempts”, but its prose line 993 and Plan FR-P4 say up to two re-attempts. Specify whether this means two or three total delivery attempts, who schedules them and where the count is stored. Cancellation exists in the state diagram but lacks an explicit use case/API contract. “Return to sender” is a final annotation, not a tracked state: state clearly whether physical return is outside scope or needs its own workflow.

Table 12's `?status=UNASSIGNED` (line 1176) is not a lifecycle status. Document it as a derived assignment filter (`courier_id IS NULL`), or use a separate assignment parameter. Table 4 also requires a verified email (line 365), but no verification state, email-verification flow or endpoint is specified. Design that capability or remove the unsupported precondition.

### C. Architecture, data and justifications

**C1. The logical/deployment views omit important paths.**

DD Figure 6 defines MinIO but draws no access connection; Figure 7 omits RabbitMQ → Core API for `realtime.q` and lacks an incoming AI-service route. The architecture prose (§5.2) names three adjacent services including optional AI, whereas Plan §1 names three async workers: outbox relay, notifications, webhooks. This can be reconciled by naming processes rather than using an unexplained count: Core API with realtime, three core workers, and an optional AI service. Label Kubernetes/Helm and AI as optional/stretch throughout, matching Plan decision 3 and DD §12; DD §1.3 currently calls them in scope without qualification.

DD §6.3 says consumers obtain contact data through the API, but the logical architecture omits worker → API calls and their service authorization contract. Show least-privilege access for those lookups. Figures 9–11 collapse the separate relay into API → broker arrows; explicitly label these as simplified or add a relay lifeline so the diagram does not imply a broker publish inside the request transaction.

**C2. The ERD is not a complete persistence contract for the promised flows.**

DD Figure 5 has no explicit storage for expiring quotes, hashed refresh-token families/reuse detection, idempotency responses, or consumer processed-event records. `notifications` lacks the `eventId` that §6.5 says it records; `outbox_events` lacks an explicit stable envelope `eventId` field (it could be in payload, but that is not specified). The parcel/history fields do not explicitly represent attempt count, proof recipient name, or the town/zone data needed by public tracking and zone filtering. Merchant orders have a required-looking `customer_id` although a machine order may have no separate customer account.

**Recommended correction:** label the ERD conceptual if intentionally selective, or add the missing structures and clarify nullability, identifiers and ownership. State whether merchant orders use the merchant user's ID or a nullable customer owner. Make the two zone relationships explicit. Do not call this the full schema ready for an initial migration as Plan Sprint 0 currently does.

**C3. Realtime privacy and offline replay need explicit branches.**

DD §6.6 line 818 puts public and authenticated clients in rooms named after the same tracking number while promising different payloads. Define public-safe room payloads for everyone, or separate authorized private/public channels; room membership alone does not explain selective disclosure. DD Table 5 queues offline courier updates but does not define deduplication, stale versions, reassignment while offline, proof upload failure or conflicts on replay. Add these to the detailed status-update flow and future tests before claiming offline reliability.

**C4. Some justifications are useful but overstated.**

- DD Table 7 rejects a layered monolith on the basis that notifications must run in request handlers. Layering does not require synchronous external calls. Justify separate workers using failure isolation, independent retry/scaling and keeping request latency stable; acknowledge a monolith could also use background jobs.
- DD §8.2 says contract tests run and import rules fail the build (§5.3), while no code or CI exists here. Change to planned/required behavior. DD §11 says test results are submitted separately, but none are available for this audit.
- DD Table 1 says broker TTL/DLQ provides retries “without extra code”; Figure 15 itself requires retry policy, bookkeeping and safe publishing logic. Describe broker-assisted delays instead.
- Plan calls Node.js 20 “LTS” (line 215), but the [official Node.js release table](https://nodejs.org/en/about/previous-releases) lists v20 as EOL as of this review. Choose a supported runtime before implementation and update both documents together. This does not change the chosen architecture.

### D. Report packaging and plan cleanup

**D1. PDF diagrams contain clipped labels.** Visual inspection found clipped text in Figure 1's live-update oval (p. 8), Figure 3's proof oval (p. 10), and the start/capacity nodes in Figure 14 (p. 29). Figure 15 (p. 30) clips the starting queue name and HMAC header. Resize shapes/text before export and inspect at normal reading size. Sequence labels are dense and should also be checked at intended print size.

**D2. Editing instructions do not match available deliverables.** DD line 13 and Appendix B promise native editable Word groups and Word figure fields. No `.docx` exists, and Mermaid Markdown is a different source format. Supply the actual Word source if it exists, or replace those instructions with the real diagram-editing workflow. Markdown page references are tied to the existing PDF and must be regenerated after edits.

**D3. The plan contains smaller stale references/priority conflicts.** Plan line 41 points ownership to §3 although ownership is §4; the risks table still says “Scope too large for 5” although the team is ten. Backend offline support FR-K3 is Should while the frontend offline queue FR-F6 is Must; similarly several Should backend capabilities are included in Must frontend rows. State whether those frontend rows are bundles delivered in stages, or align their priorities. Sprint 1 is labelled “no async yet” but includes the outbox relay. These do not invalidate the architecture, but should be cleaned up before presenting the plan as consistent.

## Suggested report structure after correction

1. System scope, external actors and a single approved role/permission matrix.
2. Four corrected use case diagrams, with written specifications for booking, merchant order, courier update and assignment; include cancellation/replay where they belong.
3. Core logical architecture, deployment view and event integration view, clearly separating baseline and optional features.
4. Booking, merchant order, courier fan-out and Google-login sequences; parcel state diagram; assignment and webhook decision flowcharts. Add other process flowcharts only if the rubric requires them.
5. A justification beside each diagram: the requirement it addresses, why this design fits, the main rejected alternative and its tradeoff, plus relevant failure/security behavior.
6. Validation/limitations: proposed design, missing implementation evidence, and any deliberately deferred optional work.

The existing modular monolith, outbox, role-plus-ownership checks, integer money and quote-before-confirmation rationales are reusable once their guarantees and contracts are corrected. A wholesale architecture rewrite is not justified by this audit.

## Checks performed and manual review

Performed: inventoried the working tree; read DD, Plan and Handover; extracted text from all 41 PDF pages; visually inspected PDF pp. 8–11, 17, 19, 21 and 24–30; compared figure versions, permissions, events, workflows and justifications. Counted 16 DD Mermaid figures and one Plan Mermaid diagram. Checked focused external claims against OMG, RabbitMQ and Node.js primary sources linked above.

Not performed: application build, unit/integration tests, browser automation, full Mermaid renderer validation, full print-layout inspection of every page, or original-rubric compliance verification. No executable application exists in this working tree. Source design files and existing Plan edits were preserved.

Manual review setup (macOS; no app start command applies):

```sh
cd /Users/umairhassan/Desktop/ead
open DOCUMENTATION_AUDIT.md
open SWIFTDROP_DESIGN_DOCUMENTATION.md
open plan.md
open SwiftDrop_Design_Report.pdf
```

1. Compare PDF pp. 8–11 with DD Figures 1–4. Expect to reproduce the differences in A1/A2 and the clipped labels in D1; after correction, expect identical relationships in both formats.
2. Trace booking → `parcel.created` → notification binding and status update → outbox → consumers. Expect B1/B2 to be resolved by explicit consistent guarantees and bindings.
3. Walk assignment for the same parcel twice, two different parcels competing for the final courier slot, and reassignment. Walk no-webhook, success, timeout, duplicate, restart, retry exhaustion and replay branches. Expect every branch to specify authorization, persistence, acknowledgement and outcome.
4. Agree on proof requirements, foreign-parcel status codes, attempt limits, cancellation and optional features. Expect one rule for each across diagrams, tables and Plan.
5. Review PDF diagrams at 100% and intended print size. Expect all labels/arrows readable without clipping. Viewport/responsive UI testing is not applicable until UI code exists.
6. Compare the resulting report with the original assignment brief when supplied. Expect a traceable section/figure for each assessed requirement; completeness remains unverified until then.
