/* Author: Luca Viggiani <lviggiani@gmail.com>
   Credits: https://github.com/lviggiani/dragonfly-threeviewer/
*/

import { EasingFunction, linear } from "./easing.ts";

export type Keyframe = {
    time: number;
    values: Record<string, number>
}

export type TweenerCallback = (values: Record<string, number>, time: number) => void

export class Tweener {
    private target:Record<string, number>;
    private keyframes = new Array<Keyframe>();
    private duration = 0;
    private callbacks = {
        update: new Array<TweenerCallback>(),
        end: new Array<TweenerCallback>()
    }

    private easingFunction:EasingFunction;
    private repeats: number;
    private time = 0;
    private lastTimestamp = 0;
    private playing = false;

    constructor(target:Record<string, number>, repeats = 1, easingFunction = linear){
        this.target = target;
        this.easingFunction = easingFunction;
        this.repeats = repeats;
        this.keyframes.push({ time: 0, values: Object.assign({}, target )});
    }

    addKeyframe(kf:Keyframe):this {
        if (this.keyframes.find(keyframe => keyframe.time == kf.time))
            throw new Error("Keyframe with same time already exists");

        Object.keys(kf.values).forEach(key => { if (this.target[key] === undefined) throw new Error("ivalid key") });

        if (kf.time < 0)
            throw new Error("Time out of bounds")

        this.keyframes.push(kf);
        this.keyframes.sort((a:Keyframe, b:Keyframe) => a.time < b.time ? -1 : 1);

        return this;
    }

    on(event: "update" | "end", callback:TweenerCallback):this {
        this.callbacks[event].push(callback);
        return this;
    }

    start():this {
        console.log(this.keyframes);
        this.duration = this.keyframes.at(-1)?.time || 0;
        this.time = 0;
        this.lastTimestamp = new Date().getTime();
        this.playing = true;
        this.onAnimationFrame();

        return this;
    }

    private onAnimationFrame():void {
        if (!this.playing) return;

        const elapsed = new Date().getTime() - this.lastTimestamp;
        this.time = Math.min(this.duration, this.time + elapsed);

        const t = this.easingFunction(this.time, 0, this.duration, this.duration);

        //TODO: compute values and call callbacks

        if (this.time === this.duration){
            this.repeats--;
            this.repeats > 0 ? this.time = 0 : this.playing = false;
        }

        console.log(this.time, t);

        //TODO: if (this.repeats == 0) call end callbacks

        this.lastTimestamp = new Date().getTime();
        requestAnimationFrame(() => this.onAnimationFrame());
    }
}