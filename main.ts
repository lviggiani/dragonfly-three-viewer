import { ESBuilder, ESBuilderSettings } from "./server/ESBuilder.ts";
import { WebServer } from "./server/WebServer.ts";

import settings from "./settings.json" assert { type: "json" }
import denojson from "./deno.json" assert { type: "json"}
(settings.ESBuilder as ESBuilderSettings).imports = denojson.imports;

new WebServer(settings.WebServer).start();
Deno.args.indexOf("--watch") != -1 ? new ESBuilder(settings.ESBuilder).start() : undefined;

