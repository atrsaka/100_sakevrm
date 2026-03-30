# Release QA Inventory

## Release Context

- repository: `GeminiVRM`
- release tag: `v0.2.0`
- compare range: `v0.1.0..v0.2.0`
- requested outputs: GitHub release body rewrite, docs-backed release notes, companion walkthrough article, README and primary docs truth-sync
- validation commands run: `npm run lint`, `npm run build`, `npm run docs:build`, `$env:BASE_PATH='/GeminiVRM'; npm run build:pages`, `npm run e2e:smoke`, `powershell -ExecutionPolicy Bypass -File D:\Prj\gh-release-notes-skill\scripts\verify-svg-assets.ps1 -RepoPath . -Path public/favicon.svg,docs/public/releases/release-header-v0.2.0.svg`, `npm run verify:release-header-layout -- --input docs/public/releases/release-header-v0.2.0.svg`, `powershell -ExecutionPolicy Bypass -File D:\Prj\gh-release-notes-skill\scripts\verify-release-qa-inventory.ps1 -RepoPath . -Tag v0.2.0`, `gh release edit v0.2.0 --notes-file tmp/release-notes-v0.2.0.md`, `gh release view v0.2.0 --json url,body,publishedAt,tagName,targetCommitish`
- release URLs: `https://github.com/Sunwood-ai-labs/GeminiVRM/releases/tag/v0.2.0`, `https://sunwood-ai-labs.github.io/GeminiVRM/docs/releases/v0.2.0`, `https://sunwood-ai-labs.github.io/GeminiVRM/docs/ja/releases/v0.2.0`, `https://sunwood-ai-labs.github.io/GeminiVRM/docs/articles/v0.2.0-podcast-mode`, `https://sunwood-ai-labs.github.io/GeminiVRM/docs/ja/articles/v0.2.0-podcast-mode`

## Claim Matrix

| claim | code refs | validation refs | docs surfaces touched | scope |
| --- | --- | --- | --- | --- |
| `Podcast mode` adds a dual-host Yukito/Kiyoka stage with capped alternating turns from one topic | `src/pages/index.tsx`, `src/components/podcastStage.tsx`, `src/features/podcast/podcastConfig.ts`, `public/Yukito.vrm` | `npm run build`, `npm run e2e:smoke` | `README.md`, `README.ja.md`, `docs/getting-started.md`, `docs/ja/getting-started.md`, `docs/usage.md`, `docs/ja/usage.md` | podcast_runtime |
| Later podcast turns relay the previous speaker's audio into Gemini Live with transcript fallback when needed | `src/features/podcast/geminiLivePodcast.ts`, `src/pages/index.tsx` | `npm run build` | `README.md`, `README.ja.md`, `docs/usage.md`, `docs/ja/usage.md`, `docs/releases/v0.2.0.md`, `docs/ja/releases/v0.2.0.md` | podcast_audio_relay |
| The VRM runtime rotates bundled Mixamo idle and talking clips, keeps camera framing stable, and exposes browser automation through `window.geminiVrmControl` and `postMessage` | `src/features/vrmViewer/builtInMotions.ts`, `src/features/vrmViewer/viewer.ts`, `src/features/externalControl/geminiVrmExternalControl.ts`, `src/pages/index.tsx` | `npm run build` | `README.md`, `README.ja.md`, `docs/usage.md`, `docs/ja/usage.md`, `docs/releases/v0.2.0.md`, `docs/ja/releases/v0.2.0.md` | viewer_and_automation |
| The repository now publishes versioned `v0.2.0` release notes, companion walkthroughs, latest-release entry points, and a validated release header asset in both locales | `docs/releases/v0.2.0.md`, `docs/ja/releases/v0.2.0.md`, `docs/articles/v0.2.0-podcast-mode.md`, `docs/ja/articles/v0.2.0-podcast-mode.md`, `docs/public/releases/release-header-v0.2.0.svg`, `scripts/verify-release-header-layout.mjs`, `package.json` | `npm run docs:build`, `$env:BASE_PATH='/GeminiVRM'; npm run build:pages`, `powershell -ExecutionPolicy Bypass -File D:\Prj\gh-release-notes-skill\scripts\verify-svg-assets.ps1 -RepoPath . -Path public/favicon.svg,docs/public/releases/release-header-v0.2.0.svg` | `docs/index.md`, `docs/ja/index.md`, `docs/releases.md`, `docs/ja/releases.md`, `docs/articles.md`, `docs/ja/articles.md`, `docs/releases/v0.2.0.md`, `docs/ja/releases/v0.2.0.md`, `docs/articles/v0.2.0-podcast-mode.md`, `docs/ja/articles/v0.2.0-podcast-mode.md` | release_collateral |

## Steady-State Docs Review

