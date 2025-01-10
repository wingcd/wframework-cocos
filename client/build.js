const esbuild = require('esbuild');
const glob = require("tiny-glob");
const fs = require("fs");
const { nodeExternalsPlugin } = require('esbuild-node-externals');

(async () => {
    let entryPoints = await glob("./assets/scripts/**/**/*.ts");
    let metas = await glob("./**/*.meta");
    let srcs = "";
    for (const entry of entryPoints) {
        srcs += "import './" + entry.replace(/\\/gi, "/") + "'\n";
    }
    fs.writeFileSync("./index.ts", srcs);
    await esbuild.build({
        entryPoints: ["index.ts"],
        outfile: "dist/wframework-ccc.js",
        bundle: true,
        minify: false,
        platform: 'node',
        sourcemap: false,
        target: 'node14',
        loader: {
            ".ts": "ts",
            ".js": "js",
        },
        format:"cjs",
        // plugins: [nodeExternalsPlugin()],
        external: ['cc', "cc/env", "*.meta"]
    });
  })();