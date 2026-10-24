// Build once, serve only dist on a temporary loopback port, close after the check.
const http = require("node:http"),
  fs = require("node:fs"),
  path = require("node:path");
const { spawn } = require("node:child_process");
function run(file, env = process.env, args = []) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [file, ...args], {
      env,
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("close", (code) =>
      code === 0 ? resolve() : reject(new Error(`Check exited ${code}`)),
    );
  });
}
(async () => {
  await run("node_modules/vite/bin/vite.js", process.env, ["build"]);
  const root = path.resolve("dist");
  const types = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".svg": "image/svg+xml",
    ".ttf": "font/ttf",
    ".json": "application/json",
  };
  const server = http.createServer((request, response) => {
    try {
      const relative = decodeURIComponent(
        new URL(request.url, "http://localhost").pathname,
      );
      const target = path.resolve(
        root,
        "." + (relative === "/" ? "/index.html" : relative),
      );
      if (target !== root && !target.startsWith(root + path.sep)) {
        response.writeHead(403).end();
        return;
      }
      fs.stat(target, (error, stat) => {
        if (error || !stat.isFile()) {
          response.writeHead(404).end();
          return;
        }
        response.setHeader(
          "Content-Type",
          types[path.extname(target)] || "application/octet-stream",
        );
        fs.createReadStream(target).pipe(response);
      });
    } catch {
      response.writeHead(400).end();
    }
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    await run("tests/e2e.cjs", {
      ...process.env,
      TEST_URL: `http://127.0.0.1:${server.address().port}`,
    });
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
