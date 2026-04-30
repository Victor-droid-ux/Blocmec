import dotenv from "dotenv";
import { defineConfig, env } from "prisma/config";

// Load environment variables from .env.local first, then .env
dotenv.config({ path: ".env.local" });
dotenv.config();

export default defineConfig({
  schema: "prisma/schema",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seeds/index.ts",
  },
  engine: "classic",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
