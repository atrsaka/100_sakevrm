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
  initialVrmHipsHeight: number
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

  return new THREE.AnimationClip("mixamo-vrm-animation", clip.duration, tracks);
}
