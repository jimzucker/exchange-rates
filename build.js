#!/usr/bin/env node
// Wraps the artifact fragment in src/app.html into a standalone index.html
// so the same source ships both as a Claude Artifact and on GitHub Pages.
const fs = require("fs");
const path = require("path");

const src = fs.readFileSync(path.join(__dirname, "src", "app.html"), "utf8");
const title = (src.match(/<title>([\s\S]*?)<\/title>/) || [, "Prepay or Wait"])[1];
const body = src.replace(/<title>[\s\S]*?<\/title>\s*/, "");

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<meta name="description" content="Work out whether to prepay a trip at today's exchange rate or wait and pay later.">
<style>*,*::before,*::after{box-sizing:border-box}body{margin:0}p,h1,h2,h3{margin:0}</style>
</head>
<body>
${body.trim()}
</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, "index.html"), html);
console.log("wrote index.html (" + html.length + " bytes)");
