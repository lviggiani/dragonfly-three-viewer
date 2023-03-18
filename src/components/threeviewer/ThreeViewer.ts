/* Author: Luca Viggiani <luca.viggiani@txtgroup.com>
   Credits: https://github.com/lviggiani/dragonfly-toolkit/
*/

import * as THREE from "../../vendor/threejs@150/three.module.js";
import * as Params from "./Params.ts";

export class ThreeViewer extends HTMLElement {

    private root:ShadowRoot;

    private scene:THREE.Scene;
    private renderer: THREE.WebGLRenderer & {
        shadowMap?: Record<string, unknown>
    };

    constructor(){
        super();

        if (!WebGLRenderingContext) throw new Error("WebGL is not supported");

        this.root = this.attachShadow({ mode: "closed" });
        this.root.appendChild(document.createElement("style")).innerHTML = Params.STYLE;

        this.scene = new THREE.Scene();
        this.renderer = new THREE.WebGLRenderer(Params.RENDERER);

        this.renderer.shadowMap!.enabled = true;
        this.renderer.shadowMap!.type = THREE.PCFSoftShadowMap;
        this.renderer.setPixelRatio(devicePixelRatio);
        this.renderer.setClearColor(0);

        this.root.appendChild(this.renderer.domElement);
    }
    
    connectedCallback(){
        console.log("connected!!!");
    }
}

customElements.define("txt-three-viewer", ThreeViewer);