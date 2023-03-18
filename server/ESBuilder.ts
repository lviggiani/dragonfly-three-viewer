import * as esbuild from "https://deno.land/x/esbuild@v0.17.8/mod.js";

export type ESBuilderSettings = esbuild.BuildOptions & {
    enabled?: boolean;
    module?: boolean;
}

export class ESBuilder {
    settings: ESBuilderSettings;

    constructor(settings:ESBuilderSettings){
        this.settings = Object.assign({}, settings);
        this.settings.format = this.settings.module ? "esm" : "cjs";
        delete this.settings.enabled;
        delete this.settings.module;
    }

    async start() {
        const ctx = await esbuild.context(this.settings);
        await ctx.watch();
    }
}