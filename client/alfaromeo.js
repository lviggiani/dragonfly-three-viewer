export default class Alfaromeo {
    constructor(target, view){
        this.target = target;
        this.view = view;
        this.init()
    }

    async init(){
        const _body = this.target.getObjectByName("body");
        const plane = this.target.getObjectByName("Plane");
        const logo = this.target.getObjectByName("logo_front");

        //logo.cursor = "pointer";
        plane.excludeFromBox = true;

        const point = this.view.cameraman.getObjectViewPoint(logo, this.view.TargetPoint.front_top_left);
        const sprite = await this.view.addSprite("sprite01", "img/plus.png", 32, 32);
        sprite.position.copy(point);
        sprite.center.set(0, 0);
        sprite.cursor = "pointer";

    }
}