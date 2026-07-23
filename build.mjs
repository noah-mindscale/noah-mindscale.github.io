import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";

const html = readFileSync("index.html", "utf8");
const socialCard = readFileSync("og.png").toString("base64");

const worker = `
const html = ${JSON.stringify(html)};
const socialCard = ${JSON.stringify(socialCard)};

function decodeBase64(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const isHead = request.method === "HEAD";

    if (url.pathname === "/og.png") {
      return new Response(isHead ? null : decodeBase64(socialCard), {
        headers: {
          "content-type": "image/png",
          "cache-control": "public, max-age=86400"
        }
      });
    }

    if (request.method !== "GET" && !isHead) {
      return new Response("Method Not Allowed", { status: 405 });
    }

    if (url.pathname === "/" || url.pathname === "/index.html" || url.pathname === "/mindscale-standalone.html") {
      return new Response(isHead ? null : html, {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "public, max-age=300"
        }
      });
    }

    return new Response("Not Found", { status: 404 });
  }
};
`;

rmSync("dist", { recursive: true, force: true });
mkdirSync("dist/server", { recursive: true });
mkdirSync("dist/.openai", { recursive: true });
writeFileSync("dist/server/index.js", worker);
copyFileSync(".openai/hosting.json", "dist/.openai/hosting.json");

console.log("MindScale site build complete.");
