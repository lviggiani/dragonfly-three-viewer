// deno-lint-ignore-file no-explicit-any
/* Author: Luca Viggiani <lviggiani@gmail.com>
   Credits: https://github.com/lviggiani/dragonfly-threeviewer/
*/
import { PREFIX } from "../Globals.ts";

import * as THREE from "three";
import * as constants from "./constants.ts";

import { EffectComposer } from "three/postprocessing/EffectComposer.js";
import { RenderPass } from "three/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/postprocessing/UnrealBloomPass.js";
import { FXAAShader } from 'three/shaders/FXAAShader.js';

import { OrbitControls } from "three/controls/OrbitControls.js";

import MimeType from "../../vendor/MimeType.js";

import { SceneLoaders } from "./SceneLoaders.ts";
import { Pass } from "three/postprocessing/Pass.js";
import { ShaderPass } from "three/postprocessing/ShaderPass.js";
import { SSRPass } from "three/postprocessing/SSRPass.js";

import { ProgressBar } from "../progressbar/ProgressBar.ts";


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

//const WEBGL2 = !!WebGL2RenderingContext;
const isMobile = window.matchMedia("(pointer:coarse)").matches;

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
    
    private progressBar: ProgressBar;

    constructor(){
        super();

        if (!WebGLRenderingContext) throw new Error("WebGL is not supported");

        this.root = this.attachShadow({ mode: "closed" });
        this.root.appendChild(document.createElement("style")).innerHTML = constants.STYLE;

        this.renderer = new THREE.WebGLRenderer();
        this.renderer.setPixelRatio(devicePixelRatio);
        this.renderer.info!.autoReset = false;

        Object.assign(this.renderer, constants.RENDERER);
        Object.assign(this.renderer.shadowMap!, constants.SHADOW_MAP);

        this.camera = new THREE.PerspectiveCamera();
        Object.assign(this.camera, constants.CAMERA);

        const fxaaPass = new ShaderPass(FXAAShader);
        const uniform = ((fxaaPass.material!.uniforms as any)[ 'resolution' ] as THREE.Uniform);
		uniform.value.x = 1 / ( innerWidth * this.renderer.getPixelRatio() );
		uniform.value.y = 1 / ( innerHeight * this.renderer.getPixelRatio() );

        const ssrPass = new SSRPass( {
            renderer: this.renderer,
            scene: this.scene,
            camera: this.camera,
            width: 512,
            height: 512,
            groundReflector: null,
            selects: null
        });

        this.effectComposer = new EffectComposer(this.renderer);
        this.passes = [
            new RenderPass(this.scene, this.camera),
            ssrPass,
            fxaaPass,
            new UnrealBloomPass(...Object.values(constants.BLOOM))
        ];

        this.passes.forEach(pass => this.effectComposer.addPass(pass));

        this.root.appendChild(this.renderer.domElement);

        let ssrEnabled = false;

        this.userControls = new OrbitControls(this.camera, this.renderer.domElement);
        this.userControls.addEventListener("change", () => this.requestRender());
        if (isMobile) this.userControls.addEventListener("start", () => {
            ssrEnabled = ssrPass.enabled;
            ssrPass.enabled = false
        });

        if (isMobile) this.userControls.addEventListener("end", () => {
            ssrPass.enabled = ssrEnabled;
            this.requestRender();
        });

        this.userControls.maxPolarAngle = Math.PI / 2;
        this.userControls.enabled = true;
        
        ((this.camera as any).position as THREE.Vector3).set(0, 0, -12);
        this.camera.lookAt(0, 0, 0);

        // Progress Bar
        this.progressBar = this.root.appendChild(new ProgressBar());
        this.progressBar.setAttribute("part", "progressbar");
        this.progressBar.style.display = "none";
        this.progressBar.style.opacity = "0";

        this.resizeObserver = new ResizeObserver(() => this.resizedCallback());

        this.addEventListener("mousemove", (e:MouseEvent) => this.mouseMoveCallback(e));
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

        this.requestRender();
    }

    attributeChangedCallback(name:string, _oldValue:string, newValue:string):void {
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

            case "bloom": {
                (this.passes.find(pass => pass instanceof UnrealBloomPass) as UnrealBloomPass).strength = 
                    constants.BLOOM.strength * this.bloom;
                this.requestRender();
                break;
            }

            case "ssr": {
                this.passes.find(pass => pass instanceof SSRPass)!.enabled = (newValue || "true") == "true";
                this.requestRender();
                break;
            }
        }
    }

    mouseMoveCallback(e:MouseEvent):void {
        if (e.buttons != 0) return;

        const r = this.getBoundingClientRect();
        const pointer = new THREE.Vector2(
            (e.clientX / r.width) * 2 - 1,
            - (e.clientY / r.height) * 2 + 1);

        const raycaster = new THREE.Raycaster();
        raycaster.setFromCamera(pointer, this.camera);
        const intersects = raycaster.intersectObjects(this.scene.children);
        const obj:THREE.Object3D & { cursor?:string } = intersects[0]?.object;
        
        this.style.cursor = obj?.cursor || "";
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
                constants.EnvLoaders.get(MimeType.lookup(src));
    
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

            const loadingManager = new THREE.LoadingManager();
            loadingManager.onStart = () => {
                this.progressBar.style.display = "";
                this.progressBar.style.opacity = "1";
            }
            loadingManager.onLoad = () => {
                this.progressBar.style.opacity = "0";
                setTimeout(() => this.progressBar.style.display = "none", 500);
            };
            loadingManager.onProgress = (_url:string, i:number, t:number) => 
                this.progressBar.value = i / t;

            const loader = new loaderInfo!.module(loadingManager);
            const doneCallback = loaderInfo?.configure(loader);
            
            (loader as any).load(url, async (result: { scene: THREE.Group; }) => {
                const group: THREE.Group = result.scene;
                group.name = url.match(/([^\/\.]+)(\.[^\/]+)?$/)![1];

                (group as any).rotation.order = "YXZ";
                this.scene.add(group);

                // Load scripts (if any)
                const scriptURL = new URL(url.replace(/[^\.]+$/, "js"), document.location.href).href;
                const mod = await import(scriptURL).catch(() => undefined);
                mod ? new mod.default(group, this) : undefined;

                this.requestRender();

                doneCallback!();
                resolve(group);

                requestAnimationFrame(() =>
                    this.dispatchEvent(new CustomEvent(ThreeViewerEvent.load, { detail: group})));
            });
        });
    }

    getObjectByName(name:string):THREE.Object3D | undefined {
        return this.scene.getObjectByName(name);
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

    get bloom():number {
        return Number(this.getAttribute("bloom") || "1");
    }

    set bloom(value:number) {
        this.setAttribute("bloom", String(value));
    }

    get ssr():boolean {
        return (this.getAttribute("ssr") || "true") == "true";
    }

    set ssr(value:boolean) {
        this.setAttribute("ssr", String(value));
    }

    get info():ThreeViewSceneInfo {
        return {
            geometries: (this.renderer.info!.memory as any).geometries,
            textures: (this.renderer.info!.memory as any).textures,
            triangles: (this.renderer.info!.render as any).triangles
        }
    }

    static get observedAttributes() { return [
        "style", "src", "envsrc", "exposure",
        "bloom", "ssr"]; 
    }
}

customElements.define(`${PREFIX}-three-viewer`, ThreeViewer);