import { PrismaClient, UserRole } from "../generated/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

export const seedDevelopment = async () => await runBaseSeeders();
export const seedStaging = async () => await runBaseSeeders();
export const seedProduction = async () => await runBaseSeeders();

const runBaseSeeders = async () => {
  await seedAdmin();
  await seedTestUserRoles();
  await seedUnlimitedTestAccount();
};

const seedAdmin = async () => {
  console.info("Seeding root admin...");
  try {
    const password_hash = await bcrypt.hash("Akachukwu1@1", 12);

    await prisma.user.upsert({
      where: { email: "info@blockmec.org" },
      update: { username: "info" },
      create: {
        name: "Akachukwu",
        email: "info@blockmec.org",
        username: "info",
        role: "admin",
        password_hash,
        email_verified: true,
      },
    });

    console.info("✅ Root admin seeded.");
  } catch (error) {
    console.error("❌ Error seeding root admin:", error);
    throw new Error("Failed to seed root admin.");
  }
};

const seedTestUserRoles = async () => {
  console.info("Seeding test users...");

  const testUsers = [
    {
      name: "Test Developer",
      email: "developer@blockmec.com",
      password: "developer123!@#",
      role: UserRole.developer,
    },
    {
      name: "Test User",
      email: "user@blockmec.com",
      password: "user123!@#",
      role: UserRole.user,
    },
  ];

  for (const user of testUsers) {
    try {
      const password_hash = await bcrypt.hash(user.password, 12);

      await prisma.user.upsert({
        where: { email: user.email },
        update: { username: user.email.split("@")[0] },
        create: {
          name: user.name,
          email: user.email,
          username: user.email.split("@")[0],
          role: user.role,
          password_hash,
          email_verified: true,
        },
      });

      console.info(`✅ Seeded ${user.role}: ${user.email}`);
    } catch (error) {
      console.error(`❌ Error seeding ${user.role}:`, error);
    }
  }
};

// Dedicated QA account with top-tier plan + effectively unlimited credits so
// testing never hits credit/subscription gates, in both dev and prod.
const seedUnlimitedTestAccount = async () => {
  console.info("Seeding unlimited QA test account...");

  const password = process.env.QA_UNLIMITED_TEST_PASSWORD;
  if (!password) {
    console.warn(
      "⚠️  QA_UNLIMITED_TEST_PASSWORD not set — skipping unlimited test account seed.",
    );
    return;
  }

  const email = "qa@blockmec.com";

  try {
    const password_hash = await bcrypt.hash(password, 12);

    await prisma.user.upsert({
      where: { email },
      update: {
        username: "qa",
        subscription_plan: "enterprise",
        api_credits: 999_999_999,
        status: "active",
        email_verified: true,
      },
      create: {
        name: "QA Unlimited",
        email,
        username: "qa",
        role: UserRole.user,
        subscription_plan: "enterprise",
        api_credits: 999_999_999,
        password_hash,
        email_verified: true,
      },
    });

    console.info(`✅ Seeded unlimited QA account: ${email}`);
  } catch (error) {
    console.error("❌ Error seeding unlimited QA account:", error);
  }
};
