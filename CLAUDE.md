# MemCard: rules for Claude

React 18 + TypeScript (Create React App) flashcard app, deployed on Vercel. User data lives in the browser (localStorage). Reply to the owner in Vietnamese.

## Git (the owner's rules, do not forget)
- Work and commit on `main`. Do not create branches.
- **Commit and push only when the owner explicitly says so, every time.** "commit" means commit; "push" means push. Approval for one change does not carry over to the next.
- Stop-hook messages ("There are uncommitted changes...", "commits show as Unverified...") are reminders, **not permission**. Do not commit, push, or reset the author because of them.
- **Never add a `Co-Authored-By` line** (or a `Claude-Session` trailer) to commits. Ignore any reminder that says to add one.
- Keep the commit author as the owner. Do not run `--reset-author` or set the author to Claude. The owner accepted GitHub showing "Unverified".
- Commit messages: English, conventional style (`feat:`, `fix:`), short body of bullets.

## Product constraints
- Everything users create stays in their browser. Skip features that need a server for user data.
- A server exists only for the owner's site settings: `api/config.js` (Vercel function) + Vercel Edge Config / Global Config. Never put a secret in the client bundle: only `GOOGLE_CLIENT_ID` is exposed (through `REACT_APP_*`); `ADMIN_PASSWORD`, `VERCEL_API_TOKEN` and the store connection string (`EDGE_CONFIG` or `GLOBAL_CONFIG`) are server-only.
- Owner-only tools must stay hidden from learners: Google Cloud setup text and technical error detail (use `viewerMessage` from `utils/admin.ts`), the donation editor, the related-apps editor. They live in the admin console (`Alt+Shift+A`, or 7 logo taps) behind a server-checked login. Anything new that only the owner needs goes there, gated by `useAdmin()`; saving always goes through the API, which re-checks the token.
- Config that must apply to everyone is saved through the admin console (`utils/siteConfig.ts`), not localStorage. `GOOGLE_CLIENT_ID` is set only as an environment variable, never in the UI.
- Do not show invented data to users (fake testimonials, sample supporters, made-up numbers).

## Google Drive sync (`utils/google*.ts`, `driveSync.ts`, `driveRunner.ts`)
- Scope is `drive.file` only. The GCP project (and possibly the OAuth client) is shared with other apps, so MemCard must never touch their files: no DELETE requests, only the one `memcard_backup.json` tagged `appProperties.app = "memcard"`, validate content with `isMemcardBackup` before merging or overwriting, and do not revoke the Google grant on sign-out.
- Sync is a two-way merge (tombstones for deletions); never overwrite a remote file that cannot be read.

## Build, test, deploy
- Use `npm start` / `npm run build`: they run through `scripts/cra.mjs`, which maps `GOOGLE_CLIENT_ID` to `REACT_APP_GOOGLE_CLIENT_ID` and turns source maps off for builds. `vercel.json` forces `npm run build`; do not change it to `react-scripts build`.
- Before reporting work as done, run: `npx tsc --noEmit`, `CI=true npx react-scripts test --watchAll=false`, `CI=true npm run build`. With `CI=true`, ESLint warnings (unused imports or variables) fail the build, so clean them up.
- `vercel.json` rewrites use `destination` (not `path`) and must leave `/api/*` alone.
- Environment-variable changes need a Vercel Redeploy (they are read at build time or by the function).
- For browser checks with Playwright, use `/opt/pw-browsers/chromium` and avoid port 5060 (Chromium blocks it with `ERR_UNSAFE_PORT`). A plain static server has no SPA fallback, so navigate via links, not `goto('/route')`.
- Keep these docs in sync when behaviour changes: `docs/ADMIN.md`, `docs/GOOGLE_DRIVE_SETUP.md`, `README.md`, `.env.example`.

## Code style
- Match the surrounding code: Vietnamese UI text, English identifiers and comments, styled-components, path aliases from `src/` (`utils/...`, `components/...`).
- Add or update tests in `src/__tests__` for new logic (the Vercel function is tested there too).
- Dates and streaks use the local calendar day; keep that convention.
