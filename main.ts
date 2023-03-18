import { ESBuilder, ESBuilderSettings } from "./server/ESBuilder.ts";
import { WebServer } from "./server/WebServer.ts";

import settings from "./settings.json" assert { type: "json" }
import denojson from "./deno.json" assert { type: "json"}
(settings.ESBuilder as ESBuilderSettings).imports = denojson.imports;

settings.WebServer.enabled ? new WebServer(settings.WebServer).start() : undefined;
settings.ESBuilder.enabled ? new ESBuilder(settings.ESBuilder).start() : undefined;
