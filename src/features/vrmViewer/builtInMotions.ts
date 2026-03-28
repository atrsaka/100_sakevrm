const MIXAMO_IDLE_MOTION_PATHS = [
  "/motions/idle/Idle1.fbx",
  "/motions/idle/Idle2.fbx",
  "/motions/idle/Standing Idle.fbx",
] as const;

const MIXAMO_TALKING_MOTION_PATHS = [
  "/motions/Talking/Talking1.fbx",
  "/motions/Talking/Talking2.fbx",
  "/motions/Talking/Talking3.fbx",
  "/motions/Talking/Talking4.fbx",
  "/motions/Talking/Talking5.fbx",
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
    label: "Default",
    durationLabel: "11s",
    description: "Original bundled idle loop.",
    format: "vrma" as MotionFormat,
    paths: ["/idle_loop.vrma"],
    playback: "loop" as MotionPlayback,
    smoothingWindowSize: 0,
    facingCorrection: "none" as MotionFacingCorrection,
  },
  mixamoRandom: {
    id: "mixamoRandom",
    label: "Random Idle",
    durationLabel: "Auto",
    description: "Cycles through three bundled Mixamo idle motions.",
    format: "fbx" as MotionFormat,
    paths: MIXAMO_IDLE_MOTION_PATHS,
    playback: "random" as MotionPlayback,
    smoothingWindowSize: 0,
    facingCorrection: "stabilize" as MotionFacingCorrection,
  },
  stand: {
    id: "stand",
    label: "Stand",
    durationLabel: "3s",
    description: "Shortest neutral pose.",
    format: "vrma" as MotionFormat,
    paths: ["/motions/accad_female1_stand.vrma"],
    playback: "loop" as MotionPlayback,
    smoothingWindowSize: 2,
    facingCorrection: "none" as MotionFacingCorrection,
  },
  sway: {
    id: "sway",
    label: "Sway",
    durationLabel: "12s",
    description: "Soft breathing and body sway.",
    format: "vrma" as MotionFormat,
    paths: ["/motions/accad_female1_sway.vrma"],
    playback: "loop" as MotionPlayback,
    smoothingWindowSize: 2,
    facingCorrection: "none" as MotionFacingCorrection,
  },
  wait: {
    id: "wait",
    label: "Wait",
    durationLabel: "39s",
    description: "Longer idle performance.",
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
  description: "Cycles through bundled Mixamo talking motions while audio plays.",
  format: "fbx" as MotionFormat,
  paths: MIXAMO_TALKING_MOTION_PATHS,
  playback: "random" as MotionPlayback,
  smoothingWindowSize: 0,
  facingCorrection: "stabilize" as MotionFacingCorrection,
} as const satisfies MotionDefinition;

export type BuiltInMotionId = keyof typeof BUILT_IN_MOTIONS;
export type BuiltInMotionDefinition =
  (typeof BUILT_IN_MOTIONS)[BuiltInMotionId];

export const DEFAULT_BUILT_IN_MOTION_ID: BuiltInMotionId = "mixamoRandom";

export const BUILT_IN_MOTION_LIST = Object.values(BUILT_IN_MOTIONS);

export function isBuiltInMotionId(value: string): value is BuiltInMotionId {
  return value in BUILT_IN_MOTIONS;
}
