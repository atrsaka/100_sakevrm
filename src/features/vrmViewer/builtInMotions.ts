export const BUILT_IN_MOTIONS = {
  stand: {
    id: "stand",
    label: "Stand",
    durationLabel: "3s",
    description: "Shortest neutral pose.",
    path: "/motions/accad_female1_stand.vrma",
  },
  sway: {
    id: "sway",
    label: "Sway",
    durationLabel: "12s",
    description: "Soft breathing and body sway.",
    path: "/motions/accad_female1_sway.vrma",
  },
  wait: {
    id: "wait",
    label: "Wait",
    durationLabel: "39s",
    description: "Longer idle performance.",
    path: "/motions/accad_female1_wait.vrma",
  },
} as const;

export type BuiltInMotionId = keyof typeof BUILT_IN_MOTIONS;

export const DEFAULT_BUILT_IN_MOTION_ID: BuiltInMotionId = "wait";

export const BUILT_IN_MOTION_LIST = Object.values(BUILT_IN_MOTIONS);

export function isBuiltInMotionId(value: string): value is BuiltInMotionId {
  return value in BUILT_IN_MOTIONS;
}
