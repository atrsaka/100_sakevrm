# Release QA Inventory

## Release Context

- repository: `GeminiVRM`
- release tag: `v0.3.0`
- compare range: `v0.2.0..v0.3.0`
- requested outputs: GitHub release body, docs-backed release notes, companion walkthrough article, README and primary docs truth-sync
- validation commands run: `npm run lint`, `npm run build`, `npm run docs:build`, `$env:BASE_PATH='/GeminiVRM'; npm run build:pages`, `npm run e2e:smoke`, `npm run e2e:podcast`, `node scripts/verify-podcast-benchmark-layout.mjs --input docs/public/benchmarks/podcast-benchmark-en.svg`, `node scripts/verify-podcast-benchmark-layout.mjs --input docs/public/benchmarks/podcast-benchmark-ja.svg`, `powershell -ExecutionPolicy Bypass -File D:\Prj\gh-release-notes-skill\scripts\verify-svg-assets.ps1 -RepoPath . -Path public/favicon.svg,docs/public/releases/release-header-v0.3.0.svg`, `npm run verify:release-header-layout -- --input docs/public/releases/release-header-v0.3.0.svg`, `gh run watch 24147841490 --exit-status`, `gh release create v0.3.0 --title "v0.3.0" --notes-file tmp/release-notes-v0.3.0.md`, `gh release edit v0.3.0 --notes-file tmp/release-notes-v0.3.0.md`, `gh release view v0.3.0 --json url,body,publishedAt,tagName,targetCommitish,name`
- release URLs: `https://github.com/Sunwood-ai-labs/GeminiVRM/releases/tag/v0.3.0`, `https://sunwood-ai-labs.github.io/GeminiVRM/docs/releases/v0.3.0`, `https://sunwood-ai-labs.github.io/GeminiVRM/docs/ja/releases/v0.3.0`, `https://sunwood-ai-labs.github.io/GeminiVRM/docs/articles/v0.3.0-runtime-and-benchmark-guide`, `https://sunwood-ai-labs.github.io/GeminiVRM/docs/ja/articles/v0.3.0-runtime-and-benchmark-guide`

## Claim Matrix

| claim | code refs | validation refs | docs surfaces touched | scope |
| --- | --- | --- | --- | --- |
| Character chat and podcast mode now target `gemini-3.1-flash-live-preview`, send text through the realtime Gemini Live path, and no longer auto-fall back to older preview models | `.env.example`, `src/features/chat/geminiLiveConfig.ts`, `src/features/chat/geminiLiveChat.ts`, `src/components/settings.tsx` | `npm run build`, `npm run e2e:smoke` | `README.md`, `README.ja.md`, `docs/releases/v0.3.0.md`, `docs/ja/releases/v0.3.0.md`, `docs/articles/v0.3.0-runtime-and-benchmark-guide.md`, `docs/ja/articles/v0.3.0-runtime-and-benchmark-guide.md` | live_runtime |
| `v0.3.0` introduces the streaming podcast relay path itself, and the checked-in benchmark snapshot shows `1.22s` vs `10.91s` first audio (`8.94x` faster) plus `2.30s` vs `11.91s` handoff silence (`5.18x` shorter) | `src/features/podcast/geminiLivePodcast.ts`, `src/pages/index.tsx`, `scripts/e2e-podcast-relay.mjs`, `scripts/benchmark-podcast-relay.mjs`, `scripts/build-podcast-benchmark-report.mjs`, `docs/public/benchmarks/podcast-benchmark-overview.json` | `npm run e2e:podcast`, `node scripts/verify-podcast-benchmark-layout.mjs --input docs/public/benchmarks/podcast-benchmark-en.svg`, `node scripts/verify-podcast-benchmark-layout.mjs --input docs/public/benchmarks/podcast-benchmark-ja.svg` | `docs/podcast-benchmark.md`, `docs/ja/podcast-benchmark.md`, `docs/releases/v0.3.0.md`, `docs/ja/releases/v0.3.0.md`, `docs/articles/v0.3.0-runtime-and-benchmark-guide.md`, `docs/ja/articles/v0.3.0-runtime-and-benchmark-guide.md` | podcast_streaming_and_benchmarking |
| Message labels, settings radio groups, and speech-recognition typing were tightened for clearer operator-visible behavior | `src/components/chatLog.tsx`, `src/components/settings.tsx`, `src/components/messageInputContainer.tsx`, `src/features/messages/messages.ts` | `npm run build`, `npm run e2e:smoke` | `docs/releases/v0.3.0.md`, `docs/ja/releases/v0.3.0.md`, `docs/articles/v0.3.0-runtime-and-benchmark-guide.md`, `docs/ja/articles/v0.3.0-runtime-and-benchmark-guide.md` | accessibility_and_labels |
| The repository now ships validated `v0.3.0` release collateral in both locales, with live docs URLs, a verified release header, and updated latest-release entry points | `docs/releases/v0.3.0.md`, `docs/ja/releases/v0.3.0.md`, `docs/articles/v0.3.0-runtime-and-benchmark-guide.md`, `docs/ja/articles/v0.3.0-runtime-and-benchmark-guide.md`, `docs/public/releases/release-header-v0.3.0.svg`, `README.md`, `README.ja.md`, `docs/index.md`, `docs/ja/index.md`, `docs/releases.md`, `docs/ja/releases.md`, `docs/articles.md`, `docs/ja/articles.md` | `npm run docs:build`, `$env:BASE_PATH='/GeminiVRM'; npm run build:pages`, `powershell -ExecutionPolicy Bypass -File D:\Prj\gh-release-notes-skill\scripts\verify-svg-assets.ps1 -RepoPath . -Path public/favicon.svg,docs/public/releases/release-header-v0.3.0.svg`, `npm run verify:release-header-layout -- --input docs/public/releases/release-header-v0.3.0.svg`, `gh run watch 24147841490 --exit-status`, `gh release view v0.3.0 --json url,body,publishedAt,tagName,targetCommitish,name` | `README.md`, `README.ja.md`, `docs/index.md`, `docs/ja/index.md`, `docs/releases.md`, `docs/ja/releases.md`, `docs/articles.md`, `docs/ja/articles.md`, `docs/releases/v0.3.0.md`, `docs/ja/releases/v0.3.0.md`, `docs/articles/v0.3.0-runtime-and-benchmark-guide.md`, `docs/ja/articles/v0.3.0-runtime-and-benchmark-guide.md` | release_collateral |

