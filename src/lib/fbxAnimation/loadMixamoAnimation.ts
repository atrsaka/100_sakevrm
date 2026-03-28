import * as THREE from "three";
import { VRM, VRMHumanBoneName } from "@pixiv/three-vrm";
import { FBXLoader } from "three/examples/jsm/loaders/FBXLoader";
import {
  mixamoVRMRigMap,
  MixamoVRMRigMapIndex,
} from "./mixamoVRMRigMap";

export async function loadMixamoAnimation(
  url: string,
  vrm: VRM,
  initialVrmHipsHeight: number,
  options: {
    stabilizeFacingDirection?: boolean;
  } = {}
): Promise<THREE.AnimationClip> {
  const loader = new FBXLoader();
  const asset = await loader.loadAsync(url);
  const clip =
    THREE.AnimationClip.findByName(asset.animations, "mixamo.com") ??
    asset.animations[0];

  if (clip == null) {
    throw new Error("No Mixamo animation clip found in FBX asset.");
  }

  const tracks: THREE.KeyframeTrack[] = [];
  const restRotationInverse = new THREE.Quaternion();
  const parentRestWorldRotation = new THREE.Quaternion();
  const flatQuaternion = new THREE.Quaternion();

  const motionHipsHeight = asset.getObjectByName("mixamorigHips")?.position.y;
  const hipsPositionScale =
    motionHipsHeight != null && motionHipsHeight !== 0
      ? initialVrmHipsHeight / motionHipsHeight
      : 1;

  const vrmHipsNodeName =
    vrm.humanoid?.getNormalizedBoneNode("hips")?.name ?? null;

  clip.tracks.forEach((track) => {
    const [mixamoRigName, propertyName] = track.name.split(".");
    const vrmBoneName = mixamoVRMRigMap[
      mixamoRigName as MixamoVRMRigMapIndex
    ] as VRMHumanBoneName | undefined;

    if (vrmBoneName == null || propertyName == null) {
      return;
    }

    const vrmNodeName = vrm.humanoid?.getNormalizedBoneNode(vrmBoneName)?.name;
    const mixamoRigNode = asset.getObjectByName(mixamoRigName);

    if (vrmNodeName == null || mixamoRigNode == null) {
      return;
    }

    mixamoRigNode.getWorldQuaternion(restRotationInverse).invert();
    mixamoRigNode.parent?.getWorldQuaternion(parentRestWorldRotation);

    if (track instanceof THREE.QuaternionKeyframeTrack) {
      const values = track.values.slice();

      for (let index = 0; index < values.length; index += 4) {
        flatQuaternion.fromArray(values, index);
        flatQuaternion
          .premultiply(parentRestWorldRotation)
          .multiply(restRotationInverse);
        flatQuaternion.toArray(values, index);
      }

      tracks.push(
        new THREE.QuaternionKeyframeTrack(
          `${vrmNodeName}.${propertyName}`,
          track.times,
          values.map((value, index) =>
            vrm.meta?.metaVersion === "0" && index % 2 === 0 ? -value : value
          )
        )
      );
      return;
    }

    if (!(track instanceof THREE.VectorKeyframeTrack)) {
      return;
    }

    const values = track.values.slice();
    if (vrmBoneName === "hips" && propertyName === "position") {
      const firstFrameY = values[1];
      for (let index = 1; index < values.length; index += 3) {
        values[index] = firstFrameY;
      }
    }

    tracks.push(
      new THREE.VectorKeyframeTrack(
        `${vrmNodeName}.${propertyName}`,
        track.times,
        values.map((value, index) => {
          const normalizedValue =
            vrm.meta?.metaVersion === "0" && index % 3 !== 1 ? -value : value;
          return normalizedValue * hipsPositionScale;
        })
      )
    );
  });

  if (options.stabilizeFacingDirection) {
    stabilizeFacingDirection(tracks, vrmHipsNodeName);
  }

  return new THREE.AnimationClip("mixamo-vrm-animation", clip.duration, tracks);
}

function stabilizeFacingDirection(
  tracks: THREE.KeyframeTrack[],
  vrmHipsNodeName: string | null
): void {
  if (vrmHipsNodeName == null) {
    return;
  }

  const hipsTrack = tracks.find(
    (track): track is THREE.QuaternionKeyframeTrack =>
      track instanceof THREE.QuaternionKeyframeTrack &&
      track.name === `${vrmHipsNodeName}.quaternion`
  );

  if (hipsTrack == null || hipsTrack.values.length < 4) {
    return;
  }

  const yawOffset = getAverageYawOffset(hipsTrack);
  const minimumCorrectionRadians = THREE.MathUtils.degToRad(0.75);
  if (Math.abs(yawOffset) < minimumCorrectionRadians) {
    return;
  }

  const values = Float32Array.from(hipsTrack.values);
  const quaternion = new THREE.Quaternion();
  const euler = new THREE.Euler(0, 0, 0, "YXZ");

  for (let index = 0; index < values.length; index += 4) {
    quaternion.fromArray(values, index).normalize();
    euler.setFromQuaternion(quaternion, "YXZ");
    quaternion.setFromEuler(
      new THREE.Euler(euler.x, euler.y - yawOffset, euler.z, "YXZ")
    );
    quaternion.toArray(values, index);
  }

  hipsTrack.values = values;
}

function getAverageYawOffset(track: THREE.QuaternionKeyframeTrack): number {
  const quaternion = new THREE.Quaternion();
  const euler = new THREE.Euler(0, 0, 0, "YXZ");

  let x = 0;
  let y = 0;
  let sampleCount = 0;

  for (let index = 0; index < track.values.length; index += 4) {
    quaternion.fromArray(track.values, index).normalize();
    euler.setFromQuaternion(quaternion, "YXZ");
    x += Math.cos(euler.y);
    y += Math.sin(euler.y);
    sampleCount += 1;
  }

  if (sampleCount === 0) {
    return 0;
  }

  return Math.atan2(y / sampleCount, x / sampleCount);
}
