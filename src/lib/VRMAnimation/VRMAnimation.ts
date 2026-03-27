import * as THREE from "three";
import { VRM, VRMExpressionManager, VRMHumanBoneName } from "@pixiv/three-vrm";

export class VRMAnimation {
  public duration: number;
  public restHipsPosition: THREE.Vector3;

  public humanoidTracks: {
    translation: Map<VRMHumanBoneName, THREE.VectorKeyframeTrack>;
    rotation: Map<VRMHumanBoneName, THREE.QuaternionKeyframeTrack>;
  };
  public expressionTracks: Map<string, THREE.NumberKeyframeTrack>;
  public lookAtTrack: THREE.QuaternionKeyframeTrack | null;

  public constructor() {
    this.duration = 0.0;
    this.restHipsPosition = new THREE.Vector3();

    this.humanoidTracks = {
      translation: new Map(),
      rotation: new Map(),
    };

    this.expressionTracks = new Map();
    this.lookAtTrack = null;
  }

  public createAnimationClip(vrm: VRM): THREE.AnimationClip {
    const tracks: THREE.KeyframeTrack[] = [];

    tracks.push(...this.createHumanoidTracks(vrm));

    if (vrm.expressionManager != null) {
      tracks.push(...this.createExpressionTracks(vrm.expressionManager));
    }

    if (vrm.lookAt != null) {
      const track = this.createLookAtTrack("lookAtTargetParent.quaternion");

      if (track != null) {
        tracks.push(track);
      }
    }

    return new THREE.AnimationClip("Clip", this.duration, tracks);
  }

  public createHumanoidTracks(vrm: VRM): THREE.KeyframeTrack[] {
    const humanoid = vrm.humanoid;
    const metaVersion = vrm.meta.metaVersion;
    const tracks: THREE.KeyframeTrack[] = [];

    for (const [name, origTrack] of this.humanoidTracks.rotation.entries()) {
      const nodeName = humanoid.getNormalizedBoneNode(name)?.name;

      if (nodeName != null) {
        const track = origTrack.clone();
        track.name = `${nodeName}.quaternion`;
        track.values = Float32Array.from(origTrack.values, (v, i) =>
          metaVersion === "0" && i % 2 === 0 ? -v : v
        );
        tracks.push(track);
      }
    }

    for (const [name, origTrack] of this.humanoidTracks.translation.entries()) {
      const nodeName = humanoid.getNormalizedBoneNode(name)?.name;

      if (nodeName != null) {
        const animationY = this.restHipsPosition.y;
        const humanoidY =
          humanoid.getNormalizedAbsolutePose().hips!.position![1];
        const scale = humanoidY / animationY;

        const track = origTrack.clone();
        track.values = track.values.map(
          (v, i) => (metaVersion === "0" && i % 3 !== 1 ? -v : v) * scale
        );
        track.name = `${nodeName}.position`;
        tracks.push(track);
      }
    }

    return tracks;
  }

  public createExpressionTracks(
    expressionManager: VRMExpressionManager
  ): THREE.KeyframeTrack[] {
    const tracks: THREE.KeyframeTrack[] = [];

    for (const [name, origTrack] of this.expressionTracks.entries()) {
      const trackName = expressionManager.getExpressionTrackName(name);

      if (trackName != null) {
        const track = origTrack.clone();
        track.name = trackName;
        tracks.push(track);
      }
    }

    return tracks;
  }

  public createLookAtTrack(trackName: string): THREE.KeyframeTrack | null {
    if (this.lookAtTrack == null) {
      return null;
    }

    const track = this.lookAtTrack.clone();
    track.name = trackName;
    return track;
  }

  public applyMovingAverage(windowRadius: number): void {
    if (windowRadius <= 0) {
      return;
    }

    for (const track of this.humanoidTracks.translation.values()) {
      this.applyVectorTrackMovingAverage(track, windowRadius);
    }

    for (const track of this.humanoidTracks.rotation.values()) {
      this.applyQuaternionTrackMovingAverage(track, windowRadius);
    }
  }

  private applyVectorTrackMovingAverage(
    track: THREE.VectorKeyframeTrack,
    windowRadius: number
  ): void {
    const frameCount = track.times.length;
    const stride = track.getValueSize();
    if (frameCount < 2 || stride <= 0) {
      return;
    }

    const smoothedValues = new Float32Array(track.values.length);

    for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
      for (let componentIndex = 0; componentIndex < stride; componentIndex++) {
        let sum = 0.0;
        let sampleCount = 0;

        for (
          let offset = -windowRadius;
          offset <= windowRadius;
          offset++
        ) {
          const sampleFrameIndex = this.wrapFrameIndex(
            frameIndex + offset,
            frameCount
          );
          const valueIndex = sampleFrameIndex * stride + componentIndex;
          sum += track.values[valueIndex];
          sampleCount++;
        }

        smoothedValues[frameIndex * stride + componentIndex] = sum / sampleCount;
      }
    }

    track.values = smoothedValues;
  }

  private applyQuaternionTrackMovingAverage(
    track: THREE.QuaternionKeyframeTrack,
    windowRadius: number
  ): void {
    const frameCount = track.times.length;
    const stride = track.getValueSize();
    if (frameCount < 2 || stride !== 4) {
      return;
    }

    const smoothedValues = new Float32Array(track.values.length);
    const centerQuat = new THREE.Quaternion();
    const sampleQuat = new THREE.Quaternion();
    const averageQuat = new THREE.Quaternion();

    for (let frameIndex = 0; frameIndex < frameCount; frameIndex++) {
      centerQuat.fromArray(track.values, frameIndex * stride).normalize();

      let x = 0.0;
      let y = 0.0;
      let z = 0.0;
      let w = 0.0;
      let sampleCount = 0;

      for (
        let offset = -windowRadius;
        offset <= windowRadius;
        offset++
      ) {
        const sampleFrameIndex = this.wrapFrameIndex(
          frameIndex + offset,
          frameCount
        );
        sampleQuat.fromArray(track.values, sampleFrameIndex * stride).normalize();

        if (centerQuat.dot(sampleQuat) < 0.0) {
          sampleQuat.set(
            -sampleQuat.x,
            -sampleQuat.y,
            -sampleQuat.z,
            -sampleQuat.w
          );
        }

        x += sampleQuat.x;
        y += sampleQuat.y;
        z += sampleQuat.z;
        w += sampleQuat.w;
        sampleCount++;
      }

      averageQuat.set(
        x / sampleCount,
        y / sampleCount,
        z / sampleCount,
        w / sampleCount
      );

      if (averageQuat.lengthSq() === 0.0) {
        averageQuat.copy(centerQuat);
      } else {
        averageQuat.normalize();
      }

      averageQuat.toArray(smoothedValues, frameIndex * stride);
    }

    track.values = smoothedValues;
  }

  private wrapFrameIndex(index: number, frameCount: number): number {
    return ((index % frameCount) + frameCount) % frameCount;
  }
}
