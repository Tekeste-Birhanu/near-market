import { defineConfig, env } from "prisma/config";
import { loadProjectEnv } from "./src/load-env.ts";

loadProjectEnv();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: env("DATABASE_URL") },
});
