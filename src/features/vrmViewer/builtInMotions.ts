// NOTE: Mixamo .fbx files are not bundled with this repository.
// All built-in motions below use the bundled VRMA assets only.
const BUNDLED_IDLE_MOTION_PATHS = [
  "/motions/accad_female1_stand.vrma",
  "/motions/accad_female1_sway.vrma",
  "/motions/accad_female1_wait.vrma",
] as const;

const BUNDLED_TALKING_MOTION_PATHS = [
  "/motions/accad_female1_sway.vrma",
] as const;

type MotionFormat = "vrma" | "fbx";
type MotionPlayback = "loop" | "random";
type MotionFacingCorrection = "none" | "stabilize";

export type MotionDefinition = {
  id: string;
  label: string;
  durationLabel: string;
  description: string;
  format: MotionFormat;
  paths: readonly string[];
  playback: MotionPlayback;
  smoothingWindowSize: number;
  facingCorrection: MotionFacingCorrection;
};

export const BUILT_IN_MOTIONS = {
  default: {
    id: "default",
    label: "デフォルト",
    durationLabel: "11秒",
    description: "ChatVRM 同梱の標準アイドルループ。",
    format: "vrma" as MotionFormat,
    paths: ["/idle_loop.vrma"],
    playback: "loop" as MotionPlayback,
    smoothingWindowSize: 0,
    facingCorrection: "none" as MotionFacingCorrection,
  },
  mixamoRandom: {
    id: "mixamoRandom",
    label: "ランダム",
    durationLabel: "自動",
    description: "同梱の VRMA モーションをランダムに切り替えます。",
    format: "vrma" as MotionFormat,
    paths: BUNDLED_IDLE_MOTION_PATHS,
    playback: "random" as MotionPlayback,
    smoothingWindowSize: 2,
    facingCorrection: "none" as MotionFacingCorrection,
  },
  stand: {
    id: "stand",
    label: "直立",
    durationLabel: "3秒",
    description: "動きの少ない最短のニュートラル立ちポーズ。",
    format: "vrma" as MotionFormat,
    paths: ["/motions/accad_female1_stand.vrma"],
    playback: "loop" as MotionPlayback,
    smoothingWindowSize: 2,
    facingCorrection: "none" as MotionFacingCorrection,
  },
  sway: {
    id: "sway",
    label: "呼吸・揺れ",
    durationLabel: "12秒",
    description: "呼吸に合わせた柔らかな体の揺れ。",
    format: "vrma" as MotionFormat,
    paths: ["/motions/accad_female1_sway.vrma"],
    playback: "loop" as MotionPlayback,
    smoothingWindowSize: 2,
    facingCorrection: "none" as MotionFacingCorrection,
  },
  wait: {
    id: "wait",
    label: "待機(長め)",
    durationLabel: "39秒",
    description: "より長い演技付きのアイドルモーション。",
    format: "vrma" as MotionFormat,
    paths: ["/motions/accad_female1_wait.vrma"],
    playback: "loop" as MotionPlayback,
    smoothingWindowSize: 2,
    facingCorrection: "none" as MotionFacingCorrection,
  },
} as const satisfies Record<string, MotionDefinition>;

export const TALKING_MOTION = {
  id: "talkingRandom",
  label: "Random Talking",
  durationLabel: "Auto",
  description: "Plays a bundled VRMA motion while audio plays.",
  format: "vrma" as MotionFormat,
  paths: BUNDLED_TALKING_MOTION_PATHS,
  playback: "loop" as MotionPlayback,
  smoothingWindowSize: 2,
  facingCorrection: "none" as MotionFacingCorrection,
} as const satisfies MotionDefinition;

export type BuiltInMotionId = keyof typeof BUILT_IN_MOTIONS;
export type BuiltInMotionDefinition =
  (typeof BUILT_IN_MOTIONS)[BuiltInMotionId];

export const DEFAULT_BUILT_IN_MOTION_ID: BuiltInMotionId = "sway";

export const BUILT_IN_MOTION_LIST = Object.values(BUILT_IN_MOTIONS);

export function isBuiltInMotionId(value: string): value is BuiltInMotionId {
  return value in BUILT_IN_MOTIONS;
}
