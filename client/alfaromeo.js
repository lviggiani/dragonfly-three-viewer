export default class Alfaromeo {
    constructor(target, view){
        this.target = target;
        this.view = view;
        const body = target.getObjectByName("body");
        body.cursor = "pointer";

        console.log(body);
    }
}