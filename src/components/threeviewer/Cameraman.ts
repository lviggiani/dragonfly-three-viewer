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
    Scene,
    QuadraticBezierCurve3
} from "three";

import { OrbitControls } from "three/controls/OrbitControls.js";

import { deg2Rad } from "../../utils/math-utils.ts";

import * as TWEEN from "../../vendor/tween.esm.js";

export type Angles = {
    a:number;
    b:number;
}

export enum TargetPoint {
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

const VIEW_ANGLES= new Map<TargetPoint, Angles | null>([
    [TargetPoint.center, null],

    [TargetPoint.front, { a: Math.PI / 2, b: 0 }],
    [TargetPoint.top, { a: Math.PI / 2, b: Math.PI / 2 }],
    [TargetPoint.bottom, { a: Math.PI / 2, b: -Math.PI / 2 }],
    [TargetPoint.rear, { a: -Math.PI / 2, b: 0 }],
    [TargetPoint.left, { a: 0, b: 0 }],
    [TargetPoint.right, { a: Math.PI, b: 0 }],

    [TargetPoint.front_top, { a: Math.PI / 2, b: Math.PI / 4 }],
    [TargetPoint.front_left, { a: Math.PI / 4, b: 0 }],
    [TargetPoint.front_right, { a: Math.PI * .75, b: 0 }],
    [TargetPoint.front_bottom, { a: Math.PI / 2, b: -Math.PI / 4 }],

    [TargetPoint.front_top_left, { a: Math.PI / 4, b: Math.PI / 4 }],
    [TargetPoint.front_top_right, { a: Math.PI * .75, b: Math.PI / 4 }],
    [TargetPoint.front_bottom_left, { a: Math.PI / 4, b: -Math.PI / 4 }],
    [TargetPoint.front_bottom_right, { a: Math.PI * .75, b: -Math.PI / 4 }],

    [TargetPoint.rear_top, { a: -Math.PI / 2, b: Math.PI / 4 }],
    [TargetPoint.rear_left, { a: -Math.PI / 4, b: 0 }],
    [TargetPoint.rear_right, { a: -Math.PI * .75, b: 0 }],
    [TargetPoint.rear_bottom, { a: -Math.PI / 2, b: -Math.PI / 4 }],

    [TargetPoint.rear_top_left, { a: -Math.PI / 4, b: Math.PI / 4 }],
    [TargetPoint.rear_top_right, { a: -Math.PI * .75, b: Math.PI / 4 }],
    [TargetPoint.rear_bottom_left, { a: -Math.PI / 4, b: -Math.PI / 4 }],
    [TargetPoint.rear_bottom_right, { a: -Math.PI * .75, b: -Math.PI / 4 }],

    [TargetPoint.left_top, { a: 0, b: Math.PI / 4 }],
    [TargetPoint.left_bottom, { a: 0, b: -Math.PI / 4 }],

    [TargetPoint.right_top, { a: Math.PI, b: Math.PI / 4 }],
    [TargetPoint.right_bottom, { a: Math.PI, b: -Math.PI / 4 }]
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

    lookAt(target:Object3D, 
        viewFrom = TargetPoint.front,
        lookAt = TargetPoint.center,
        distanceFactor = -1,
        time = 0,
        pathType: "linear" | "curved" = "linear"){

        return new Promise<void>((resolve) => {
            const scene = this.findScene(target)!;
            scene.updateMatrixWorld();
    
            this.userControls.update();
            const positionStart = (this.camera as any).position.clone() as Vector3,
                  lookAtStart = this.userControls.target.clone() as Vector3;
    
            distanceFactor = distanceFactor <= 0 ? Math.tan(Math.PI / 2 - deg2Rad(this.camera.fov / 2)) : distanceFactor;
    
            const lookAtEnd = this.getObjectViewPoint(target, lookAt),
                  positionEnd = new Vector3().lerpVectors(
                    lookAtEnd, this.getObjectViewPoint(target, viewFrom), distanceFactor);
    
            this.userControls.enabled = false;
    
            const o = { t: 0 };
    
            const animate = () => 
                TWEEN.update() ? requestAnimationFrame(animate) : undefined;

            const bezier = pathType == "curved" ?
                new QuadraticBezierCurve3(
                    positionStart,
                    this.getCurveControlPoint(positionStart, positionEnd, target),
                    positionEnd) : undefined;
    
            new TWEEN.Tween(o)
            .to({ t: 1}, time)
            .easing(TWEEN.Easing.Quartic.Out)
            .onUpdate(() =>{
                const t = o.t;
                if (pathType == "linear"){
                    (this.camera as any).position.copy(new Vector3().lerpVectors(positionStart, positionEnd, t));
                } else {
                    bezier?.getPoint(t, (this.camera as any).position);
                }
                this.camera.lookAt(new Vector3().lerpVectors(lookAtStart, lookAtEnd, t));
                this.camera.updateProjectionMatrix();
                this.userControls.target.copy(new Vector3().lerpVectors(lookAtStart, lookAtEnd, t));
                this.renderCallback();
            })
            .onComplete(() => {
                this.userControls.enabled = true;
                this.renderCallback();
                resolve();
            })
            .start();
            animate();
        })
    }

    getObjectViewPoint(target: Object3D, pointName: TargetPoint):Vector3 {
        const box = this.getBoundingBox(target),
              size:Vector3 = box.getSize(new Vector3()),
              sphere = box.getBoundingSphere(new Sphere());

        if (VIEW_ANGLES.get(pointName) === undefined){
            console.warn(`Invalid value "${pointName}". Falling back to "center"`);
            pointName = TargetPoint.center;
        }

        // z coordinate is towards you
        switch(pointName){
            case TargetPoint.center: return box.getCenter(new Vector3());
            default: {
                const { a, b } = VIEW_ANGLES.get(pointName)!;
                const v = new Vector3(
                    Math.cos(a) * Math.cos(b) * size.x / 2,
                    Math.sin(b) * size.y / 2,
                    Math.sin(a) * Math.cos(b) * size.z / 2);
                
                const c = v.length() ? sphere.radius / v.length() : 0;
                return box.getCenter(new Vector3()).add(v.multiplyScalar(c));
            }
        }
    }

    getCurveControlPoint(a:Vector3, b:Vector3, target:Object3D):Vector3 {
        const p = new Vector3().lerpVectors(a, b, Math.SQRT1_2);
        let c = new Vector3()
        .subVectors(a, p)
        .applyAxisAngle(new Vector3(0, 1, 0), Math.PI / 2)
        .add(new Vector3().lerpVectors(a, b, .5));

        if (new Box3().setFromObject(target).containsPoint(c))
            c = new Vector3()
            .subVectors(b, p)
            .applyAxisAngle(new Vector3(0, 1, 0), -Math.PI / 2)
            .add(new Vector3().lerpVectors(a, b, .5));

        return c;
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