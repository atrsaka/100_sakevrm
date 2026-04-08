# Podcast Benchmark Report

This page captures the current bilingual chart workflow for the natural Japanese podcast benchmark and the headline results from the latest measured run set.

<img src="/benchmarks/podcast-benchmark-en.svg" alt="English podcast benchmark chart" />

## Scope

- Topics: `Today's Meal`, `AGI`, `AI Consciousness`
- Conversation length: `6` turns per run
- Repetitions: `3` runs per mode
- Reported chart metrics: first audio delay and handoff silence
- Supporting card metrics: per-topic variance for the same two latency measures

## Current Results

| Metric | Streaming | Batch | Gain | Relative |
| --- | ---: | ---: | ---: | ---: |
| First audio mean | 1.22s | 10.91s | 9.70s faster | 8.94x faster / 88.9% lower |
| Handoff mean | 2.30s | 11.91s | 9.61s faster | 5.18x shorter / 80.7% lower |

### Per-topic means

| Topic | First audio `S / B` | Handoff `S / B` |
| --- | ---: | ---: |
| Today's Meal | 3.13s / 13.62s | 4.23s / 14.54s |
| AGI | 0.11s / 9.72s | 1.45s / 10.67s |
| AI Consciousness | 0.41s / 9.41s | 1.23s / 10.52s |

### Per-topic variance

| Topic | First audio variance `S / B` | Handoff variance `S / B` |
| --- | ---: | ---: |
| Today's Meal | 0.60 / 1.29 s² | 0.98 / 1.12 s² |
| AGI | 0.04 / 0.04 s² | 0.57 / 0.21 s² |
| AI Consciousness | 0.33 / 1.29 s² | 0.24 / 1.35 s² |

## Rebuild

```bash
npm run report:podcast-benchmark
npm run verify:podcast-benchmark-layout
```

The report builder writes:

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

## Tracked History Data

The longitudinal tracking files store one row or entry per generated benchmark snapshot.

| Field | Meaning |
| --- | --- |
| `generatedAt` | ISO timestamp for the generated report |
| `benchmarkKey` | Stable identifier for this benchmark recipe |
| `gitSha` | Short Git commit SHA when the report was generated |
| `sourceKind` | Whether the report came from fresh local artifacts or the stable snapshot fallback |
| `topics` | Topic set used for the benchmark |
| `firstAudioStreamingSec` | Overall streaming mean for first audio delay |
| `firstAudioBatchSec` | Overall batch mean for first audio delay |
| `firstAudioGainSec` | Absolute improvement for first audio delay |
| `firstAudioGainPct` | Relative improvement for first audio delay |
| `handoffStreamingSec` | Overall streaming mean for handoff silence |
| `handoffBatchSec` | Overall batch mean for handoff silence |
| `handoffGainSec` | Absolute improvement for handoff silence |
| `handoffGainPct` | Relative improvement for handoff silence |

## Layout Verification

`npm run verify:podcast-benchmark-layout` checks both localized SVG files for:

- missing `data-fit-boundary` annotations on text nodes
- text overflow outside the assigned boundary
- text-on-text overlap inside the same boundary

The current outputs pass that verifier for both English and Japanese.

## Caveats

- The AGI report still depends on one preserved successful run mean from console logs because the original first artifact folder was overwritten before the temp-dir fix.
- The chart generator prefers the latest local benchmark artifacts. When those raw temp files are gone, it falls back to the stable snapshot at `docs/public/benchmarks/podcast-benchmark-overview.json`.
