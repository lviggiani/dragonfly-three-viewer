// deno-lint-ignore-file no-explicit-any
/* Author: Luca Viggiani <lviggiani@gmail.com>
   Credits: https://github.com/lviggiani/dragonfly-threeviewer/
*/
import {
    Box3,
    Vector3,
    PerspectiveCamera,
    Object3D,
    Sphere,
    Scene
} from "three";

import { OrbitControls } from "three/controls/OrbitControls.js";

import { deg2Rad } from "../../utils/math-utils.ts";

export type Angles = {
    a:number;
    b:number;
}

export enum ViewAngle {
    "center",               // 0
    "front",                // 1
    "top",                  // 2
    "bottom",               // 3
    "rear",                 // 4
    "left",                 // 5
    "right",                // 6
    "front_top",            // 7
    "front_left",
    "front_right",
    "front_bottom",
    "front_top_left",
    "front_top_right",
    "front_bottom_left",
    "front_bottom_right",
    "rear_top",
    "rear_left",
    "rear_right",
    "rear_bottom",
    "rear_top_left",
    "rear_top_right",
    "rear_bottom_left",
    "rear_bottom_right",
    "left_top",
    "left_bottom",
    "right_top",
    "right_bottom"
}

const VIEW_ANGLES= new Map<ViewAngle, Angles | null>([
    [ViewAngle.center, null],

    [ViewAngle.front, { a: Math.PI / 2, b: 0 }],
    [ViewAngle.top, { a: Math.PI / 2, b: Math.PI / 2 }],
    [ViewAngle.bottom, { a: Math.PI / 2, b: -Math.PI / 2 }],
    [ViewAngle.rear, { a: -Math.PI / 2, b: 0 }],
    [ViewAngle.left, { a: 0, b: 0 }],
    [ViewAngle.right, { a: Math.PI, b: 0 }],

    [ViewAngle.front_top, { a: Math.PI / 2, b: Math.PI / 4 }],
    [ViewAngle.front_left, { a: Math.PI / 4, b: 0 }],
    [ViewAngle.front_right, { a: Math.PI * .75, b: 0 }],
    [ViewAngle.front_bottom, { a: Math.PI / 2, b: -Math.PI / 4 }],

    [ViewAngle.front_top_left, { a: Math.PI / 4, b: Math.PI / 4 }],
    [ViewAngle.front_top_right, { a: Math.PI * .75, b: Math.PI / 4 }],
    [ViewAngle.front_bottom_left, { a: Math.PI / 4, b: -Math.PI / 4 }],
    [ViewAngle.front_bottom_right, { a: Math.PI * .75, b: -Math.PI / 4 }],

    [ViewAngle.rear_top, { a: -Math.PI / 2, b: Math.PI / 4 }],
    [ViewAngle.rear_left, { a: -Math.PI / 4, b: 0 }],
    [ViewAngle.rear_right, { a: -Math.PI * .75, b: 0 }],
    [ViewAngle.rear_bottom, { a: -Math.PI / 2, b: -Math.PI / 4 }],

    [ViewAngle.rear_top_left, { a: -Math.PI / 4, b: Math.PI / 4 }],
    [ViewAngle.rear_top_right, { a: -Math.PI * .75, b: Math.PI / 4 }],
    [ViewAngle.rear_bottom_left, { a: -Math.PI / 4, b: -Math.PI / 4 }],
    [ViewAngle.rear_bottom_right, { a: -Math.PI * .75, b: -Math.PI / 4 }],

    [ViewAngle.left_top, { a: 0, b: Math.PI / 4 }],
    [ViewAngle.left_bottom, { a: 0, b: -Math.PI / 4 }],

    [ViewAngle.right_top, { a: Math.PI, b: Math.PI / 4 }],
    [ViewAngle.right_bottom, { a: Math.PI, b: -Math.PI / 4 }]
]);

class Cameraman {
    private camera:PerspectiveCamera;
    private renderCallback: () => void;
    private userControls: OrbitControls;

    constructor(camera:PerspectiveCamera, userControls: OrbitControls, renderCallback: () => void){
        this.camera = camera;
        this.renderCallback = renderCallback;
        this.userControls = userControls;
    }

    lookAt(target:Object3D, viewFrom = ViewAngle.front, lookAt = ViewAngle.center, distanceFactor = -1){

        const scene = this.findScene(target)!;
        scene.updateMatrixWorld();

        const _positionStart = (this.camera as any).position.clone(),
              _rotationStart = (this.camera as any).rotation.clone();

        const lookAtPoint = this.getObjectViewPoint(target, lookAt),
              positionEnd = this.getObjectViewPoint(target, viewFrom);

        distanceFactor = distanceFactor <= 0 ? Math.tan(Math.PI / 2 - deg2Rad(this.camera.fov / 2)) : distanceFactor;
        if (this.userControls) this.userControls.enabled = false;

        (this.camera as any).position.copy(new Vector3().lerpVectors(lookAtPoint, positionEnd, distanceFactor));
        this.camera.lookAt(lookAtPoint);
        this.camera.updateProjectionMatrix();

        if (this.userControls) {
            this.userControls.target.copy(lookAtPoint);
            this.userControls.enabled = true;
        }

        this.renderCallback();
    }

    getObjectViewPoint(target: Object3D, pointName: ViewAngle){
        const box = this.getBoundingBox(target),
              size:Vector3 = box.getSize(new Vector3()),
              sphere = box.getBoundingSphere(new Sphere());

        if (VIEW_ANGLES.get(pointName) === undefined){
            console.warn(`Invalid value "${pointName}". Falling back to "center"`);
            pointName = ViewAngle.center;
        }

        // z coordinate is towards you
        switch(pointName){
            case ViewAngle.center: return box.getCenter(new Vector3());
            default: {
                const { a, b } = VIEW_ANGLES.get(pointName)!;
                const v = new Vector3(
                    Math.cos(a) * Math.cos(b) * size.x / 2,
                    Math.sin(b) * size.y / 2,
                    Math.sin(a) * Math.cos(b) * size.z / 2);
                
                const c = sphere.radius / v.length();
                return box.getCenter(new Vector3()).add(v.multiplyScalar(c));
            }
        }
    }

    private getBoundingBox(target:Object3D):Box3{
        const box = new Box3();
        target.traverse((obj:Object3D & {excludeFromBox?:boolean }) =>
            obj.excludeFromBox || obj.type != "Mesh" ? undefined : box.expandByObject(obj));

        return box;
    }

    private findScene(target:Object3D):Scene | null {
        while (target && !(target instanceof Scene))
            target = target.parent;

        return target;
    }
}

export { Cameraman }