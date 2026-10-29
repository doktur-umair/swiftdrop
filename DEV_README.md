# SwiftDrop — Developer Onboarding & Git Workflow Guide

Welcome to SwiftDrop! This document covers the required local setup, git branching conventions, and AI agent coordination protocol.

---

## 1. Initial Local Setup

### Prerequisites
- **Node.js**: v20+ (check `.node-version`)
- **Package Manager**: `pnpm` (v9+)
- **Docker & Docker Compose**: For local PostgreSQL, Redis, and RabbitMQ dependencies

### Step-by-Step
1. **Clone the repository:**
   ```bash
   git clone <REPO_URL>
   cd ead
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   *(Update any local secrets or database credentials in `.env` if needed).*

3. **Install dependencies:**
   ```bash
   pnpm install
   ```

4. **Verify local services (Optional / As needed for your slice):**
   ```bash
   docker compose up -d
   ```

---

## 2. Member ID & AI Agent Identity Configuration

Our project uses **10 vertical slices (M01 to M10)** defined in [plan.md §4](plan.md#4-team-structure-and-ownership). All handover notes, checkpoints, and coordination are tracked centrally in [handover.md](handover.md) and governed by [AGENTS.md](AGENTS.md).

### What you must do before writing code:
1. **Identify your Member ID (M01–M10)** based on your assigned deliverable:
   - **M01**: Identity, access & user admin (doktur-umair / `umair-dev`)
   - **M02**: Merchant platform
   - **M03**: Pricing, zones & reports
   - **M04**: Customer booking & parcel records
   - **M05**: Parcel lifecycle, cancellation & public tracking
   - **M06**: Dispatch & courier capacity
   - **M07**: Courier delivery & offline PWA
   - **M08**: Eventing & webhook delivery
   - **M09**: Notifications & realtime
   - **M10**: Platform kernel & web foundation

2. **Create your dedicated branch:**
   ```bash
   # Branch naming format: <your-name>-dev or codex/m0X/<task>
   git checkout -b <your-branch-name>
   git push -u origin <your-branch-name>
   ```

3. **Prompt your AI coding agent (Antigravity / Cursor / Claude Code):**
   In the very first prompt in your AI agent session, send the following prompt:
   > *"I am working as **Member <M0X>** (<Your Name>). My working branch is **`<your-branch-name>`**. Please register my identity in the table in `AGENTS.md`, and record all my future handover checkpoints exclusively in the `<a id=\"m0X\"></a> ## M0X` section of `handover.md`. Do not overwrite other members' sections or legacy entries."*

   **Why this is mandatory:** 
   This prevents your AI agent from hallucinating identity or editing someone else's section in `handover.md`. The agent will maintain your personal log of implemented features, tests, and manual verification steps in your section.

---

## 3. Daily Git Workflow

### ⚠️ Golden Rules
1. **NEVER push directly to `main`**.
2. **Push ONLY to your own remote branch**.
3. **Always pull & merge `origin/main` into your local branch before pushing.**

---

### Step-by-Step Push Routine

Before pushing any changes to GitHub, execute these steps in order:

#### Step 1: Save & commit your current work on your branch
```bash
git status
git add .
git commit -m "feat(<module>): brief description of changes"
```

#### Step 2: Fetch the latest changes from `main`
```bash
git fetch origin main
```

#### Step 3: Merge `main` into your local branch
```bash
git merge origin/main
```
- If there are **no conflicts**: Git will auto-merge cleanly.
- If there are **merge conflicts**: 
  1. Open the highlighted files in VS Code / your IDE.
  2. Resolve the conflicts by selecting the appropriate code.
  3. Save the files.
  4. Run `git add <resolved-files>` and `git commit -m "merge: resolve conflicts with main"`.

#### Step 4: Run local verification / build
Make sure you didn't break the build before sharing code:
```bash
pnpm build
# or run the tests for your module
```

#### Step 5: Push to your dedicated branch
```bash
git push origin <your-branch-name>
```

---

## 4. Pull Requests (PRs) & Merging to `main`

1. Once your feature or vertical slice is working and verified:
   - Go to GitHub and open a **Pull Request (PR)**:
     - **Base**: `main`
     - **Compare**: `<your-branch-name>`
2. Fill out the PR description with:
   - Your Member ID (e.g. M02)
   - Slices / modules touched
   - Manual test instructions (copy from your section in `handover.md`)
3. Request review from the team before merging.

---

## 5. Troubleshooting & Useful Tips

- **Need to pull latest changes while having unfinished local edits?**
  ```bash
  git stash
  git fetch origin main
  git merge origin/main
  git stash pop
  ```

- **Accidentally committed on `main` instead of your branch?**
  Do not push! Move your commit to your branch:
  ```bash
  git branch <your-branch-name>       # creates/updates your branch with your commit
  git reset --hard origin/main         # resets local main back to remote main
  git checkout <your-branch-name>     # switches to your branch
  ```

- **Check which branch you are on:**
  ```bash
  git branch --show-current
  ```
