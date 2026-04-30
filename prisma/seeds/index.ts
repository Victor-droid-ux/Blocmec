import "dotenv/config";
import { parseArgs } from "node:util";
import { seedDevelopment, seedStaging, seedProduction } from "./seeders";
import { PrismaClient } from "../generated/client";
import { PrismaPg } from "@prisma/adapter-pg";

enum Environment {
  DEVELOPMENT = "development",
  STAGING = "staging",
  PRODUCTION = "production",
}

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const options = {
  environment: { type: "string" as const },
};

async function main() {
  const {
    values: { environment },
  } = parseArgs({ options });

  const env = !environment
    ? Environment.DEVELOPMENT
    : (environment.toLowerCase() as Environment);

  console.info(`Starting seeding for environment: ${env}`);

  switch (env) {
    case Environment.DEVELOPMENT:
      await seedDevelopment();
      break;
    case Environment.STAGING:
      await seedStaging();
      break;
    case Environment.PRODUCTION:
      await seedProduction();
      break;
    default:
      console.error(`Unknown environment: ${environment}`);
      console.error(
        `Please specify one of the following environments: ${Object.values(
          Environment,
        ).join(", ")}`,
      );
      console.info("Failed to run seeder.");
      throw new Error(
        `Unknown environment: ${environment}. Please specify one of the following environments: ${Object.values(
          Environment,
        ).join(", ")}`,
      );
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
