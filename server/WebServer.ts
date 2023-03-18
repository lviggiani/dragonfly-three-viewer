import {
    serve,
    type ServeInit,
  } from "https://deno.land/std@0.177.0/http/server.ts";
  
  import {
    ReasonPhrases,
    StatusCodes,
  } from "https://deno.land/x/https_status_codes@v1.2.0/mod.ts";
  
  import { mime } from "https://deno.land/x/mimetypes@v1.0.0/mod.ts";
  
  export type WebServerSettings = ServeInit & {
    dirs: Partial<Record<string, string>> & { default: string };
  };
  
  export class WebServer {
    settings: WebServerSettings;
  
    constructor(settings: WebServerSettings) {
      this.settings = settings;
    }
  
    start() {
      const onListen = this.settings.onListen ??
        (({ port }) => console.log(`Web Server up and running on port ${port}`));
      return serve(this.handleRequest, { ...this.settings, onListen });
    }
  
    private handleRequest = async (request: Request): Promise<Response> => {
      const url = new URL(request.url);
      let filepath = decodeURIComponent(url.pathname);
  
      const root: string = (filepath.match(/\/[^\/]*/) || [""])[0];
      const local = new Map(Object.entries(this.settings.dirs)).get(root) ||
        this.settings.dirs.default + root;
  
      filepath = local +
        filepath.replace(/^\/?$/, "/index.html")
          .replace(root, "");
  
      let file: Deno.FsFile;
      try {
        file = await Deno.open(filepath, { read: true });
      } catch {
        return new Response(
          ReasonPhrases.NOT_FOUND,
          { status: StatusCodes.NOT_FOUND },
        );
      }
  
      const contentType = mime.getType(filepath) || "application/octet-stream";
  
      return new Response(file.readable, {
        headers: {
          "Content-Type": contentType,
        },
      });
    };
  }
  