import { spawnSync } from "node:child_process";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const fixtureDirectory = path.join(process.cwd(), "apps", "web", "app", "server-only-build-probe");
const fixtureFile = path.join(fixtureDirectory, "page.tsx");
const probeBuildDirectory = path.join(process.cwd(), "apps", "web", ".next-server-only-probe");
const pnpmCli = process.env.npm_execpath;

if (!pnpmCli) {
  console.error("Run this check through pnpm test:server-only.");
  process.exit(1);
}

function removeProbePath(target) {
  rmSync(target, {
    recursive: true,
    force: true,
    maxRetries: 10,
    retryDelay: 150
  });
}

removeProbePath(probeBuildDirectory);
mkdirSync(fixtureDirectory, { recursive: true });
function writeProbe(importLine, expression) {
  writeFileSync(
    fixtureFile,
    [
      '"use client";',
      importLine,
      "export default function ServerOnlyBuildProbe() {",
      `  return <div>{typeof ${expression}}</div>;`,
      "}",
      ""
    ].join("\n"),
    "utf8"
  );
}

try {
  for (const probe of [
    {
      importLine: 'import { createServiceClient } from "@closeoutflow/db/server";',
      expression: "createServiceClient",
      label: "@closeoutflow/db/server"
    },
    {
      importLine: 'import { createServerAuthClient } from "@closeoutflow/auth/server";',
      expression: "createServerAuthClient",
      label: "@closeoutflow/auth/server"
    }
  ]) {
    writeProbe(probe.importLine, probe.expression);
    const result = spawnSync(
      process.execPath,
      [pnpmCli, "--filter", "@closeoutflow/web", "build"],
      {
        encoding: "utf8",
        env: { ...process.env, NEXT_DIST_DIR: ".next-server-only-probe" }
      }
    );
    const output = (result.stdout || "") + (result.stderr || "");

    if (result.status === 0) {
      console.error(`Client import of ${probe.label} unexpectedly built successfully.`);
      process.exitCode = 1;
    } else if (!output.includes("server-only")) {
      console.error(output);
      console.error(
        `The ${probe.label} probe failed, but not because of the server-only boundary.`
      );
      process.exitCode = 1;
    } else {
      console.log(`Client import of ${probe.label} failed the Next.js build as required.`);
    }
  }
} finally {
  for (const target of [fixtureDirectory, probeBuildDirectory]) {
    try {
      removeProbePath(target);
    } catch (error) {
      console.error(`Unable to clean server-only probe path ${target}:`, error);
      process.exitCode = 1;
    }
  }
}
