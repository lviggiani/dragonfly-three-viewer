// deno-lint-ignore-file no-explicit-any
import { ThreeViewer, ThreeViewerEvent } from "./components/threeviewer/ThreeViewer.ts";
import { TargetPoint } from "./components/threeviewer/Cameraman.ts";

export { BUILD_NUMBER } from "./build_number.ts";

import * as THREE from "three";
import { SHADER, XRayMaterial } from "./XRayMaterial.ts";

addEventListener("load", () => {
    const viewer = document.querySelector("df-three-viewer") as ThreeViewer;

    const viewDiv = document.querySelector("#view") as HTMLSelectElement;
    Object.values(TargetPoint)
    .filter(value => typeof value == "string")
    .forEach((value, index) => {
        if ((value as string).match(/(center|bottom)/)) return;
        const option = viewDiv.appendChild(document.createElement("option")) as HTMLOptionElement;
        option.value = index.toString();
        option.textContent = value.toString().replaceAll("_", " ");
    });
    
    viewer.addEventListener("load", () =>{
        const body:any = viewer.getObjectByName("body");
        const envSel = document.querySelector("#envmap") as HTMLInputElement;
        envSel.value = viewer.envsrc.match(/([^\/]+)\./)![1];
        envSel.addEventListener("change", () => viewer.envsrc = envSel.value ? `envmaps/${envSel.value}.exr` : "");

        const expInput = document.querySelector("#exposure") as HTMLInputElement;
        expInput.value = viewer.exposure.toString();
        expInput.addEventListener("input", () => viewer.exposure = Number(expInput.value));

        viewer.addEventListener(ThreeViewerEvent.load, _ => {
            const info = viewer.info;
            document.querySelector("#info")!.textContent = `geometries: ${info.geometries} | textures: ${info.textures} | polygons: ${info.triangles.toLocaleString()}`;
        });

        document.querySelector("#bloom")?.addEventListener("input", 
            (e) => viewer.bloom = Number((e.target as HTMLInputElement).value));

        document.querySelector("#ssr")?.addEventListener("change", 
            (e) => viewer.ssr =(e.target as HTMLInputElement).checked);

        let saveMap:any = null;

        document.querySelector("#ao")?.addEventListener("change", (e) => {
            const v = (e.target as HTMLInputElement).checked;

            if (!v) saveMap = body.material.map;
            body.material.map = v ? saveMap : null;
            viewer.requestRender();
        });

        const colorInput = document.querySelector("#color") as HTMLInputElement;
        //colorInput.value = `#${body.material.color.getHexString()}`;

        colorInput.addEventListener("input", ()=>{
            body.material.color = new THREE.Color(colorInput.value);
            viewer.requestRender();
        });

        const metalInput = document.querySelector("#metallic") as HTMLInputElement;
        metalInput.addEventListener("change", () =>{
            body.material.metalness = metalInput.checked ? 1 : 0;
            body.material.roughness = metalInput.checked ? .4 : .1;
            viewer.requestRender();
        });

        viewDiv.value = viewer.view.toString();
        viewDiv.addEventListener("change", () => viewer.view = Number(viewDiv.value));

        viewer.addEventListener("objectclick", (e) => {
            const sprite = viewer.getObjectByName("sprite01")!;
            if ((e as CustomEvent).detail.object.name == sprite) return;
            viewer.lookAt(
                viewer.getObjectByName("logo_front")!, 
                viewer.TargetPoint.front, 
                viewer.TargetPoint.center, 
                -1, 
                1000,
                "linear");
            sprite.visible = false;

            const detail = document.querySelector("#detail") as HTMLDivElement;
            detail.style.opacity = "1";

            detail.querySelector("button")!.addEventListener("click", () => {
                viewer.view = viewer.TargetPoint.front_top_left;
                detail.style.opacity = "0";
                setTimeout(() => {
                    sprite.visible = true;
                }, 500);
            }, { once: true });
        });

        const inner:any = viewer.getObjectByName("Black07");
/*
        const originalMaterial = [body.material, inner.material];
        const xRayMaterial = new XRayMaterial(0x7f7fff);

        document.querySelector("#xray")?.addEventListener("change", (e)=>{
            body.material = (e.target as HTMLInputElement).checked ? xRayMaterial : originalMaterial[0];
            inner.material = (e.target as HTMLInputElement).checked ? xRayMaterial : originalMaterial[1];
            viewer.ssr = !(e.target as HTMLInputElement).checked;
        });
*/
    })
});