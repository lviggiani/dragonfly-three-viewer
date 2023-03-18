import * as THREE from "../../vendor/threejs@150/three.module.js";

export const RENDERER = {
    antialias: false,
    alpha: false,
    logarithmicDepthBuffer: true,
    outputEncoding: THREE.sRGBEncoding,
    tonemapping: THREE.ReinhardToneMapping,
    toneMappingExposure: 1
}

export const CAMERA = {
    fov: 60,
    pixelRatio: devicePixelRatio,
    nearClippingPlane: .1,
    farClippingPlane: 10000
} 

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
}`;