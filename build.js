#!/usr/bin/env node
/**
 * Injects src/data.json into src/app.html and emits two builds of the same page:
 *   index.html          standalone, for GitHub Pages (live rate fetch works)
 *   dist/artifact.html  body fragment, for publishing as a Claude Artifact
 *                       (CSP blocks the fetch, so it runs on the snapshot)
 *
 *   node scripts/fetch-data.js   # refresh the rate snapshot
 *   node build.js
 */
const fs = require("fs");
const path = require("path");

const src = fs.readFileSync(path.join(__dirname, "src", "app.html"), "utf8");
const dataPath = path.join(__dirname, "src", "data.json");

if (!fs.existsSync(dataPath)) {
  console.error("src/data.json is missing — run: node scripts/fetch-data.js");
  process.exit(1);
}
const data = fs.readFileSync(dataPath, "utf8");
JSON.parse(data); // fail loudly rather than shipping a broken page

if (src.indexOf("__PW_DATA__") === -1) {
  console.error("src/app.html has no __PW_DATA__ placeholder");
  process.exit(1);
}
// </script> inside the JSON payload would close the host script tag early.
const fragment = src.replace("__PW_DATA__", data.replace(/<\//g, "<\\/"));

const title = (fragment.match(/<title>([\s\S]*?)<\/title>/) || [, "Prepay or Wait"])[1];
const body = fragment.replace(/<title>[\s\S]*?<\/title>\s*/, "").trim();

const standalone = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="Work out whether to prepay a trip at today's exchange rate or wait and pay on arrival — any country, live rates.">
<style>*,*::before,*::after{box-sizing:border-box}body{margin:0}p,h1,h2,h3{margin:0}</style>
</head>
<body>
${body}
</body>
</html>
`;

fs.mkdirSync(path.join(__dirname, "dist"), { recursive: true });
fs.writeFileSync(path.join(__dirname, "index.html"), standalone);
fs.writeFileSync(path.join(__dirname, "dist", "artifact.html"), fragment.trim() + "\n");

const kb = (n) => (n / 1024).toFixed(0) + "kB";
console.log("wrote index.html (" + kb(standalone.length) + ") and dist/artifact.html (" + kb(fragment.length) + ")");
