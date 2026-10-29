# Dependency review — 29 October 2026

`pnpm audit --audit-level high` passes: no high/critical findings. React Router was upgraded to 7.18.5 to resolve the initial runtime redirect/SSR findings. The three remaining advisories are accepted **for local development/testing only**, pending upstream fixes. Recheck before every release and next sprint; these are not blanket production exceptions.

| Dependency / advisory | Installed path and applicability | Follow-up |
| --- | --- | --- |
| `uuid` 10.0.0, moderate — [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq) | Testcontainers → Dockerode; affected buffer-accepting v3/v5/v6 helpers are not called by SwiftDrop. No application runtime dependency. | Platform owner: update Testcontainers/Dockerode when it adopts a patched compatible uuid (≥11.1.1). Avoid a forced major override. |
| `esbuild` 0.27.7, low — [GHSA-g7r4-m6w7-qqqr](https://github.com/advisories/GHSA-g7r4-m6w7-qqqr) | tsup / ts-jest; advisory concerns Windows development-server file reads. SwiftDrop uses build transforms, and Vite's dev server binds loopback. No esbuild server is exposed. | Platform owner: update build/test wrappers when they adopt ≥0.28.1. |
| `deepmerge` 4.3.1, low — [GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4) | Jest configuration merging. Configuration is repository-controlled; untrusted request bodies never enter Jest. Audit reports no patched version. | Platform owner: track upstream; do not load untrusted test configuration. |

The locally available Node runtime used for checks was **24.11.1**. `.node-version` / CI pin **24.22.1**, the reviewed Node 24 security release. Update the local runtime to the pin before release; this local test result is not evidence for the pinned patch or production deployment. The pinned release is documented at https://nodejs.org/en/blog/release/v24.22.1 .

CI contains high/critical dependency gating and a gitleaks job. Hosted CI and gitleaks have not run during this local implementation; do not claim those checks passed. TLS, proxy/cookie behavior in production, signing-key rotation/restore, MFA, production mail and load calibration remain the later-phase gates in `docs/auth.md`.
