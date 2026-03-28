# Release QA Inventory

## Release Context

- repository: `GeminiVRM`
- release tag: `v0.1.0`
- compare range: `991bff6..v0.1.0` for the initial release with no previous tag
- requested outputs: GitHub release body, docs-backed release notes, companion walkthrough article
- validation commands run: `npm run lint`, `npm run build`, `npm run docs:build`, `$env:BASE_PATH='/GeminiVRM'; npm run build:pages`, `npm run e2e:smoke`, `powershell -ExecutionPolicy Bypass -File D:\Prj\gh-release-notes-skill\scripts\verify-svg-assets.ps1 -RepoPath . -Path public/repo-hero.svg,docs/public/releases/release-header-v0.1.0.svg`, `powershell -ExecutionPolicy Bypass -File D:\Prj\gh-release-notes-skill\scripts\verify-release-qa-inventory.ps1 -RepoPath . -Tag v0.1.0`, `git ls-remote --tags origin v0.1.0`, `gh release view v0.1.0 --json url,name,body,publishedAt,tagName,targetCommitish`
- release URLs: `https://github.com/Sunwood-ai-labs/GeminiVRM/releases/tag/v0.1.0`, `https://sunwood-ai-labs.github.io/GeminiVRM/docs/releases/v0.1.0`, `https://sunwood-ai-labs.github.io/GeminiVRM/docs/ja/releases/v0.1.0`, `https://sunwood-ai-labs.github.io/GeminiVRM/docs/articles/v0.1.0-launch`, `https://sunwood-ai-labs.github.io/GeminiVRM/docs/ja/articles/v0.1.0-launch`

## Claim Matrix

| claim | code refs | validation refs | docs surfaces touched | scope |
| --- | --- | --- | --- | --- |
| GeminiVRM ships browser-first VRM chat on Gemini Live native audio with streamed assistant text and audio playback in the active turn | `src/features/chat/geminiLiveChat.ts`, `src/pages/index.tsx`, `src/features/lipSync/lipSync.ts` | `npm run build`, `npm run e2e:smoke` | `README.md`, `README.ja.md` | app_runtime |
| The runtime includes bundled avatar loading, persisted settings, voice/model controls, and built-in idle motion presets with smoothing | `src/components/vrmViewer.tsx`, `src/components/settings.tsx`, `src/features/vrmViewer/builtInMotions.ts`, `src/features/vrmViewer/viewer.ts` | `npm run build` | `README.md`, `README.ja.md`, `docs/index.md`, `docs/ja/index.md` | viewer_settings |
| `Settings -> Streaming -> YouTube relay` receives inbound live chat comments into the app and can trigger local Gemini auto-replies without posting back to YouTube | `src/components/settings.tsx`, `src/components/youtubeLiveControlDeck.tsx`, `src/features/youtube/youTubeLiveClient.ts`, `src/pages/index.tsx` | `npm run build`, `npm run e2e:smoke` | `docs/usage.md`, `docs/ja/usage.md` | youtube_relay |
| The repository ships bilingual VitePress docs, GitHub Pages export wiring, GitHub Actions CI, and a lightweight smoke E2E path | `scripts/build-pages.mjs`, `scripts/e2e-smoke.mjs`, `.github/workflows/ci.yml`, `.github/workflows/pages.yml`, `package.json` | `npm run docs:build`, `$env:BASE_PATH='/GeminiVRM'; npm run build:pages` | `README.md`, `README.ja.md`, `docs/index.md`, `docs/ja/index.md` | delivery_docs |

## Steady-State Docs Review

| surface | status | evidence |
| --- | --- | --- |
| README.md | pass | Added the release-notes entry and rechecked the feature, deployment, and local-first wording against the inspected code paths |
| README.ja.md | pass | Added the Japanese release-notes entry and rechecked the relay/setup wording for the current Settings flow |
| docs/index.md | pass | Added the English Release Notes landing link so versioned notes are reachable from the docs home |
| docs/ja/index.md | pass | Added the Japanese Release Notes landing link from the locale home |
| docs/usage.md | pass | Reviewed the `Settings -> Streaming -> YouTube relay` wording against the current runtime and confirmed no steady-state change was needed |
| docs/ja/usage.md | pass | Reviewed the Japanese relay usage wording against the current runtime and confirmed no steady-state change was needed |

## QA Inventory

| criterion_id | status | evidence |
| --- | --- | --- |
| compare_range | pass | `991bff6..v0.1.0` for the published initial release, with no previous tag available |
| release_claims_backed | pass | Release collector output, inspected implementation files, and the claim matrix rows above back every shipped claim in the draft notes |
| docs_release_notes | pass | `docs/releases.md`, `docs/releases/v0.1.0.md`, `docs/ja/releases.md`, `docs/ja/releases/v0.1.0.md` |
| companion_walkthrough | pass | `docs/articles/v0.1.0-launch.md`, `docs/ja/articles/v0.1.0-launch.md` |
| operator_claims_extracted | pass | The claim matrix above records the operator-facing release claims and their evidence |
| impl_sensitive_claims_verified | pass | Verified Gemini Live, lip sync, microphone, YouTube relay, Pages export, and smoke E2E behavior against the implementing code paths |
| steady_state_docs_reviewed | pass | README and steady-state docs review table completed above |
| claim_scope_precise | pass | The notes keep YouTube relay scoped to inbound comments and in-app auto-replies, not YouTube chat posting or video uplink |
| latest_release_links_updated | pass | Added release-note entry points in `README.md`, `README.ja.md`, `docs/index.md`, `docs/ja/index.md`, and `docs/.vitepress/config.mjs` |
| svg_assets_validated | pass | `powershell -ExecutionPolicy Bypass -File D:\Prj\gh-release-notes-skill\scripts\verify-svg-assets.ps1 -RepoPath . -Path public/repo-hero.svg,docs/public/releases/release-header-v0.1.0.svg` |
| docs_assets_committed_before_tag | pass | The release docs, draft body, QA inventory, and release header asset were committed before any `v0.1.0` tag was created |
| docs_deployed_live | pass | Verified live 200 responses for the English/Japanese release notes, English/Japanese launch guides, and the published release header asset |
| tag_local_remote | pass | `git ls-remote --tags origin v0.1.0` and local tag inspection confirm `v0.1.0` exists locally and on origin |
| github_release_verified | pass | `gh release view v0.1.0 --json url,name,body,publishedAt,tagName,targetCommitish` matches the published body and URL |
| validation_commands_recorded | pass | The Release Context records every validation command run for this draft |
| publish_date_verified | pass | `gh release view v0.1.0 --json publishedAt` returned `2026-03-28T05:12:18Z` |

## Notes

- blockers: none
- waivers: none
- verification provenance: the fresh-port smoke rerun came from the docs/tooling audit seat because detached dev-server launch from the main shell was blocked by command policy
- follow-up docs tasks: replace draft doc paths in `tmp/release-notes-v0.1.0.md` with live Pages URLs after the tag is created and docs are deployed
