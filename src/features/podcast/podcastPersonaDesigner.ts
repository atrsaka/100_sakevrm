import { GoogleGenAI, Type } from "@google/genai";

/**
 * テーマからポッドキャスト番組の世界観と各ホストのキャラ設定を生成する。
 * Gemini 2.5 flash の structured output (JSON schema) で 1 回 generate する。
 * ElevenLabs ConvAI 経路の preflight でユーザーが内容を確認・編集してから本番に進む。
 */

const DEFAULT_PERSONA_MODEL =
  process.env.NEXT_PUBLIC_GEMINI_TEXT_MODEL || "gemini-2.5-flash";

export type PodcastHostPersona = {
  /** 一行で表せる人物像。例: "20 代の元気な男性ホスト、好奇心旺盛" */
  persona: string;
  /** 喋り方・口調・語尾 */
  speakingStyle: string;
  /** 簡単な背景設定 */
  backstory: string;
};

export type PodcastPersonaPlan = {
  showTitle: string;
  showConcept: string;
  yukito: PodcastHostPersona;
  kiyoka: PodcastHostPersona;
  openingHook: string;
};

export type GeneratePodcastPersonaParams = {
  apiKey: string;
  topic: string;
  yukitoDisplayName?: string;
  kiyokaDisplayName?: string;
  model?: string;
  /** ドキュメントモード時にドキュメント概要テキストを渡す */
  documentSummary?: string;
};

const SCHEMA = {
  type: Type.OBJECT,
  properties: {
    showTitle: {
      type: Type.STRING,
      description: "番組タイトル(15 文字以内)",
    },
    showConcept: {
      type: Type.STRING,
      description: "番組の世界観・コンセプトを 2〜3 文で",
    },
    yukito: {
      type: Type.OBJECT,
      properties: {
        persona: { type: Type.STRING, description: "Yukito の人物像 1 文" },
        speakingStyle: {
          type: Type.STRING,
          description: "Yukito の喋り方・口調・語尾",
        },
        backstory: {
          type: Type.STRING,
          description: "Yukito の簡単な背景設定 1〜2 文",
        },
      },
      required: ["persona", "speakingStyle", "backstory"],
      propertyOrdering: ["persona", "speakingStyle", "backstory"],
    },
    kiyoka: {
      type: Type.OBJECT,
      properties: {
        persona: { type: Type.STRING, description: "Kiyoka の人物像 1 文" },
        speakingStyle: {
          type: Type.STRING,
          description: "Kiyoka の喋り方・口調・語尾",
        },
        backstory: {
          type: Type.STRING,
          description: "Kiyoka の簡単な背景設定 1〜2 文",
        },
      },
      required: ["persona", "speakingStyle", "backstory"],
      propertyOrdering: ["persona", "speakingStyle", "backstory"],
    },
    openingHook: {
      type: Type.STRING,
      description: "番組冒頭で Yukito が話し始める一言(20 文字以内)",
    },
  },
  required: ["showTitle", "showConcept", "yukito", "kiyoka", "openingHook"],
  propertyOrdering: [
    "showTitle",
    "showConcept",
    "yukito",
    "kiyoka",
    "openingHook",
  ],
} as const;

