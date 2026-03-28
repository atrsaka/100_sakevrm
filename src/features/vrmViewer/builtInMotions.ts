const MIXAMO_IDLE_MOTION_PATHS = [
  "/motions/idle/Idle1.fbx",
  "/motions/idle/Idle2.fbx",
  "/motions/idle/Standing Idle.fbx",
] as const;

type BuiltInMotionFormat = "vrma" | "fbx";
type BuiltInMotionPlayback = "loop" | "random";

export const BUILT_IN_MOTIONS = {
  default: {
    id: "default",
    label: "Default",
    durationLabel: "11s",
    description: "Original bundled idle loop.",
    format: "vrma" as BuiltInMotionFormat,
    paths: ["/idle_loop.vrma"],
    playback: "loop" as BuiltInMotionPlayback,
    smoothingWindowSize: 0,
  },
  mixamoRandom: {
    id: "mixamoRandom",
    label: "Random Idle",
    durationLabel: "Auto",
    description: "Cycles through three bundled Mixamo idle motions.",
    format: "fbx" as BuiltInMotionFormat,
    paths: MIXAMO_IDLE_MOTION_PATHS,
    playback: "random" as BuiltInMotionPlayback,
    smoothingWindowSize: 0,
  },
  stand: {
    id: "stand",
    label: "Stand",
    durationLabel: "3s",
    description: "Shortest neutral pose.",
    format: "vrma" as BuiltInMotionFormat,
    paths: ["/motions/accad_female1_stand.vrma"],
    playback: "loop" as BuiltInMotionPlayback,
    smoothingWindowSize: 2,
  },
  sway: {
    id: "sway",
    label: "Sway",
    durationLabel: "12s",
    description: "Soft breathing and body sway.",
    format: "vrma" as BuiltInMotionFormat,
    paths: ["/motions/accad_female1_sway.vrma"],
    playback: "loop" as BuiltInMotionPlayback,
    smoothingWindowSize: 2,
  },
  wait: {
    id: "wait",
    label: "Wait",
    durationLabel: "39s",
    description: "Longer idle performance.",
    format: "vrma" as BuiltInMotionFormat,
    paths: ["/motions/accad_female1_wait.vrma"],
    playback: "loop" as BuiltInMotionPlayback,
    smoothingWindowSize: 2,
  },
} as const;

export type BuiltInMotionId = keyof typeof BUILT_IN_MOTIONS;
export type BuiltInMotionDefinition =
  (typeof BUILT_IN_MOTIONS)[BuiltInMotionId];

export const DEFAULT_BUILT_IN_MOTION_ID: BuiltInMotionId = "mixamoRandom";

export const BUILT_IN_MOTION_LIST = Object.values(BUILT_IN_MOTIONS);

export function isBuiltInMotionId(value: string): value is BuiltInMotionId {
  return value in BUILT_IN_MOTIONS;
}
