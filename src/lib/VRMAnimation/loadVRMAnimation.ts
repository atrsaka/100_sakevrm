import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { VRMAnimation } from './VRMAnimation';
import { VRMAnimationLoaderPlugin } from './VRMAnimationLoaderPlugin';

const loader = new GLTFLoader();
loader.register((parser) => new VRMAnimationLoaderPlugin(parser));

export interface LoadVRMAnimationOptions {
  smoothingWindowSize?: number;
}

export async function loadVRMAnimation(
  url: string,
  options: LoadVRMAnimationOptions = {}
): Promise<VRMAnimation | null> {
  const gltf = await loader.loadAsync(url);

  const vrmAnimations: VRMAnimation[] = gltf.userData.vrmAnimations;
  const vrmAnimation: VRMAnimation | undefined = vrmAnimations[0];

  if (vrmAnimation != null && (options.smoothingWindowSize ?? 0) > 0) {
    vrmAnimation.applyMovingAverage(options.smoothingWindowSize ?? 0);
  }

  return vrmAnimation ?? null;
}
