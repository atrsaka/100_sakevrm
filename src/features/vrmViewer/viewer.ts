import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { loadVRMAnimation } from "@/lib/VRMAnimation/loadVRMAnimation";
import { loadMixamoAnimation } from "@/lib/fbxAnimation/loadMixamoAnimation";
import { buildUrl } from "@/utils/buildUrl";
import { Model, type AnimationPlaybackOptions } from "./model";
import {
  BUILT_IN_MOTIONS,
  type BuiltInMotionDefinition,
  type MotionDefinition,
  DEFAULT_BUILT_IN_MOTION_ID,
  TALKING_MOTION,
} from "./builtInMotions";

const CAMERA_VIEW_STORAGE_KEY = "geminiVrmChatViewerCameraStateV1";
const MANUAL_MOTION_FADE_DURATION_SECONDS = 0.6;
const RANDOM_MOTION_FADE_DURATION_SECONDS = 0.55;
const TALKING_ENTRY_FADE_DURATION_SECONDS = 0.48;
const TALKING_EXIT_FADE_DURATION_SECONDS = 0.8;
const TALKING_MOTION_RELEASE_DELAY_MS = 460;

type CameraState = {
  x: number;
  y: number;
  z: number;
};

type PersistedCameraState = {
  version: 1;
  camera: CameraState;
  target: CameraState;
};

type ViewerOptions = {
  persistViewState?: boolean;
  cameraViewStorageKey?: string;
};

/**
 * three.jsを使った3Dビューアー
 *
 * setup()でcanvasを渡してから使う
 */
export class Viewer {
  public isReady: boolean;
  public model?: Model;

  private _renderer?: THREE.WebGLRenderer;
  private _clock: THREE.Clock;
  private _scene: THREE.Scene;
  private _camera?: THREE.PerspectiveCamera;
  private _cameraControls?: OrbitControls;
  private readonly _persistViewState: boolean;
  private readonly _cameraViewStorageKey: string | undefined;
  private _didRestoreCameraView: boolean;
  private _cameraControlsChangeHandler:
    | (() => void)
    | undefined;
  private _idleMotion: BuiltInMotionDefinition;
  private _activeMotion: MotionDefinition;
  private _motionLoadToken: number;
  private _initialHipsHeight: number;
  private _isTalkingMotionActive: boolean;
  private _lastRandomMotionPaths: Map<string, string>;
  private _cachedMixamoClips: Map<string, THREE.AnimationClip>;
  private _lastSpeakingDetectedAtMs: number;

  constructor({
    persistViewState = false,
    cameraViewStorageKey = CAMERA_VIEW_STORAGE_KEY,
  }: ViewerOptions = {}) {
    this.isReady = false;
    this._idleMotion = BUILT_IN_MOTIONS[DEFAULT_BUILT_IN_MOTION_ID];
    this._activeMotion = this._idleMotion;
    this._motionLoadToken = 0;
    this._initialHipsHeight = 1;
    this._isTalkingMotionActive = false;
    this._lastRandomMotionPaths = new Map();
    this._cachedMixamoClips = new Map();
    this._lastSpeakingDetectedAtMs = 0;
    this._persistViewState = persistViewState;
    this._cameraViewStorageKey = persistViewState ? cameraViewStorageKey : undefined;
    this._didRestoreCameraView = false;

    const scene = new THREE.Scene();
    this._scene = scene;

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(1.0, 1.0, 1.0).normalize();
    scene.add(directionalLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    scene.add(ambientLight);

    this._clock = new THREE.Clock();
    this._clock.start();
  }

  public loadVrm(url: string) {
    if (this.model?.vrm) {
      this.unloadVRM();
    }

    this._cachedMixamoClips.clear();

    const nextModel = new Model(this._camera || new THREE.Object3D());
    this.model = nextModel;

    nextModel
      .loadVRM(url)
      .then(async () => {
        if (this.model !== nextModel || !nextModel.vrm) return;

        nextModel.vrm.scene.traverse((obj) => {
          obj.frustumCulled = false;
        });

        this.captureInitialHipsHeight(nextModel.vrm);
        this._scene.add(nextModel.vrm.scene);
        this._isTalkingMotionActive = false;
        this._lastSpeakingDetectedAtMs = 0;
        this._activeMotion = this._idleMotion;
        await this.loadCurrentMotion(nextModel, this._activeMotion);
        void this.prefetchMotionPaths(TALKING_MOTION, nextModel, this._motionLoadToken);

        this._didRestoreCameraView = this.restoreCameraState();
        if (!this._didRestoreCameraView) {
          requestAnimationFrame(() => {
            this.resetCamera();
          });
        }
      })
      .catch((error) => {
        console.error("Failed to load VRM", error);
      });
  }

  public async setMotion(motion: BuiltInMotionDefinition): Promise<void> {
    this._idleMotion = motion;
    if (this._isTalkingMotionActive) {
      return;
    }

    this._activeMotion = motion;
    await this.loadCurrentMotion(undefined, undefined, {
      fadeDuration: MANUAL_MOTION_FADE_DURATION_SECONDS,
    });
  }

  public unloadVRM(): void {
    this._motionLoadToken++;
    this._isTalkingMotionActive = false;
    this._lastSpeakingDetectedAtMs = 0;
    this._activeMotion = this._idleMotion;
    this._lastRandomMotionPaths.clear();
    this._cachedMixamoClips.clear();
    if (this.model?.vrm) {
      this._scene.remove(this.model.vrm.scene);
      this.model.unLoadVrm();
    }
  }

  /**
   * Reactで管理しているCanvasを後から設定する
   */
  public setup(canvas: HTMLCanvasElement) {
    const parentElement = canvas.parentElement;
    const width = parentElement?.clientWidth || canvas.width;
    const height = parentElement?.clientHeight || canvas.height;

    this._renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
    });
    this._renderer.outputEncoding = THREE.sRGBEncoding;
    this._renderer.setSize(width, height);
    this._renderer.setPixelRatio(window.devicePixelRatio);