| surface | status | evidence |
| --- | --- | --- |
| README.md | pass | Updated overview, features, docs links, verification, and latest `v0.2.0` pointers to match the shipped podcast, motion, and automation surfaces |
| README.ja.md | pass | Updated the Japanese overview, feature list, docs links, and latest `v0.2.0` pointers to match the same shipped surfaces |
| docs/index.md | pass | Added latest `v0.2.0` release-note and companion-guide entry points from the docs home |
| docs/ja/index.md | pass | Added the Japanese latest-release and companion-guide entry points from the locale home |
| docs/getting-started.md | pass | Added podcast-mode quick start and current setup wording |
| docs/ja/getting-started.md | pass | Added the Japanese podcast-mode quick start and current setup wording |
| docs/usage.md | pass | Synced podcast mode, motion runtime, automation hooks, and inbound-only YouTube relay wording to the shipped behavior |
| docs/ja/usage.md | pass | Synced the Japanese usage guide to the same shipped behavior and constraints |
| docs/releases.md | pass | Added the published `v0.2.0` entry and companion guide index link |
| docs/ja/releases.md | pass | Added the Japanese `v0.2.0` release entry and companion guide index link |
| docs/articles.md | pass | Added the `v0.2.0` podcast guide entry |
| docs/ja/articles.md | pass | Added the Japanese `v0.2.0` podcast guide entry |
| docs/releases/v0.2.0.md | pass | Added the English docs-backed `v0.2.0` release notes page with the published release header and validation section |
| docs/ja/releases/v0.2.0.md | pass | Added the Japanese docs-backed `v0.2.0` release notes page with the same scope and published release metadata |
| docs/articles/v0.2.0-podcast-mode.md | pass | Added the English companion walkthrough for podcast mode and linked it from the release note surface |
| docs/ja/articles/v0.2.0-podcast-mode.md | pass | Added the Japanese companion walkthrough for podcast mode and linked it from the locale release note surface |

## QA Inventory

| criterion_id | status | evidence |
| --- | --- | --- |
| compare_range | pass | `v0.1.0..v0.2.0`, with the published tag resolving to `475fc4eee4e005cb0b9f365ba2d1fbfa960ddd8e` |
| release_claims_backed | pass | Release note claims were limited to inspected podcast runtime, relay fallback, Mixamo motion runtime, external control, and release-collateral paths listed in the claim matrix |
| docs_release_notes | pass | `docs/releases/v0.2.0.md`, `docs/ja/releases/v0.2.0.md`, `docs/releases.md`, `docs/ja/releases.md` |
| companion_walkthrough | pass | `docs/articles/v0.2.0-podcast-mode.md`, `docs/ja/articles/v0.2.0-podcast-mode.md`, `docs/articles.md`, `docs/ja/articles.md` |
| operator_claims_extracted | pass | The claim matrix above records the operator-facing claims used in the docs-backed notes and GitHub release body |
| impl_sensitive_claims_verified | pass | Verified podcast relay fallback, motion runtime behavior, external-control gating, and inbound-only YouTube relay scope against the implementing code paths |
| steady_state_docs_reviewed | pass | README and primary operator docs review table completed above |
| claim_scope_precise | pass | The notes keep podcast mode scoped to turn-based exchange, relay fallback scoped to transcript continuation, automation scoped to browser control, and YouTube relay scoped to inbound-only flow |
| latest_release_links_updated | pass | Updated `README.md`, `README.ja.md`, `docs/index.md`, `docs/ja/index.md`, `docs/releases.md`, `docs/ja/releases.md`, `docs/articles.md`, and `docs/ja/articles.md` |
| svg_assets_validated | pass | `powershell -ExecutionPolicy Bypass -File D:\Prj\gh-release-notes-skill\scripts\verify-svg-assets.ps1 -RepoPath . -Path public/favicon.svg,docs/public/releases/release-header-v0.2.0.svg` and `npm run verify:release-header-layout -- --input docs/public/releases/release-header-v0.2.0.svg` |
| docs_assets_committed_before_tag | user_waived | The user explicitly required `v0.2.0` to be published from already-committed `HEAD` on `2026-03-31`, so the tag was intentionally not rewritten when the docs collateral was completed afterward |
| docs_deployed_live | pass | Live Pages verification covers the English/Japanese release notes, English/Japanese podcast guide, and the published release header asset URLs listed in Release Context |
| tag_local_remote | pass | `git rev-list -n 1 v0.2.0` and `git ls-remote --tags origin v0.2.0` confirm the published tag exists locally and on origin |
| github_release_verified | pass | `gh release view v0.2.0 --json url,body,publishedAt,tagName,targetCommitish` matches the edited release body and published release URL |
| validation_commands_recorded | pass | Release Context records every validation, release-edit, and verification command used in this completion pass |
| publish_date_verified | pass | `gh release view v0.2.0 --json publishedAt` returned `2026-03-30T16:43:53Z` |

## Notes

- blockers: none
- waivers: `docs_assets_committed_before_tag` remains a deliberate user waiver because the published tag was intentionally kept on the already-committed `HEAD`
- follow-up docs tasks: none for `v0.2.0`; unrelated uncommitted podcast runtime refactor work remains out of scope for this release collateral pass
