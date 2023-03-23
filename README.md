# Introduction 
This repo contains the source files both for radici car viewer app and for generic 3D web viewer besed on threejs
# Getting Started
After cloning the repo, install `deno` (https://deno.land/manual@v1.32.0/getting_started/installation)

For VSCode also install `Deno` addon

# Build and Test
run `deno task dist` to build for distribution. Result is in `dist` folder:

`dist/server.exe` is meant for standalone distribution only.
For web integration `dist/client` folder only is required.

To run it in standalone mode, launch `server.exe` and then open `http://localhost:8080` in your web browser

run `deno task dev` to run it for development

# Contribute
run `deno task dev` to run it for development

- `client` folder contains the **static files**

**WARNING:** files in `client/js/dist` are automatically generated or copied. Do not change them as your changes will be automatically ovewritten without notice.
- `src` folder contains the **source `ts` files** that are automatically built upon changes (while running `deno task dev`)
- `server` is meant for development only and provides a local web server and the automatic build system for `src`.

Generally you won't touch `server` unless there are changes in the dev pipeline
- `test files` contains sample files for testing the 3D viewer

`src/app.ts` is the application entry point