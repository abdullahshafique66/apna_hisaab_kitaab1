// Turns dist-single/index.html into a body-only page for the hosted artifact preview:
// strips doctype/html/head/body wrappers and PWA links that the sandbox can't use.
import { readFileSync, writeFileSync } from "node:fs";
let html = readFileSync("dist-single/index.html", "utf8");
const head = html.match(/<head>([\s\S]*?)<\/head>/)[1];
const body = html.match(/<body>([\s\S]*?)<\/body>/)[1];
const keepHead = head
  .replace(/<meta charset[^>]*>/, "")
  .replace(/<meta name="viewport"[^>]*>/, "")
  .replace(/<link rel="manifest"[^>]*>/, "")
  .replace(/<link rel="icon"[^>]*>/, "")
  .replace(/<link rel="apple-touch-icon"[^>]*>/, "")
  .replace(/<meta name="apple-mobile-web-app[^>]*>/g, "");
// title must be within the first 8KB
const title = keepHead.match(/<title>[\s\S]*?<\/title>/)[0];
const rest = keepHead.replace(title, "");
writeFileSync("dist-single/apna-hisab-kitaab.html", `${title}\n${rest}\n${body}\n`);
console.log("artifact bytes:", Buffer.byteLength(`${title}${rest}${body}`));