export async function generatePodcastPersona({
  apiKey,
  topic,
  yukitoDisplayName = "Yukito",
  kiyokaDisplayName = "Kiyoka",
  model = DEFAULT_PERSONA_MODEL,
  documentSummary,
}: GeneratePodcastPersonaParams): Promise<PodcastPersonaPlan> {
  if (!apiKey) {
    throw new Error("Gemini API key is required for persona generation.");
  }
  if (!topic.trim() && !documentSummary) {
    throw new Error("テーマを入力してください。");
  }

  const ai = new GoogleGenAI({ apiKey });

  const topicLine = documentSummary
    ? `次のドキュメントの内容に基づいてポッドキャスト番組の設計をしてください。\n\n${documentSummary}`
    : `次のテーマでポッドキャスト番組の設計をしてください。テーマ: "${topic.trim()}"`;

  const prompt = [
    topicLine,
    `このポッドキャストはホスト ${yukitoDisplayName} と ${kiyokaDisplayName} の 2 人による日本語の雑談番組です。`,
    "VRM アバターが画面上で交互に短い掛け合いをします。各ターンは 1〜2 文の短い発話なので、それに合った軽快なノリのキャラ設定を考えてください。",
    `${yukitoDisplayName} と ${kiyokaDisplayName} は対比のあるキャラにしてください(例: 元気 vs 落ち着き、楽観 vs 慎重 など)。`,
    documentSummary
      ? "ドキュメントの内容に適したキャラ設定にしてください。ドキュメントに書かれていない内容には触れないでください。"
      : "",
    "出力は指定された JSON スキーマに厳密に従ってください。",
  ].filter(Boolean).join("\n\n");

  const result = await ai.models.generateContent({
    model,
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseMimeType: "application/json",
      responseSchema: SCHEMA,
      temperature: 0.9,
    },
  });

  const text = result.text;
  if (!text) {
    throw new Error("Persona 生成のレスポンスが空でした。");
  }

  let parsed: PodcastPersonaPlan;
  try {
    parsed = JSON.parse(text) as PodcastPersonaPlan;
  } catch (error) {
    throw new Error(
      `Persona 生成の JSON パースに失敗しました: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
  }

  return parsed;
}

/**
 * ポッドキャスト風の話し方を具体例で示すスタイルガイド。
 * system prompt の末尾に付与して LLM に few-shot の参考を与える。
 */
export const PODCAST_STYLE_GUIDE = `## 話し方のルール
- 必ず日本語 1〜2 文、最大 40 文字程度のごく短いターンに収めること。
- 長い説明、列挙、自己紹介、要約は禁止。
- 相手の発話に直接リアクションしてから、自分の意見や疑問を添える。
- ポッドキャストらしい自然な掛け合い。堅い敬語は不要、フランクに。

## 番組の始め方（最初のターンのみ）
最初のホストは番組っぽく自然に切り出す。堅い挨拶ではなく、ラジオ番組のような軽い入り。
例:
- 「今日も始まりました〇〇！ 今回は最近話題の△△なんだけど、□□ちゃん知ってる？」
- 「はい始まりましたー。今日のテーマ面白いよ、△△について語ろうと思います！」
- 「どうも〇〇です！ いやー今日はちょっと聞いてほしい話があるんだけど。」

## 番組の終わり方（最終ターンのみ）
最後のホストは番組を締める。リスナーにコメントを促したり、感想を聞いたりして自然に終わる。
例:
- 「いい話だったね！ みんなもぜひコメントで教えてね、じゃまた！」
- 「あっという間だったなー。感想あったらコメント待ってます！」
- 「気になった人はぜひ試してみて！ コメント欄で報告待ってまーす。」

## 掛け合いの例（中盤ターン）
A: ねえ、最近 AI で絵描くのハマってるんだけど。
B: えっマジ？ どんなの描いてるの？
A: 風景画！ プロンプト一発で夕焼けとか出るの面白くて。
B: わかる、あの「おお…」ってなる感動あるよね。
A: そうそう！ ただ手がバグるのだけ何とかしてほしい笑
B: 指 6 本問題ね、あれ見るたび笑う。

## 悪い例（こうならないで）
A: 本日は AI アートの最新動向についてお話しします。まず背景として、2024 年に生成 AI 市場は急拡大し……
（← 長すぎ・硬すぎ・ラジオニュースになっている）`;

/**
 * persona をホスト別の system prompt 文字列に展開する。
 * ElevenLabs ConvAI の override に流し込む用途。
 */
export function buildHostSystemPromptFromPersona(
  persona: PodcastPersonaPlan,
  speakerKey: "yukito" | "kiyoka",
  hostDisplayName: string,
  partnerDisplayName: string,
): string {
  const host = persona[speakerKey];
  const partner = speakerKey === "yukito" ? persona.kiyoka : persona.yukito;

  return [
    `あなたはポッドキャスト番組「${persona.showTitle}」のホスト ${hostDisplayName} です。`,
    `番組コンセプト: ${persona.showConcept}`,
    `あなたの人物像: ${host.persona}`,
    `あなたの喋り方: ${host.speakingStyle}`,
    `あなたの背景: ${host.backstory}`,
    `相方の ${partnerDisplayName} は: ${partner.persona}`,
    PODCAST_STYLE_GUIDE,
  ].join("\n\n");
}
