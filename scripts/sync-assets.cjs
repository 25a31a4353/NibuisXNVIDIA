const fs = require("node:fs");
const path = require("node:path");
const pairs = [["app.js", "public/app.js"], ["styles.css", "public/styles.css"]];
for (const [source, target] of pairs) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}
console.log("Synchronized canonical UI source into public assets.");
