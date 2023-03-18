// deno-lint-ignore-file no-explicit-any
/* Author: Luca Viggiani <luca.viggiani@txtgroup.com>
   Credits: https://github.com/lviggiani/dragonfly-toolkit/
*/

import * as THREE from "three";
import * as Params from "./Params.ts";

import { EffectComposer } from "three/postprocessing/EffectComposer.js";
import { RenderPass } from "three/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/postprocessing/UnrealBloomPass.js";
import { RGBELoader } from "three/loaders/RGBELoader.js";
import { EXRLoader } from "three/loaders/EXRLoader.js";
import { FXAAShader } from 'three/shaders/FXAAShader.js';

import { OrbitControls } from "three/controls/OrbitControls.js";

import MimeType from "../../vendor/MimeType.js";

const EnvLoaders = new Map<string, typeof THREE.DataTextureLoader>([
    ["image/vnd.radiance", RGBELoader],
    ["image/x-exr", EXRLoader]
]);

import { SceneLoaders } from "./SceneLoaders.ts";
import { Pass } from "../../vendor/threejs@150/postprocessing/Pass.js";
import { ShaderPass } from "../../vendor/threejs@150/postprocessing/ShaderPass.js";

export enum ThreeViewerEvent {
    beforerender = "beforerender",
    afterrender = "aftererender",
    load = "load"
}

export type ThreeViewSceneInfo = {
    geometries: number,
    textures: number,
    triangles: number
}

export class ThreeViewer extends HTMLElement {

    private root:ShadowRoot;

    private scene = new THREE.Scene();
    private renderer: THREE.WebGLRenderer & {
        shadowMap?: Record<string, unknown>,
        info?: Record<string, unknown>
    };
    private camera;
    private effectComposer:EffectComposer;
    private envTexture:THREE.Texture | null = null;
    private userControls:OrbitControls;

    private renderRequested = false;

    private resizeObserver:ResizeObserver;

    private passes:Pass[];
    private fxaaPass:ShaderPass;

    constructor(){
        super();

        if (!WebGLRenderingContext) throw new Error("WebGL is not supported");

        this.root = this.attachShadow({ mode: "closed" });
        this.root.appendChild(document.createElement("style")).innerHTML = Params.STYLE;

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.shadowMap!.enabled = true;
        this.renderer.shadowMap!.type = THREE.PCFSoftShadowMap;
        this.renderer.setPixelRatio(devicePixelRatio);
        this.renderer.toneMapping = THREE.LinearToneMapping;
        this.renderer.info!.autoReset = false;
        Object.assign(this.renderer, Params.RENDERER);

        this.camera = new THREE.PerspectiveCamera();
        Object.assign(this.camera, Params.CAMERA);

        this.fxaaPass = new ShaderPass(FXAAShader);

        this.effectComposer = new EffectComposer(this.renderer);
        this.passes = [
            new RenderPass(this.scene, this.camera),
            this.fxaaPass,
            new UnrealBloomPass(new THREE.Vector2( 512, 512 ), .75, .1, .85)
        ];
        this.passes.forEach(pass => this.effectComposer.addPass(pass));

        this.root.appendChild(this.renderer.domElement);

        this.userControls = new OrbitControls(this.camera, this.renderer.domElement);
        this.userControls.addEventListener("change", () => this.requestRender());
        this.userControls.maxPolarAngle = Math.PI / 2;
        this.userControls.enabled = true;
        
        ((this.camera as any).position as THREE.Vector3).set(0, 0, -12);
        this.camera.lookAt(0, 0, 0);

        this.resizeObserver = new ResizeObserver(() => this.resizedCallback());
    }
    
    connectedCallback(){
        if (!this.isConnected) return;
        this.resizeObserver.observe(this);

        const bk = new THREE.Color(
            getComputedStyle(this).getPropertyValue("background-color"));
        
        this.renderer.setClearColor(bk);
    }

    disconnectedCallback(){
        this.resizeObserver.disconnect();
    }

