# ポッドキャストベンチマーク レポート

このページでは、自然な日本語トピックで回した podcast benchmark の最新結果と、英語版 / 日本語版チャートを再生成する手順をまとめています。

<img src="/benchmarks/podcast-benchmark-ja.svg" alt="日本語ポッドキャストベンチマークチャート" />

## 条件

- トピック: `きょうのご飯`, `AGI`, `AIの心`
- 会話長: `6` ターン
- 反復回数: 各モード `3` 回
- グラフの主指標: `最初の音声が出るまで`, `話者切り替えの無音`
- 右カードの補助指標: 上記 2 指標の分散

## 最新結果

| 指標 | Streaming | Batch | 改善 | 相対効果 |
| --- | ---: | ---: | ---: | ---: |
| 初回音声の平均 | 1.22s | 10.91s | 9.70s短縮 | 約 8.94x 高速 / 88.9% 低遅延 |
| 切り替え無音の平均 | 2.30s | 11.91s | 9.61s短縮 | 約 5.18x 短縮 / 80.7% 低遅延 |

### トピック別の平均

| トピック | 初回音声 `S / B` | 切り替え無音 `S / B` |
| --- | ---: | ---: |
| きょうのご飯 | 3.13s / 13.62s | 4.23s / 14.54s |
| AGI | 0.11s / 9.72s | 1.45s / 10.67s |
| AIの心 | 0.41s / 9.41s | 1.23s / 10.52s |

### トピック別の分散

| トピック | 初回音声の分散 `S / B` | 切り替え無音の分散 `S / B` |
| --- | ---: | ---: |
| きょうのご飯 | 0.60 / 1.29 s² | 0.98 / 1.12 s² |
| AGI | 0.04 / 0.04 s² | 0.57 / 0.21 s² |
| AIの心 | 0.33 / 1.29 s² | 0.24 / 1.35 s² |

## 再生成コマンド

```bash
npm run report:podcast-benchmark
npm run verify:podcast-benchmark-layout
```

生成される主な出力:

- `.tmp-benchmark-podcast-topics-natural/report/podcast-benchmark-overview.json`
- `.tmp-benchmark-podcast-topics-natural/report/podcast-benchmark-overview.en.svg`
- `.tmp-benchmark-podcast-topics-natural/report/podcast-benchmark-overview.en.png`
- `.tmp-benchmark-podcast-topics-natural/report/podcast-benchmark-overview.ja.svg`
- `.tmp-benchmark-podcast-topics-natural/report/podcast-benchmark-overview.ja.png`
- `docs/public/benchmarks/podcast-benchmark-overview.json`
- `docs/public/benchmarks/podcast-benchmark-history.json`
- `docs/public/benchmarks/podcast-benchmark-history.csv`
- `docs/public/benchmarks/podcast-benchmark-en.svg`
- `docs/public/benchmarks/podcast-benchmark-ja.svg`

## 追跡している履歴データ

履歴の JSON / CSV には、ベンチマーク結果を追跡するために次の項目を保存します。

| 項目 | 内容 |
| --- | --- |
| `generatedAt` | レポートを生成した ISO timestamp |
| `benchmarkKey` | このベンチ条件を表す固定キー |
| `gitSha` | 生成時点の短い Git commit SHA |
| `sourceKind` | fresh local artifacts から作ったか、stable snapshot fallback から作ったか |
| `topics` | 使ったトピック一覧 |
| `firstAudioStreamingSec` | 初回音声の overall streaming mean |
| `firstAudioBatchSec` | 初回音声の overall batch mean |
| `firstAudioGainSec` | 初回音声の絶対改善量 |
| `firstAudioGainPct` | 初回音声の相対改善率 |
| `handoffStreamingSec` | 切り替え無音の overall streaming mean |
| `handoffBatchSec` | 切り替え無音の overall batch mean |
| `handoffGainSec` | 切り替え無音の絶対改善量 |
| `handoffGainPct` | 切り替え無音の相対改善率 |

## レイアウト検知

`npm run verify:podcast-benchmark-layout` は EN / JA の両 SVG に対して次を確認します。

- `data-fit-boundary` が付いていない `text`
- 文字の枠外はみ出し
- 同じ境界内での文字同士の重なり

現時点の出力は、英語版・日本語版ともにこの検知を通過しています。

## 注意点

- AGI は、temp-dir 修正前に最初の成功 run の artifact folder が上書きされたため、保存していた console の run mean を 1 本だけ使っています。
- チャート生成は最新のローカル benchmark artifact を優先して読みます。raw temp file が無いときは `docs/public/benchmarks/podcast-benchmark-overview.json` の stable snapshot にフォールバックします。
