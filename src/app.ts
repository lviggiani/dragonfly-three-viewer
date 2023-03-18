import { ThreeViewer } from "./components/threeviewer/ThreeViewer.ts";

export { BUILD_NUMBER } from "./build_number.ts";
export { ThreeViewer } from "./components/threeviewer/ThreeViewer.ts";

addEventListener("load", () => {
    const viewer = document.querySelector("txt-three-viewer") as ThreeViewer;
    const envSel = document.querySelector("#envmap") as HTMLInputElement;
    envSel.value = viewer.envsrc.match(/([^\/]+)\./)![1];
    envSel.addEventListener("change", () => viewer.envsrc = `envmaps/${envSel.value}.exr`);
});