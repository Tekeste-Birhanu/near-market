import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const projectEnvFile = fileURLToPath(new URL("../../.env", import.meta.url));

export function loadProjectEnv(): void {
  if (existsSync(projectEnvFile)) {
    process.loadEnvFile(projectEnvFile);
  }
}
