// deno-lint-ignore-file no-explicit-any
import { ThreeViewer, ThreeViewerEvent } from "./components/threeviewer/ThreeViewer.ts";
import { ViewAngle } from "./components/threeviewer/Cameraman.ts";

export { BUILD_NUMBER } from "./build_number.ts";

import * as THREE from "three";

addEventListener("load", () => {
    const viewer = document.querySelector("df-three-viewer") as ThreeViewer;

    const viewDiv = document.querySelector("#view") as HTMLSelectElement;
    Object.values(ViewAngle)
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
        const metalInput = document.querySelector("#metallic") as HTMLInputElement;

        if (body){
            colorInput.value = `#${body.material.color.getHexString()}`;
    
            colorInput.addEventListener("input", ()=>{
                body.material.color = new THREE.Color(colorInput.value);
                viewer.requestRender();
            });
    
            metalInput.addEventListener("change", () =>{
                body.material.metalness = metalInput.checked ? 1 : 0;
                body.material.roughness = metalInput.checked ? .4 : .1;
                viewer.requestRender();
            });
        } else {
            colorInput.style.display = "none";
            metalInput.style.display = "none";
        }

        viewDiv.value = viewer.view.toString();
        viewDiv.addEventListener("change", () => viewer.view = Number(viewDiv.value));
    })
});