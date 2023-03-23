export default class Alfaromeo {
    constructor(target, view){
        this.target = target;
        this.view = view;
        const _body = target.getObjectByName("body");
        const plane = target.getObjectByName("Plane");
        const logo = target.getObjectByName("logo_front");

        logo.cursor = "pointer";
        plane.excludeFromBox = true;

        view.addEventListener("objectclick", e => {
            if (e.detail.object != logo) return;
            view.cameraman.lookAt(logo, 1, 0);
        })
    }
}