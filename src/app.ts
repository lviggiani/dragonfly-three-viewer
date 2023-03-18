// deno-lint-ignore-file no-explicit-any
import { ThreeViewer, ThreeViewerEvent } from "./components/threeviewer/ThreeViewer.ts";

export { BUILD_NUMBER } from "./build_number.ts";
export { ThreeViewer, ThreeViewerEvent } from "./components/threeviewer/ThreeViewer.ts";

addEventListener("load", () => {
    const viewer = document.querySelector("df-three-viewer") as ThreeViewer;
    const envSel = document.querySelector("#envmap") as HTMLInputElement;
    envSel.value = viewer.envsrc.match(/([^\/]+)\./)![1];
    envSel.addEventListener("change", () => viewer.envsrc = `envmaps/${envSel.value}.exr`);

    const expInput = document.querySelector("#exposure") as HTMLInputElement;
    expInput.value = viewer.exposure.toString();
    expInput.addEventListener("input", () => viewer.exposure = Number(expInput.value));

    viewer.addEventListener(ThreeViewerEvent.load, _ => {
        const info = viewer.info;
        document.querySelector("#info")!.textContent = `geometries: ${info.geometries} | textures: ${info.textures} | polygons: ${info.triangles.toLocaleString()}`;
    });

    document.querySelector("#bloom")?.addEventListener("change", 
        (e) => viewer.bloom =(e.target as HTMLInputElement).checked);

    document.querySelector("#ssr")?.addEventListener("change", 
        (e) => viewer.ssr =(e.target as HTMLInputElement).checked);

    let saveMap:any = null;

    document.querySelector("#ao")?.addEventListener("change", (e) => {
        const v = (e.target as HTMLInputElement).checked;
        const object:any = viewer.getObjectByName("body");

        if (!v) saveMap = object.material.map;
        object.material.map = v ? saveMap : null;
        viewer.requestRender();
    });
});