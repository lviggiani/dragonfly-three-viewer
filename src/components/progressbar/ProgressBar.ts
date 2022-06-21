import { PREFIX } from "../Globals.ts";
import * as constants from "./constants.ts";

export class ProgressBar extends HTMLElement {
    private shadow:ShadowRoot;

    constructor(){
        super();
        this.shadow = this.attachShadow({ mode: "closed" });
        this.shadow.appendChild(document.createElement("style")).innerHTML = constants.STYLE;
    }

    attributeChangedCallback(name:string, _oldValue:string, newValue:string):void{
        switch(name){
            case "value": {
                const color = getComputedStyle(this).getPropertyValue("border-color");
                const per = `${100 * Number(newValue)}%`;
                this.style.background = `linear-gradient(to right, ${color} ${per}, transparent ${per})`;
            }
        }
    }

    get value():number {
        return Number(this.getAttribute("value"));
    }

    set value(value:number){
        this.setAttribute("value", Math.min(1, Math.max(0, value)).toString());
    }

    static get observedAttributes() { return ["value"]; }
}

customElements.define(`${PREFIX}-progressbar`, ProgressBar);