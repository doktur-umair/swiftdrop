import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createServer } from "node:net";
import { setTimeout } from "node:timers/promises";
const probe = createServer();
await new Promise((resolve) => probe.listen(0, "127.0.0.1", resolve));
const port = probe.address().port;
await new Promise((resolve) => probe.close(resolve));
const child = spawn(process.execPath, ["apps/core-api/dist/server.js"], {
  env: { ...process.env, PORT: String(port), NODE_ENV: "development" },
  stdio: ["ignore", "pipe", "pipe"],
});
let output = "";
child.stdout.on("data", (value) => {
  output += value;
});
child.stderr.on("data", (value) => {
  output += value;
});
try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt++) {
    if (child.exitCode !== null)
      throw new Error(`Built server exited: ${output}`);
    try {
      const result = await fetch(`http://127.0.0.1:${port}/api/health`);
      assert.equal(result.status, 200);
      assert.deepEqual(await result.json(), { status: "ok" });
      ready = true;
      break;
    } catch {
      await setTimeout(100);
    }
  }
  assert.ok(ready, "Built server did not become healthy.");
  console.log("Built API starts and serves health successfully.");
} finally {
  if (child.exitCode === null && child.signalCode === null) {
    const stopped = new Promise((resolve) => child.once("exit", resolve));
    child.kill("SIGTERM");
    assert.equal(await stopped, 0, "Built server must shut down cleanly.");
  }
}
