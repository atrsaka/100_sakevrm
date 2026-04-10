/**
 * ドキュメントグラウンディング用のシステムプロンプト構築
 * チャット / ポッドキャスト両方で使用
 */

import type { DocumentContent } from "./documentParser";
import type { PodcastParticipant } from "../podcast/podcastConfig";

// ──────────────────────────────────────
// 共通: ドキュメントグラウンディングルール
// ──────────────────────────────────────

const GROUNDING_RULES = `## ドキュメントグラウンディングルール
あなたには参考ドキュメントが提供されています。以下を厳守してください:
- ドキュメントに明示的に記載されている情報のみに基づいて回答すること
- ドキュメントに記載のない質問には「ドキュメントには記載がありません」と正直に答えること
- 情報の捏造・推測・外挿は絶対に行わないこと
- 関連する箇所を引用・要約して回答すること
- 日本語で回答すること（ユーザーが別の言語を明示した場合を除く）`;

function formatDocumentBlock(doc: DocumentContent): string {
  return `## 参考ドキュメント: ${doc.fileName}
---
${doc.textContent}
---`;
}

// ──────────────────────────────────────
// チャットモード用
// ──────────────────────────────────────

export function buildDocumentChatSystemPrompt(
  baseSystemPrompt: string,
  doc: DocumentContent
): string {
  return [baseSystemPrompt, GROUNDING_RULES, formatDocumentBlock(doc)].join(
    "\n\n"
  );
}

// ──────────────────────────────────────
// ポッドキャストモード用
// ──────────────────────────────────────

const PODCAST_GROUNDING_RULES = `## ドキュメントグラウンディングルール
あなたにはポッドキャストで紹介する参考ドキュメントが提供されています。以下を厳守してください:
- ドキュメントの内容を自然な会話の中で紹介・解説すること
- ドキュメントに書かれていない情報を付け足さないこと
- リスナーにわかりやすく噛み砕いて伝えること
- 個人的な感想やリアクションは自然に入れてよいが、事実の捏造は禁止`;

export function buildDocumentPodcastOpeningPrompt(
  speaker: PodcastParticipant,
  partner: PodcastParticipant,
  doc: DocumentContent,
  totalTurns: number
): string {
  return [
    `今回のポッドキャストでは、ドキュメント「${doc.fileName}」の内容を紹介します。`,
    `${speaker.displayName}として番組を始めてください。`,
    `${partner.displayName}と自然に掛け合いながら、ドキュメントの要点をリスナーに伝えてください。`,
    `全体で${totalTurns}ターン程度の短い会話になる想定なので、テンポよく進めてください。`,
    "",
    PODCAST_GROUNDING_RULES,
    "",
    formatDocumentBlock(doc),
  ].join("\n");
}

export function buildDocumentPodcastRelaySystemPrompt(
  speaker: PodcastParticipant,
  partner: PodcastParticipant,
  doc: DocumentContent,
  recentConversation: string,
  latestPartnerTranscript?: string
): string {
  return [
    speaker.systemPrompt,
    `You are talking with ${partner.displayName}.`,
    "The next audio input is the other host's latest spoken turn.",
    "ドキュメントの内容に基づいて会話を続けてください。ドキュメントに書かれていない情報は話さないでください。",
    "",
    PODCAST_GROUNDING_RULES,
    "",
    formatDocumentBlock(doc),
    "",
    `Recent conversation:\n${recentConversation}`,
    latestPartnerTranscript
      ? `Latest partner transcript hint:\n${latestPartnerTranscript}`
      : "",
  ]
    .filter(Boolean)
    .join("\n\n");
}

/**
 * ペルソナ生成時にドキュメントの概要を渡すためのサマリー生成
 * (全文は長すぎるので先頭1000文字)
 */
export function getDocumentSummaryForPersona(doc: DocumentContent): string {
  const preview =
    doc.textContent.length > 1000
      ? doc.textContent.slice(0, 1000) + "..."
      : doc.textContent;
  return `ドキュメント「${doc.fileName}」の内容に基づくポッドキャストです。\n\nドキュメント概要:\n${preview}`;
}
