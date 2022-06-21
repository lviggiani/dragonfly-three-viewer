import { EXRLoader } from "three/loaders/EXRLoader.js";
import { RGBELoader } from "three/loaders/RGBELoader.js";
import * as THREE from "three/three.module.js";

export const RENDERER = {
    antialias: false,
    alpha: false,
    logarithmicDepthBuffer: true,
    outputEncoding: THREE.sRGBEncoding,
    toneMapping: THREE.LinearToneMapping
}

export const CAMERA = {
    fov: 60,
    pixelRatio: devicePixelRatio,
    nearClippingPlane: .1,
    farClippingPlane: 10000
}

export const SHADOW_MAP = {
    enabled: true,
    type: THREE.PCFSoftShadowMap
}

export const BLOOM = {
    resolution: new THREE.Vector2( 512, 512 ), 
    strength: .75, 
    radius: .01, 
    threshold: .85
}

export const EnvLoaders = new Map<string, typeof THREE.DataTextureLoader>([
    ["image/vnd.radiance", RGBELoader],
    ["image/x-exr", EXRLoader]
]);

export const STYLE = `:host {
    display: block;
    position: relative;
    background-color: transparent;
    min-width: 100px;
    min-height: 100px;
}

:host canvas {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
}

:host::part(progressbar){
    border: 1px solid white;
    width: 200px;
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    margin: auto;
    transition: opacity .35s ease-out;
}`;