## Steady-State Docs Review

| surface | status | evidence |
| --- | --- | --- |
| README.md | pass | Updated the latest release-note / companion-guide pointers so the root README lands on the `v0.3.0` release collateral |
| README.ja.md | pass | Updated the Japanese README to point at the `v0.3.0` release note and runtime guide |
| docs/index.md | pass | Updated the docs home to point at the latest `v0.3.0` release note and runtime guide |
| docs/ja/index.md | pass | Updated the Japanese docs home to point at the latest `v0.3.0` release note and runtime guide |
| docs/releases.md | pass | Added the published `v0.3.0` feature-release entry and companion walkthrough link |
| docs/ja/releases.md | pass | Added the Japanese `v0.3.0` feature-release entry and companion walkthrough link |
| docs/articles.md | pass | Added the `v0.3.0` runtime/benchmark companion guide entry |
| docs/ja/articles.md | pass | Added the Japanese `v0.3.0` runtime/benchmark companion guide entry |
| docs/releases/v0.3.0.md | pass | Added the English docs-backed `v0.3.0` release notes page with live GitHub release/docs links and validation section |
| docs/ja/releases/v0.3.0.md | pass | Added the Japanese docs-backed `v0.3.0` release notes page with the same scoped claims and validation inventory |
| docs/articles/v0.3.0-runtime-and-benchmark-guide.md | pass | Added the English companion guide covering the 3.1 runtime path and benchmark workflow |
| docs/ja/articles/v0.3.0-runtime-and-benchmark-guide.md | pass | Added the Japanese companion guide covering the same runtime and benchmark workflow |
| docs/podcast-benchmark.md | pass | Reviewed the benchmark report and kept it unchanged because its tracked numbers, rebuild flow, and caveats already matched the shipped snapshot referenced by `v0.3.0` |
| docs/ja/podcast-benchmark.md | pass | Reviewed the Japanese benchmark report and kept it unchanged for the same reason as the English page |
| docs/usage.md | pass | Reviewed the runtime wording and kept it unchanged because the current 3.1 model requirement and relay-error behavior were already documented before this release pass |
| docs/ja/usage.md | pass | Reviewed the Japanese usage guide and kept it unchanged because the relevant runtime wording was already current |
| docs/troubleshooting.md | pass | Reviewed the troubleshooting page and kept it unchanged because the invalid-argument and benchmark temp-dir guidance already matched `v0.3.0` |
| docs/ja/troubleshooting.md | pass | Reviewed the Japanese troubleshooting page and kept it unchanged because the same runtime and benchmark guidance was already current |

