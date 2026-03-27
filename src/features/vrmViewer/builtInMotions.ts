export const BUILT_IN_MOTIONS = {
  default: {
    id: "default",
    label: "Default",
    durationLabel: "11s",
    description: "Original bundled idle loop.",
    path: "/idle_loop.vrma",
    smoothingWindowSize: 0,
  },
  stand: {
    id: "stand",
    label: "Stand",
    durationLabel: "3s",
    description: "Shortest neutral pose.",
    path: "/motions/accad_female1_stand.vrma",
    smoothingWindowSize: 2,
  },
  sway: {
    id: "sway",
    label: "Sway",
    durationLabel: "12s",
    description: "Soft breathing and body sway.",
    path: "/motions/accad_female1_sway.vrma",
    smoothingWindowSize: 2,
  },
  wait: {
    id: "wait",
    label: "Wait",
    durationLabel: "39s",
    description: "Longer idle performance.",
    path: "/motions/accad_female1_wait.vrma",
    smoothingWindowSize: 2,
  },
} as const;

export type BuiltInMotionId = keyof typeof BUILT_IN_MOTIONS;

export const DEFAULT_BUILT_IN_MOTION_ID: BuiltInMotionId = "default";

export const BUILT_IN_MOTION_LIST = Object.values(BUILT_IN_MOTIONS);

export function isBuiltInMotionId(value: string): value is BuiltInMotionId {
  return value in BUILT_IN_MOTIONS;
}
