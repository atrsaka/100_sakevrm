import * as THREE from "three";
import { Model } from "./model";
import { loadVRMAnimation } from "@/lib/VRMAnimation/loadVRMAnimation";
import { buildUrl } from "@/utils/buildUrl";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import {
  BUILT_IN_MOTIONS,
  DEFAULT_BUILT_IN_MOTION_ID,
} from "./builtInMotions";

/**
 * three.jsを使った3Dビューアー
 *
 * setup()でcanvasを指定してから使う
 */
export class Viewer {
  public isReady: boolean;
  public model?: Model;

  private _renderer?: THREE.WebGLRenderer;
  private _clock: THREE.Clock;
  private _scene: THREE.Scene;
  private _camera?: THREE.PerspectiveCamera;
  private _cameraControls?: OrbitControls;
  private _motionUrl: string;
  private _motionLoadToken: number;

  constructor() {
    this.isReady = false;
    this._motionUrl = buildUrl(BUILT_IN_MOTIONS[DEFAULT_BUILT_IN_MOTION_ID].path);
    this._motionLoadToken = 0;

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

    const nextModel = new Model(this._camera || new THREE.Object3D());
    this.model = nextModel;

    nextModel
      .loadVRM(url)
      .then(async () => {
        if (this.model !== nextModel || !nextModel.vrm) return;

        nextModel.vrm.scene.traverse((obj) => {
          obj.frustumCulled = false;
        });

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

  public async setMotion(motionPath: string): Promise<void> {
    this._motionUrl = buildUrl(motionPath);
    await this.loadCurrentMotion();
  }

  public unloadVRM(): void {
    this._motionLoadToken++;
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
   * canvasの親要素を見てサイズを調整する
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
    try {
      const vrma = await loadVRMAnimation(this._motionUrl);
      if (vrma == null) {
        return;
      }

      if (this.model !== targetModel || token !== this._motionLoadToken) {
        return;
      }

      await targetModel.loadAnimation(vrma);
    } catch (error) {
      console.error("Failed to load motion", error);
    }
  }
}
