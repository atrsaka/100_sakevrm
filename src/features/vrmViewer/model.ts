import * as THREE from "three";
import { VRM, VRMLoaderPlugin, VRMUtils } from "@pixiv/three-vrm";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { VRMAnimation } from "../../lib/VRMAnimation/VRMAnimation";
import { VRMLookAtSmootherLoaderPlugin } from "@/lib/VRMLookAtSmootherLoaderPlugin/VRMLookAtSmootherLoaderPlugin";
import { LipSync } from "../lipSync/lipSync";
import { EmoteController } from "../emoteController/emoteController";
import { Screenplay } from "../messages/messages";

export type AnimationPlaybackOptions = {
  loop?: THREE.AnimationActionLoopStyles;
  repetitions?: number;
  clampWhenFinished?: boolean;
  fadeDuration?: number;
  onFinished?: () => void;
};

/**
 * 3Dキャラクターを管理するクラス
 */
export class Model {
  public vrm?: VRM | null;
  public mixer?: THREE.AnimationMixer;
  public emoteController?: EmoteController;

  private _lookAtTargetParent: THREE.Object3D;
  private _currentAnimationAction?: THREE.AnimationAction;
  private _currentAnimationFinishedHandler?: THREE.EventListener<
    THREE.Event,
    "finished",
    THREE.AnimationMixer
  >;
  private _lipSync?: LipSync;

  constructor(lookAtTargetParent: THREE.Object3D) {
    this._lookAtTargetParent = lookAtTargetParent;
    this._lipSync = new LipSync(new AudioContext());
  }

  public async loadVRM(url: string): Promise<void> {
    const loader = new GLTFLoader();
    loader.register(
      (parser) =>
        new VRMLoaderPlugin(parser, {
          lookAtPlugin: new VRMLookAtSmootherLoaderPlugin(parser),
        })
    );

    const gltf = await loader.loadAsync(url);

    const vrm = (this.vrm = gltf.userData.vrm);
    vrm.scene.name = "VRMRoot";

    VRMUtils.rotateVRM0(vrm);
    this.mixer = new THREE.AnimationMixer(vrm.scene);

    this.emoteController = new EmoteController(vrm, this._lookAtTargetParent);
  }

  public unLoadVrm() {
    this.clearAnimationFinishedHandler();
    this._lipSync?.dispose().catch(() => {
      // Ignore AudioContext disposal failures during unload.
    });
    this._lipSync = undefined;
    this._currentAnimationAction?.stop();
    this._currentAnimationAction = undefined;
    this.mixer?.stopAllAction();

    if (this.vrm) {
      VRMUtils.deepDispose(this.vrm.scene);
      this.vrm = null;
    }
  }

  /**
   * VRMアニメーションを読み込む
   *
   * https://github.com/vrm-c/vrm-specification/blob/master/specification/VRMC_vrm_animation-1.0/README.ja.md
   */
  public async loadAnimation(
    vrmAnimation: VRMAnimation,
    options?: AnimationPlaybackOptions
  ): Promise<void> {
    const { vrm, mixer } = this;
    if (vrm == null || mixer == null) {
      throw new Error("You have to load VRM first");
    }

    const clip = vrmAnimation.createAnimationClip(vrm);
    this.playAnimationClip(clip, options);
  }

  public async loadAnimationClip(
    clip: THREE.AnimationClip,
    options?: AnimationPlaybackOptions
  ): Promise<void> {
    if (this.mixer == null) {
      throw new Error("You have to load VRM first");
    }

    this.playAnimationClip(clip, options);
  }

  /**
   * 音声を再生し、リップシンクする
   */
  public async speak(buffer: ArrayBuffer, screenplay: Screenplay) {
    this.emoteController?.playEmotion(screenplay.expression);
    await new Promise((resolve) => {
      this._lipSync?.playFromArrayBuffer(buffer, () => {
        resolve(true);
      });
    });
  }

  public async beginStreamingSpeak(screenplay: Screenplay) {
    this.emoteController?.playEmotion(screenplay.expression);
    await this._lipSync?.beginStreaming();
  }

  public appendPCMChunk(buffer: Uint8Array, mimeType: string) {
    this._lipSync?.enqueuePCMChunk(buffer, mimeType);
  }

  public async finishStreamingSpeak() {
    await this._lipSync?.finishStreaming();
  }

  public stopSpeaking() {
    this._lipSync?.stop();
  }

  public update(delta: number): void {
    if (this._lipSync) {
      const { volume } = this._lipSync.update();
      this.emoteController?.lipSync("aa", volume);
    }

    this.emoteController?.update(delta);
    this.mixer?.update(delta);
    this.vrm?.update(delta);
  }

  private playAnimationClip(
    clip: THREE.AnimationClip,
    options?: AnimationPlaybackOptions
  ): void {
    const { mixer } = this;
    if (mixer == null) {
      throw new Error("You have to load VRM first");
    }

    this.clearAnimationFinishedHandler();
    const previousAction = this._currentAnimationAction;
    const previousClip = previousAction?.getClip();

    const action = mixer.clipAction(clip);
    const fadeDuration = options?.fadeDuration ?? 0.25;
    action.reset();
    action.clampWhenFinished = options?.clampWhenFinished ?? false;
    action.setLoop(
      options?.loop ?? THREE.LoopRepeat,
      options?.repetitions ?? Infinity
    );
    action.enabled = true;

    if (previousAction != null && previousAction !== action && fadeDuration > 0) {
      action.setEffectiveTimeScale(1);
      action.setEffectiveWeight(1);
      action.play();
      action.crossFadeFrom(previousAction, fadeDuration, true);

      const retiringClip =
        previousClip != null && previousClip !== clip ? previousClip : undefined;
      globalThis.setTimeout(() => {
        previousAction.stop();
        if (retiringClip != null) {
          mixer.uncacheAction(retiringClip);
          mixer.uncacheClip(retiringClip);
        }
      }, Math.max(fadeDuration * 1000, 0) + 50);
    } else {
      previousAction?.stop();
      if (previousClip != null && previousClip !== clip) {
        mixer.uncacheAction(previousClip);
        mixer.uncacheClip(previousClip);
      }
      action.play();
    }

    if (options?.onFinished) {
      const finishedHandler: THREE.EventListener<
        THREE.Event,
        "finished",
        THREE.AnimationMixer
      > = (event) => {
        const animationEvent = event as THREE.Event & {
          action?: THREE.AnimationAction;
        };
        if (animationEvent.action !== action) {
          return;
        }

        options.onFinished?.();
      };

      mixer.addEventListener("finished", finishedHandler);
      this._currentAnimationFinishedHandler = finishedHandler;
    }

    this._currentAnimationAction = action;
  }

  private clearAnimationFinishedHandler(): void {
    if (this.mixer == null || this._currentAnimationFinishedHandler == null) {
      return;
    }

    this.mixer.removeEventListener(
      "finished",
      this._currentAnimationFinishedHandler
    );
    this._currentAnimationFinishedHandler = undefined;
  }
}
