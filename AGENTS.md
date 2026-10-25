# Agent Rules

## Working agreement

- Inspect the existing project structure, conventions, and relevant files before changing code.
- Make the smallest complete change that solves the requested problem. Reuse existing patterns and dependencies before adding new ones.
- Keep code readable, modular, and easy to remove or extend. Avoid speculative abstractions, duplicate logic, and unnecessary dependencies.
- Preserve unrelated user changes. Never overwrite or delete files unless the task explicitly requires it.
- Explain important assumptions, trade-offs, limitations, and any deferred work in the final handoff.

## Testing and verification

- Use deterministic checks that fit the project, such as type checks, linters, unit tests, build checks, and focused scripts.
- Do not use Selenium or browser automation for testing.
- Do not claim that a feature is manually verified when it has not been verified by the user.
- After each implementation iteration, provide a concise manual test plan with:
  - exact setup or start commands;
  - the screen, route, or feature to open;
  - numbered actions;
  - expected results;
  - important edge cases, responsive states, and failure states to check.
- Report what was checked, what was not checked, and any remaining risk.

## UI and UX

- Prefer clear hierarchy, predictable interactions, useful feedback, and sensible defaults.
- Design loading, empty, success, validation, permission, offline, and error states deliberately.
- Make keyboard navigation, focus visibility, labels, contrast, semantic structure, and reduced-motion behavior work from the start.
- Use responsive layouts that remain usable on small screens and large screens without hiding essential actions.
- Keep interaction feedback immediate and understandable; prevent duplicate submissions and accidental destructive actions.

## Security and reliability

- Treat all external input as untrusted. Validate at trust boundaries and encode or parameterize output appropriately.
- Keep secrets, tokens, private data, and credentials out of source code, logs, client bundles, and committed files.
- Use least privilege, safe defaults, explicit authorization checks, and useful error handling without leaking sensitive details.
- Protect data integrity: handle retries, partial failures, invalid state, concurrency, and destructive operations deliberately.

## Efficiency, free-tier cost, and scalability

- Prefer platform features and installed dependencies over new services or packages.
- Minimize network requests, payload size, repeated work, unnecessary renders, and unbounded data loading.
- Use pagination, caching, debouncing, batching, and lazy loading when they solve a demonstrated or likely scale problem without obscuring the code.
- Design free-tier usage deliberately: avoid paid-only infrastructure, hidden usage multipliers, and unnecessary background polling unless absolutely necessary.
- Keep boundaries replaceable so storage, APIs, and hosting can scale later without premature complexity.

## Completion standard

A task is complete only when the requested behavior is implemented, relevant automated checks pass or their limitations are stated, the changed code is reviewed for security and accessibility risks, and the final response includes the manual testing instructions the user should run.

## handover.md modify after each complete phase of code implementation/iteration
after implementing a phase of the project the agent should update the handover.md file with the following information:
- summary of changes
- issues identified
- issues that were not resolved
- future work needed
- any other infiormation required for future phases