    this._camera = new THREE.PerspectiveCamera(20.0, width / height, 0.1, 20.0);
    this._camera.position.set(0, 1.3, 1.5);
    if (this._cameraControls && this._cameraControlsChangeHandler) {
      this._cameraControls.removeEventListener(
        "change",
        this._cameraControlsChangeHandler
      );
    }

    this._cameraControls = new OrbitControls(
      this._camera,
      this._renderer.domElement
    );
    this._cameraControls.screenSpacePanning = true;
    this._cameraControls.update();
    this._didRestoreCameraView = this.restoreCameraState();

    this._cameraControlsChangeHandler = () => {
      this.saveCameraState();
    };
    this._cameraControls.addEventListener("change", this._cameraControlsChangeHandler);

    const onResize = () => {
      this.resize();
    };
    window.addEventListener("resize", onResize);
    this.isReady = true;
    this.update();
  }

  private saveCameraState() {
    if (!this.shouldPersistViewState()) {
      return;
    }

    if (!this._camera || !this._cameraControls || !this._cameraViewStorageKey) {
      return;
    }

    const state: PersistedCameraState = {
      version: 1,
      camera: {
        x: this._camera.position.x,
        y: this._camera.position.y,
        z: this._camera.position.z,
      },
      target: {
        x: this._cameraControls.target.x,
        y: this._cameraControls.target.y,
        z: this._cameraControls.target.z,
      },
    };

    this.writeStorage(state);
  }

  private restoreCameraState() {
    if (!this.shouldPersistViewState()) {
      return false;
    }

    const restored = this.readStorage();
    if (restored == null) {
      return false;
    }

    this._camera?.position.set(
      restored.camera.x,
      restored.camera.y,
      restored.camera.z
    );
    this._cameraControls?.target.set(
      restored.target.x,
      restored.target.y,
      restored.target.z
    );
    this._cameraControls?.update();
    return true;
  }

  private shouldPersistViewState() {
    return (
      this._persistViewState &&
      this._cameraViewStorageKey != null &&
      typeof window !== "undefined"
    );
  }

  private readStorage(): PersistedCameraState | null {
    if (!this._cameraViewStorageKey) {
      return null;
    }

    let shouldClearInvalidState = false;

    try {
      const rawState = window.localStorage.getItem(this._cameraViewStorageKey);
      if (rawState == null) {
        return null;
      }

      const parsed = JSON.parse(rawState) as PersistedCameraState;
      if (isValidPersistedCameraState(parsed)) {
        return parsed;
      }
      shouldClearInvalidState = true;
    } catch {
      shouldClearInvalidState = true;
    }

    if (shouldClearInvalidState) {
      try {
        window.localStorage.removeItem(this._cameraViewStorageKey);
      } catch {
        // keep default view state if storage is unavailable.
      }
    }

    return null;
  }

  private writeStorage(state: PersistedCameraState) {
    if (!this._cameraViewStorageKey) {
      return;
    }

    try {
      window.localStorage.setItem(
        this._cameraViewStorageKey,
        JSON.stringify(state)
      );
    } catch {
      // storage may be unavailable or full in some browsers.
    }
  }

  /**
   * canvasの縦横幅を見てサイズを調整する
   */
  public resize() {
    if (!this._renderer) return;

    const parentElement = this._renderer.domElement.parentElement;
    if (!parentElement) return;

    this._renderer.setPixelRatio(window.devicePixelRatio);
    this._renderer.setSize(
      parentElement.clientWidth,
      parentElement.clientHeight
    );

    if (!this._camera) return;
    this._camera.aspect =
      parentElement.clientWidth / parentElement.clientHeight;
    this._camera.updateProjectionMatrix();
  }

  /**
   * VRMのheadノードを見てカメラ位置を調整する
   */
  public resetCamera() {
    const headNode = this.model?.vrm?.humanoid.getNormalizedBoneNode("head");

    if (headNode) {
      const headWPos = headNode.getWorldPosition(new THREE.Vector3());
      this._camera?.position.set(
        this._camera.position.x,
        headWPos.y,
        this._camera.position.z
      );
      this._cameraControls?.target.set(headWPos.x, headWPos.y, headWPos.z);
      this._cameraControls?.update();
      this.saveCameraState();
    }
  }

  public update = () => {
    requestAnimationFrame(this.update);
    const delta = this._clock.getDelta();
    if (this.model) {
      this.model.update(delta);
      this.syncMotionState(this.model);
    }

    if (this._renderer && this._camera) {
      this._renderer.render(this._scene, this._camera);
    }
  };

  private async loadCurrentMotion(
    targetModel = this.model,
    motion = this._activeMotion,
    playbackOptions?: AnimationPlaybackOptions
  ): Promise<void> {
    if (targetModel == null || targetModel.vrm == null) {
      return;
    }

    const token = ++this._motionLoadToken;

    if (motion.playback === "random") {
      await this.playRandomMotion(motion, targetModel, token, playbackOptions);
      return;
    }

    const motionPath = motion.paths[0];
    if (motionPath == null) {
      return;
    }

    await this.playMotionPath(
      motion,
      motionPath,
      targetModel,
      token,
      playbackOptions
    );
  }

  private async playRandomMotion(
    motion: MotionDefinition,
    targetModel: Model,
    token: number,
    playbackOptions?: AnimationPlaybackOptions
  ): Promise<void> {
    const motionPath = this.pickRandomMotionPath(motion);
    if (motionPath == null) {
      return;
    }

    this._lastRandomMotionPaths.set(motion.id, motionPath);
    void this.prefetchMotionPaths(motion, targetModel, token, motionPath);
    await this.playMotionPath(motion, motionPath, targetModel, token, {
      ...playbackOptions,
      loop: THREE.LoopOnce,
      repetitions: 1,
      clampWhenFinished: true,
      fadeDuration:
        playbackOptions?.fadeDuration ?? RANDOM_MOTION_FADE_DURATION_SECONDS,
      onFinished: () => {
        playbackOptions?.onFinished?.();
        if (
          this.model !== targetModel ||
          token !== this._motionLoadToken ||
          this._activeMotion.id !== motion.id ||
          motion.playback !== "random"
        ) {
          return;
        }

        void this.playRandomMotion(motion, targetModel, token);
      },
    });
  }

  private async playMotionPath(
    motion: MotionDefinition,
    motionPath: string,
    targetModel: Model,
    token: number,
    playbackOptions?: AnimationPlaybackOptions
  ): Promise<void> {
    try {
      if (motion.format === "vrma") {
        const vrma = await loadVRMAnimation(this.buildMotionUrl(motionPath), {
          smoothingWindowSize: motion.smoothingWindowSize,
        });
        if (vrma == null) {
          return;
        }

        if (this.model !== targetModel || token !== this._motionLoadToken) {
          return;
        }

        await targetModel.loadAnimation(vrma, playbackOptions);
        return;
      }

      if (targetModel.vrm == null) {
        return;
      }

      let clip = this._cachedMixamoClips.get(motionPath);
      if (clip == null) {
        clip = await loadMixamoAnimation(
          this.buildMotionUrl(motionPath),
          targetModel.vrm,
          this._initialHipsHeight,
          {
            stabilizeFacingDirection:
              motion.facingCorrection === "stabilize",
          }
        );
        this._cachedMixamoClips.set(motionPath, clip);
      }

      if (this.model !== targetModel || token !== this._motionLoadToken) {
        return;
      }

      await targetModel.loadAnimationClip(clip, playbackOptions);
    } catch (error) {
      console.error("Failed to load motion", error);
      await this.playFallbackMotion(targetModel, token);
    }
  }

  private async playFallbackMotion(
    targetModel: Model,
    token: number
  ): Promise<void> {
    const fallback = await loadVRMAnimation(this.buildMotionUrl("/idle_loop.vrma"));
    if (fallback == null) {
      return;
    }

    if (this.model !== targetModel || token !== this._motionLoadToken) {
      return;
    }

    await targetModel.loadAnimation(fallback);
  }

  private syncMotionState(targetModel: Model): void {
    if (targetModel.vrm == null) {
      return;
    }

    const isSpeaking = targetModel.isSpeaking();
    const now = performance.now();
    if (isSpeaking) {
      this._lastSpeakingDetectedAtMs = now;
    }

    const shouldUseTalkingMotion =
      isSpeaking ||
      (this._isTalkingMotionActive &&
        now - this._lastSpeakingDetectedAtMs < TALKING_MOTION_RELEASE_DELAY_MS);
    if (shouldUseTalkingMotion === this._isTalkingMotionActive) {
      return;
    }

    this._isTalkingMotionActive = shouldUseTalkingMotion;
    this._activeMotion = shouldUseTalkingMotion ? TALKING_MOTION : this._idleMotion;
    void this.loadCurrentMotion(targetModel, this._activeMotion, {
      fadeDuration: shouldUseTalkingMotion
        ? TALKING_ENTRY_FADE_DURATION_SECONDS
        : TALKING_EXIT_FADE_DURATION_SECONDS,
    });
  }

  private captureInitialHipsHeight(vrm: NonNullable<Model["vrm"]>): void {
    vrm.scene.updateMatrixWorld(true);

    const hipsNode = vrm.humanoid.getNormalizedBoneNode("hips");
    if (hipsNode == null) {
      this._initialHipsHeight = 1;
      return;
    }

    const hipsPosition = hipsNode.getWorldPosition(new THREE.Vector3());
    const rootPosition = vrm.scene.getWorldPosition(new THREE.Vector3());
    const height = Math.abs(hipsPosition.y - rootPosition.y);
    this._initialHipsHeight = height > 0 ? height : 1;
  }

  private pickRandomMotionPath(motion: MotionDefinition): string | undefined {
    const { paths } = motion;
    if (paths.length === 0) {
      return undefined;
    }

    if (paths.length === 1) {
      return paths[0];
    }

    const lastRandomMotionPath = this._lastRandomMotionPaths.get(motion.id);
    const candidates = paths.filter((path) => path !== lastRandomMotionPath);
    return candidates[Math.floor(Math.random() * candidates.length)] ?? paths[0];
  }

  private buildMotionUrl(path: string): string {
    return encodeURI(buildUrl(path));
  }

  private async prefetchMotionPaths(
    motion: MotionDefinition,
    targetModel: Model,
    token: number,
    activeMotionPath?: string
  ): Promise<void> {
    if (motion.format !== "fbx" || targetModel.vrm == null) {
      return;
    }

    const pendingPaths = Array.from(motion.paths).filter(
      (path) =>
        path !== activeMotionPath && !this._cachedMixamoClips.has(path)
    );

    await Promise.allSettled(
      pendingPaths.map(async (path) => {
        const clip = await loadMixamoAnimation(
          this.buildMotionUrl(path),
          targetModel.vrm!,
          this._initialHipsHeight,
          {
            stabilizeFacingDirection:
              motion.facingCorrection === "stabilize",
          }
        );
        if (this.model !== targetModel || token !== this._motionLoadToken) {
          return;
        }

        this._cachedMixamoClips.set(path, clip);
      })
    );
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isValidPersistedCameraState(
  value: unknown
): value is PersistedCameraState {
  if (
    typeof value !== "object" ||
    value == null ||
    !("version" in value)
  ) {
    return false;
  }

  const candidate = value as {
    version?: unknown;
    camera?: { x?: unknown; y?: unknown; z?: unknown };
    target?: { x?: unknown; y?: unknown; z?: unknown };
  };

  if (candidate.version !== 1) {
    return false;
  }

  const camera = candidate.camera;
  const target = candidate.target;
  if (
    !camera ||
    !target ||
    !isFiniteNumber(camera.x) ||
    !isFiniteNumber(camera.y) ||
    !isFiniteNumber(camera.z) ||
    !isFiniteNumber(target.x) ||
    !isFiniteNumber(target.y) ||
    !isFiniteNumber(target.z)
  ) {
    return false;
  }

  return true;
}
