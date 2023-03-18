import * as esbuild from "https://deno.land/x/esbuild@v0.17.8/mod.js";
import { resolve, join, basename } from "https://deno.land/std@0.176.0/path/mod.ts";

export type ESBuilderSettings = esbuild.BuildOptions & {
    enabled?: boolean;
    module?: boolean;
    imports?: Record<string, string>;
    staticFiles?: Record<string, string>;
}

export class ESBuilder {
    settings: ESBuilderSettings;

    constructor(settings:ESBuilderSettings){
        this.settings = Object.assign({}, settings);
        this.settings.format = this.settings.module ? "esm" : "cjs";

        const imports = new Map(Object.entries(this.settings.imports || {}));

        const sourceMapPlugin = {
            name: "source-map",
            setup(build:esbuild.PluginBuild){
                build.onResolve({ filter: /^[a-zA-Z]/}, args => {
                    const match:string[] | undefined = [...imports.entries()].find(item => args.path.indexOf(item[0])== 0);
                    return { path: match ? resolve(args.path.replace(match[0], match[1])) : args.path}
                })
            }
        }

        const staticFiles = new Map(Object.entries(this.settings.staticFiles || {}));

        const copyStaticFilesPlugin = {
            name: "copy-static-files",
            setup(build:esbuild.PluginBuild){
                build.onEnd(async ()=> {
                    for (const [src, dest] of staticFiles.entries()){
                        const p = join(
                            resolve(dest.replace("$OUTDIR", settings.outdir || "")),
                            basename(src));
                        await Deno.copyFile(resolve(src), p );
                    }
                })
            }
        }

        this.settings.plugins = [sourceMapPlugin, copyStaticFilesPlugin];

        delete this.settings.enabled;
        delete this.settings.module;
        delete this.settings.imports;
        delete this.settings.staticFiles;
    }

    async start() {
        const ctx = await esbuild.context(this.settings);
        await ctx.watch();
    }
}