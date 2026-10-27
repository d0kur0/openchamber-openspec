import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, sep } from "node:path";
import test from "node:test";
import { runOpenSpec } from "../service/main.js";

test(
  "Windows npm CLI works without a shell in a path with spaces and metacharacters",
  {
    skip: process.platform !== "win32",
  },
  async () => {
    const root = await mkdtemp(join(tmpdir(), "openspec windows & "));
    try {
      await mkdir(join(root, "openspec"));
      await writeFile(join(root, "openspec", "config.yaml"), "schema: spec-driven\n");
      const created = await runOpenSpec(root, [
        "new",
        "change",
        "windows-smoke",
        "--goal",
        "Русский текст & safe",
      ]);
      assert.equal(created.ok, true, JSON.stringify(created));
      assert.equal(created.value.change.id, "windows-smoke");
      const status = await runOpenSpec(root, ["status", "--change", "windows-smoke"]);
      assert.equal(status.ok, true, JSON.stringify(status));
      assert.equal(status.value.changeName, "windows-smoke");
    } finally {
      assert.ok(resolve(root).startsWith(resolve(tmpdir()) + sep));
      await rm(root, { recursive: true, force: true });
    }
  },
);