    resizedCallback():void {
        const rect = this.getBoundingClientRect();
        this.camera.aspect = rect.width / rect.height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(rect.width, rect.height);
        this.effectComposer.setSize(rect.width, rect.height);
        
        const pixelRatio = this.renderer.getPixelRatio();

        const uniform = ((this.fxaaPass.material!.uniforms as any)[ 'resolution' ] as THREE.Uniform);
		uniform.value.x = 1 / ( rect.width * pixelRatio );
		uniform.value.y = 1 / ( rect.height * pixelRatio );

        this.requestRender();
    }

    attributeChangedCallback(name:string, _oldValue:string, newValue:string):void{
        switch(name){
            case "style": {
                const bk = new THREE.Color(
                    getComputedStyle(this).getPropertyValue("background-color"));
                
                this.renderer.setClearColor(bk);
                this.requestRender();

                break;
            }

            case "envsrc": {
                this.loadEnvMap(newValue);
                break;
            }

            case "src": {
                // TODO: remove any previously loaded scenes
                const urls = newValue.split(/[,;]/);
                urls.forEach(url => this.load(url));
                break;
            }

            case "exposure": {
                this.renderer.toneMappingExposure = this.exposure;
                this.requestRender();
                break;
            }
        }
    }

    requestRender():void {
        if (this.renderRequested) return;

        this.renderRequested = true;
        requestAnimationFrame(() => this.render());
    }

    private render():void {
        if (!this.renderRequested) return;

        this.dispatchEvent(new CustomEvent(ThreeViewerEvent.beforerender));

        (this.renderer.info as any).reset();

        this.userControls.update();
        this.scene.environment = this.envTexture;
        //this.scene.background = this.envTexture;
        this.effectComposer.render();

        this.dispatchEvent(new CustomEvent(ThreeViewerEvent.afterrender));

        this.renderRequested = false;
    }

    private loadEnvMap(src:string){
        if (this.envTexture){
            this.envTexture.dispose(); // need to dispose to release memory on GPU as well
            this.envTexture = null;
        }

        if (src){
            const LoaderClass:typeof THREE.DataTextureLoader | undefined = 
                EnvLoaders.get(MimeType.lookup(src));
    
            if (!LoaderClass) throw new Error("Unsupported texture type");

            new LoaderClass().load(src, (texture:THREE.Texture) => {
                texture.mapping = THREE.EquirectangularReflectionMapping;
                this.envTexture = texture;
                this.requestRender();
            });
        } else {
            this.requestRender();
        }

    }
    
    load(url:string){
        return new Promise<THREE.Group>((resolve, reject) => {
            const loaderInfo = SceneLoaders.get(MimeType.lookup(url));
            if (!loaderInfo) reject("Unsupported file type");

            const loader = new loaderInfo!.module(THREE.DefaultLoadingManager);
            const doneCallback = loaderInfo?.configure(loader);
            
            (loader as any).load(url, (result: { scene: THREE.Group; }) => {
                const group: THREE.Group = result.scene;
                group.name = url.match(/([^\/\.]+)(\.[^\/]+)?$/)![1];

                (group as any).rotation.order = "YXZ";
                this.scene.add(group);

                this.requestRender();

                doneCallback!();
                resolve(group);

                requestAnimationFrame(() =>
                    this.dispatchEvent(new CustomEvent(ThreeViewerEvent.load, { detail: group})));
            });
        });
    }

    get envsrc():string {
        return this.getAttribute("envsrc") || "";
    }

    set envsrc(value:string){
        this.setAttribute("envsrc", value);
    }

    get src():string[] {
        return (this.getAttribute("src") || "").split(/[,;]/);
    }

    set src(value:string[] | string){
        this.setAttribute("src", Array.isArray(value) ? value.join(",") : value);
    }

    get exposure():number{
        const v = this.getAttribute("exposure");
        return !v ? 1 : Number(v);
    }

    set exposure(value:number){
        value = Math.max(0, value);
        this.setAttribute("exposure", value.toString());
    }

    get info():ThreeViewSceneInfo {
        return {
            geometries: (this.renderer.info!.memory as any).geometries,
            textures: (this.renderer.info!.memory as any).textures,
            triangles: (this.renderer.info!.render as any).triangles
        }
    }

    static get observedAttributes() { return ["style", "src", "envsrc", "exposure"]; }
}

customElements.define("txt-three-viewer", ThreeViewer);