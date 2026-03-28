import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { loadVRMAnimation } from "@/lib/VRMAnimation/loadVRMAnimation";
import { loadMixamoAnimation } from "@/lib/fbxAnimation/loadMixamoAnimation";
import { buildUrl } from "@/utils/buildUrl";
import { Model, type AnimationPlaybackOptions } from "./model";
import {
  BUILT_IN_MOTIONS,
  type BuiltInMotionDefinition,
  DEFAULT_BUILT_IN_MOTION_ID,
} from "./builtInMotions";

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
  private _motion: BuiltInMotionDefinition;
  private _motionLoadToken: number;
  private _initialHipsHeight: number;
  private _lastRandomMotionPath?: string;
  private _cachedMixamoClips: Map<string, THREE.AnimationClip>;

  constructor() {
    this.isReady = false;
    this._motion = BUILT_IN_MOTIONS[DEFAULT_BUILT_IN_MOTION_ID];
    this._motionLoadToken = 0;
    this._initialHipsHeight = 1;
    this._cachedMixamoClips = new Map();

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
        await this.loadCurrentMotion(nextModel);

        requestAnimationFrame(() => {
          this.resetCamera();
        });
      })
      .catch((error) => {
        console.error("Failed to load VRM", error);
      });
  }

  public async setMotion(motion: BuiltInMotionDefinition): Promise<void> {
    this._motion = motion;
    this._lastRandomMotionPath = undefined;
    await this.loadCurrentMotion();
  }

  public unloadVRM(): void {
    this._motionLoadToken++;
    this._lastRandomMotionPath = undefined;
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
    this._cameraControls?.target.set(0, 1.3, 0);
    this._cameraControls?.update();

    this._cameraControls = new OrbitControls(
      this._camera,
      this._renderer.domElement
    );
    this._cameraControls.screenSpacePanning = true;
    this._cameraControls.update();

    window.addEventListener("resize", () => {
      this.resize();
    });
    this.isReady = true;
    this.update();
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
    }
  }

  public update = () => {
    requestAnimationFrame(this.update);
    const delta = this._clock.getDelta();
    if (this.model) {
      this.model.update(delta);
    }

    if (this._renderer && this._camera) {
      this._renderer.render(this._scene, this._camera);
    }
  };

  private async loadCurrentMotion(targetModel = this.model): Promise<void> {
    if (targetModel == null || targetModel.vrm == null) {
      return;
    }

    const token = ++this._motionLoadToken;
    this._lastRandomMotionPath = undefined;

    if (this._motion.playback === "random") {
      await this.playRandomMotion(targetModel, token);
      return;
    }

    const motionPath = this._motion.paths[0];
    if (motionPath == null) {
      return;
    }

    await this.playMotionPath(this._motion, motionPath, targetModel, token);
  }

  private async playRandomMotion(
    targetModel: Model,
    token: number
  ): Promise<void> {
    const motionPath = this.pickRandomMotionPath(this._motion.paths);
    if (motionPath == null) {
      return;
    }

    this._lastRandomMotionPath = motionPath;
    void this.prefetchRandomMotionPaths(targetModel, motionPath, token);
    await this.playMotionPath(this._motion, motionPath, targetModel, token, {
      loop: THREE.LoopOnce,
      repetitions: 1,
      clampWhenFinished: true,
      fadeDuration: 0.35,
      onFinished: () => {
        if (
          this.model !== targetModel ||
          token !== this._motionLoadToken ||
          this._motion.playback !== "random"
        ) {
          return;
        }

        void this.playRandomMotion(targetModel, token);
      },
    });
  }

  private async playMotionPath(
    motion: BuiltInMotionDefinition,
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
          this._initialHipsHeight
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

  private pickRandomMotionPath(paths: readonly string[]): string | undefined {
    if (paths.length === 0) {
      return undefined;
    }

    if (paths.length === 1) {
      return paths[0];
    }

    const candidates = paths.filter((path) => path !== this._lastRandomMotionPath);
    return candidates[Math.floor(Math.random() * candidates.length)] ?? paths[0];
  }

  private buildMotionUrl(path: string): string {
    return encodeURI(buildUrl(path));
  }

  private async prefetchRandomMotionPaths(
    targetModel: Model,
    activeMotionPath: string,
    token: number
  ): Promise<void> {
    if (this._motion.format !== "fbx" || targetModel.vrm == null) {
      return;
    }

    const pendingPaths = Array.from(this._motion.paths).filter(
      (path) =>
        path !== activeMotionPath && !this._cachedMixamoClips.has(path)
    );

    await Promise.allSettled(
      pendingPaths.map(async (path) => {
        const clip = await loadMixamoAnimation(
          this.buildMotionUrl(path),
          targetModel.vrm!,
          this._initialHipsHeight
        );
        if (this.model !== targetModel || token !== this._motionLoadToken) {
          return;
        }

        this._cachedMixamoClips.set(path, clip);
      })
    );
  }
}