## QA Inventory

| criterion_id | status | evidence |
| --- | --- | --- |
| compare_range | pass | `v0.2.0..v0.3.0`, with `git rev-list -n 1 v0.3.0` resolving to `5cb9c6bab57c8d71da1a9dfa43471af49cd756ec` |
| release_claims_backed | pass | Release claims were limited to the inspected runtime, relay benchmarking, accessibility, and docs-collateral paths listed in the claim matrix |
| docs_release_notes | pass | `docs/releases/v0.3.0.md`, `docs/ja/releases/v0.3.0.md`, `docs/releases.md`, `docs/ja/releases.md` |
| companion_walkthrough | pass | `docs/articles/v0.3.0-runtime-and-benchmark-guide.md`, `docs/ja/articles/v0.3.0-runtime-and-benchmark-guide.md`, `docs/articles.md`, `docs/ja/articles.md` |
| operator_claims_extracted | pass | The claim matrix above records the operator-facing claims used in the docs-backed notes and GitHub release body |
| impl_sensitive_claims_verified | pass | Verified the realtime input path, no-fallback model behavior, prepared relay flow, and relay E2E/benchmark outputs against the implementing code paths and current validation runs |
| steady_state_docs_reviewed | pass | README and primary docs review table completed above, with unchanged benchmark/usage/troubleshooting pages explicitly recorded |
| claim_scope_precise | pass | Notes keep the 3.1 requirement scoped to the active runtime path, podcast mode scoped to turn-based exchange, and benchmark numbers scoped to the checked-in three-topic snapshot |
| latest_release_links_updated | pass | Updated `README.md`, `README.ja.md`, `docs/index.md`, `docs/ja/index.md`, `docs/releases.md`, `docs/ja/releases.md`, `docs/articles.md`, and `docs/ja/articles.md` |
| svg_assets_validated | pass | `powershell -ExecutionPolicy Bypass -File D:\Prj\gh-release-notes-skill\scripts\verify-svg-assets.ps1 -RepoPath . -Path public/favicon.svg,docs/public/releases/release-header-v0.3.0.svg` and `npm run verify:release-header-layout -- --input docs/public/releases/release-header-v0.3.0.svg` |
| docs_assets_committed_before_tag | pass | Release collateral commit `5cb9c6bab57c8d71da1a9dfa43471af49cd756ec` was pushed to `main`, GitHub Pages was verified live, and only then was tag `v0.3.0` created and pushed |
| docs_deployed_live | pass | `https://sunwood-ai-labs.github.io/GeminiVRM/docs/releases/v0.3.0`, `https://sunwood-ai-labs.github.io/GeminiVRM/docs/articles/v0.3.0-runtime-and-benchmark-guide`, `https://sunwood-ai-labs.github.io/GeminiVRM/docs/ja/releases/v0.3.0`, `https://sunwood-ai-labs.github.io/GeminiVRM/docs/ja/articles/v0.3.0-runtime-and-benchmark-guide`, and `https://sunwood-ai-labs.github.io/GeminiVRM/docs/releases/release-header-v0.3.0.svg` all returned HTTP 200 after `gh run watch 24147841490 --exit-status` |
| tag_local_remote | pass | `git rev-list -n 1 v0.3.0` returned `5cb9c6bab57c8d71da1a9dfa43471af49cd756ec` and `git ls-remote origin "refs/tags/v0.3.0^{}"` returned the same commit on origin |
| github_release_verified | pass | `gh release view v0.3.0 --json url,body,publishedAt,tagName,targetCommitish,name` matched the final edited body, published URL, and `publishedAt` timestamp |
| validation_commands_recorded | pass | Release Context records every build, E2E, live-doc verification, and GitHub release command used in this release pass |
| publish_date_verified | pass | `gh release view v0.3.0 --json publishedAt` returned `2026-04-08T16:58:47Z`, reflected as `2026-04-09 01:58 JST` in the final release body |

## Notes

- blockers: none
- waivers: none
- follow-up docs tasks: GitHub Actions emitted a Node 20 deprecation warning for `actions/upload-artifact@v4` during the Pages workflow, but the deploy completed successfully and this did not block `v0.3.0`
