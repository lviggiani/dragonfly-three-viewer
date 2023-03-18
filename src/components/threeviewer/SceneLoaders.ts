import { Loader } from "three";
import { GLTFLoader } from "three/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/loaders/DRACOLoader.js";

export type SceneLoader = {
    module: typeof Loader;
    configure: (loader:Loader) => () => void;
}

export const SceneLoaders = new Map<string, SceneLoader>([
    ["model/gltf-binary", {
        module: GLTFLoader,
        configure: loader => {
            const dracoLoader = new DRACOLoader();
            dracoLoader.setDecoderPath(import.meta.url.replace(/[^\/]+$/, ""));
            (loader as GLTFLoader).setDRACOLoader(dracoLoader);
            return () => dracoLoader.dispose();
        }
    }]
]);