import { readFile, writeFile, readdir } from "fs/promises";
import { existsSync } from "fs";
import { mkdir } from "fs/promises";
import { extname } from "path";
import { createHash } from "crypto";

import { rollup } from "rollup";
import esbuild from "rollup-plugin-esbuild";
import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
import swc from "@swc/core";

function parseReadme(content) {
    const lines = content.split('\n');
    const front = {};
    let i = 0;
    while (i < lines.length && lines[i].startsWith('<meta ')) {
        const line = lines[i];
        const match = line.match(/property="([^"]+)" content="([^"]+)"/) || line.match(/name="([^"]+)" content="([^"]+)"/);
        if (match) {
            const key = match[1].replace(/:/g, '_').replace(/-/g, '_');
            front[key] = match[2];
        }
        i++;
    }
    const body = lines.slice(i).join('\n');
    return { front, body };
}

const extensions = [".js", ".jsx", ".mjs", ".ts", ".tsx", ".cts", ".mts"];

/** @type import("rollup").InputPluginOption */
const plugins = [
    nodeResolve({ extensions }),
    commonjs(),
    json(),
    {
        name: "swc",
        async transform(code, id) {
            const ext = extname(id);
            if (!extensions.includes(ext)) return null;

            const ts = ext.includes("ts");
            const tsx = ts ? ext.endsWith("x") : undefined;
            const jsx = !ts ? ext.endsWith("x") : undefined;

            const result = await swc.transform(code, {
                filename: id,
                jsc: {
                    externalHelpers: true,
                    parser: {
                        syntax: ts ? "typescript" : "ecmascript",
                        tsx,
                        jsx,
                    },
                },
                env: {
                    targets: "defaults",
                    include: [
                        "transform-classes",
                        "transform-arrow-functions",
                    ],
                },
            });
            return result.code;
        },
    },
    esbuild({ minify: true }),
];

for (let plug of await readdir("./plugins")) {
    const manifest = JSON.parse(await readFile(`./plugins/${plug}/manifest.json`));
    const outPath = `./dist/${plug}/index.js`;

    try {
        const bundle = await rollup({
            input: `./plugins/${plug}/${manifest.main}`,
            onwarn: () => { },
            plugins,
        });

        await bundle.write({
            file: outPath,
            globals(id) {
                if (id.startsWith("@vendetta")) return id.substring(1).replace(/\//g, ".");
                const map = {
                    react: "window.React",
                };

                return map[id] || null;
            },
            format: "iife",
            compact: true,
            exports: "named",
        });
        await bundle.close();

        const toHash = await readFile(outPath);
        manifest.hash = createHash("sha256").update(toHash).digest("hex");
        manifest.main = "index.js";
        await writeFile(`./dist/${plug}/manifest.json`, JSON.stringify(manifest));

        const readmePath = `./plugins/${plug}/README.md`;
        if (existsSync(readmePath)) {
            const content = await readFile(readmePath, 'utf8');
            const { front, body } = parseReadme(content);
            const frontStr = Object.keys(front).length ? '---\nlayout: page\n' + Object.entries(front).map(([k,v]) => `${k}: "${v.replace(/"/g, '\\"')}"`).join('\n') + '\n---\n' : '---\nlayout: page\n---\n';
            await writeFile(`./dist/${plug}/index.md`, frontStr + body);
        } else {
            const content = `---\nlayout: page\ntitle: "${manifest.name}"\n---\n# ${manifest.name}\n\n${manifest.description}\n\n## Installation\n\nCopy the following link and paste it into the Plugins page of Vendetta:\n\nhttps://vaiskiainen.github.io/testplugins/${plug}\n\n## Authors\n\n${manifest.authors.map(a => `- **${a.name}**`).join('\n')}`;
            await writeFile(`./dist/${plug}/index.md`, content);
        }

        console.log(`Successfully built ${manifest.name}!`);
    } catch (e) {
        console.error("Failed to build plugin...", e);
        process.exit(1);
    }
}

await mkdir('./dist/_layouts', { recursive: true });
await writeFile('./dist/_layouts/page.html', `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{{ page.title | default: site.title }}</title>
{% if page.og_title %}<meta property="og:title" content="{{ page.og_title }}">{% endif %}
{% if page.og_description %}<meta property="og:description" content="{{ page.og_description }}">{% endif %}
{% if page.og_image %}<meta property="og:image" content="{{ page.og_image }}">{% endif %}
{% if page.og_url %}<meta property="og:url" content="{{ page.og_url }}">{% endif %}
<meta property="og:type" content="website">
<meta property="og:site_name" content="Testplugins">
{% if page.twitter_card %}<meta name="twitter:card" content="{{ page.twitter_card }}">{% endif %}
{% if page.twitter_title %}<meta name="twitter:title" content="{{ page.twitter_title }}">{% endif %}
{% if page.twitter_description %}<meta name="twitter:description" content="{{ page.twitter_description }}">{% endif %}
{% if page.twitter_image %}<meta name="twitter:image" content="{{ page.twitter_image }}">{% endif %}
{% if page.theme_color %}<meta name="theme-color" content="{{ page.theme_color }}">{% endif %}
{% if page.author %}<meta name="author" content="{{ page.author }}">{% endif %}
</head>
<body>
{{ content }}
</body>
</html>`);
