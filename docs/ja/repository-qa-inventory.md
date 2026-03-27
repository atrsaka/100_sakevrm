---
title: Repository QA Inventory
---

# Repository QA Inventory

## Requested Deliverables

- 公開向け docs surface を完全整備する
- 英語と日本語で辿れる VitePress docs を揃える
- README、docs navigation、Pages publishing、local commands を一致させる
- docs polish を検証、commit、push、Pages readiness まで持っていく

## Delivered User-Facing Artifacts

- `README.md`
- `README.ja.md`
- `docs/index.md`
- `docs/getting-started.md`
- `docs/usage.md`
- `docs/architecture.md`
- `docs/deployment.md`
- `docs/troubleshooting.md`
- `docs/repository-qa-inventory.md`
- `docs/ja/index.md`
- `docs/ja/getting-started.md`
- `docs/ja/usage.md`
- `docs/ja/architecture.md`
- `docs/ja/deployment.md`
- `docs/ja/troubleshooting.md`
- `docs/ja/repository-qa-inventory.md`
- `docs/.vitepress/config.mjs`
- `package.json`

## Confirmed Claims

- README から英日 docs 導線が分かる
- VitePress docs に英日 locale 導線がある
- docs surface が home、getting started、usage、architecture、deployment、troubleshooting、QA inventory を含む
- docs の local development / build / preview / Pages build 手順が文書化されている
- Pages docs URL の前提が現在の repo 名と出力構造に一致している
- 旧来のフラットな日本語ページを `docs/ja/` 構成へ整理した
- docs build、docs preview、app build、Pages-oriented build がローカルで検証されている

## Local Verification Results

Verification date: `2026-03-27`

- `npm run docs:build`
  - passed
- `npm run docs:preview`
  - `http://127.0.0.1:4174/` で `GeminiVRM Documentation` を返すことを確認
- `npm run build`
  - passed
- `BASE_PATH=/GeminiVRM NEXT_EXPORT=true npm run build:pages`
  - passed
  - `.next-pages/docs/index.html` を生成
  - `.next-pages/docs/ja/index.html` を生成
  - app root output に `/GeminiVRM/docs/` への `Docs` リンクを含むことを確認

## Content and Structure Checks

- README 英日 docs links、commands、structure
- VitePress config の nav/sidebar/locale path coherence
- 英語ページ: home、getting started、usage、architecture、deployment、troubleshooting、QA inventory
- 日本語ページ: home、getting started、usage、architecture、deployment、troubleshooting、QA inventory
- intended docs structure から orphaned locale pages がない
- 旧 `docs/architecture.ja.md` と `docs/deployment.ja.md` を削除し、`docs/ja/...` に統合
