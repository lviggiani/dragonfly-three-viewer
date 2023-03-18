import { ThreeViewer, ThreeViewerEvent } from "./components/threeviewer/ThreeViewer.ts";

export { BUILD_NUMBER } from "./build_number.ts";
export { ThreeViewer, ThreeViewerEvent } from "./components/threeviewer/ThreeViewer.ts";

addEventListener("load", () => {
    const viewer = document.querySelector("txt-three-viewer") as ThreeViewer;
    const envSel = document.querySelector("#envmap") as HTMLInputElement;
    envSel.value = viewer.envsrc.match(/([^\/]+)\./)![1];
    envSel.addEventListener("change", () => viewer.envsrc = `envmaps/${envSel.value}.exr`);

    const expInput = document.querySelector("#exposure") as HTMLInputElement;
    expInput.value = viewer.exposure.toString();
    expInput.addEventListener("input", () => viewer.exposure = Number(expInput.value));

    viewer.addEventListener(ThreeViewerEvent.load, _ => {
        const info = viewer.info;
        document.querySelector("#info")!.textContent = `geometries: ${info.geometries} | textures: ${info.textures} | triangles: ${info.triangles.toLocaleString()}`;
    });
});