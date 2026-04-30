import { PrismaClient, UserRole } from "../generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export const seedDevelopment = async () => await runBaseSeeders();
export const seedStaging = async () => await runBaseSeeders();
export const seedProduction = async () => await runBaseSeeders();

const runBaseSeeders = async () => {
  await seedAdmin();
  await seedTestUserRoles();
};

// Helper: get existing Supabase user or create new one
const getOrCreateSupabaseUser = async (email: string, password: string) => {
  // Try to find existing user first
  const { data: list } = await supabase.auth.admin.listUsers();
  const existing = list?.users?.find((u) => u.email === email);
  if (existing) return existing.id;

  // Create if not found
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  return data.user?.id;
};

const seedAdmin = async () => {
  console.info("Seeding root admin...");
  try {
    const supabaseId = await getOrCreateSupabaseUser(
      "info@blockmec.org",
      "Akachukwu1@1",
    );

    await prisma.user.upsert({
      where: { email: "info@blockmec.org" },
      update: { supabase_id: supabaseId },
      create: {
        name: "Akachukwu",
        email: "info@blockmec.org",
        role: "admin",
        supabase_id: supabaseId,
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
      const supabaseId = await getOrCreateSupabaseUser(
        user.email,
        user.password,
      );

      await prisma.user.upsert({
        where: { email: user.email },
        update: { supabase_id: supabaseId },
        create: {
          name: user.name,
          email: user.email,
          role: user.role,
          supabase_id: supabaseId,
          email_verified: true,
        },
      });

      console.info(`✅ Seeded ${user.role}: ${user.email}`);
    } catch (error) {
      console.error(`❌ Error seeding ${user.role}:`, error);
    }
  }
};
