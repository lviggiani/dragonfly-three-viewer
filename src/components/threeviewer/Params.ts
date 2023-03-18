import * as THREE from "../../vendor/threejs@150/three.module.js";

export const RENDERER = {
    antialias: true,
    alpha: false,
    logarithmicDepthBuffer: true,
    outputEncoding: THREE.sRGBEncoding
}

export const STYLE = `:host {
    display: block;
    position: relative;
    background-color: transparent;
    width: 400px;
    height: 400px;
}

:host canvas {
    position: absolute;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
}`;