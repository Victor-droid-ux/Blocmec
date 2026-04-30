import { PrismaClient, UserRole } from "../generated/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { createClient } from "@supabase/supabase-js";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // service role key required for admin user creation
);

// Passwords are loaded from environment variables — never hardcoded
const DEV_USERS = [
  {
    name: "Test User",
    email: "user@blockmec.org",
    password: process.env.DEV_USER_PASSWORD!,
    role: UserRole.user,
  },
  {
    name: "Admin User",
    email: "info@blockmec.org",
    password: process.env.DEV_ADMIN_PASSWORD!,
    role: UserRole.admin,
  },
  {
    name: "Developer User",
    email: "developer@blockmec.org",
    password: process.env.DEV_DEVELOPER_PASSWORD!,
    role: UserRole.developer,
  },
];

async function seedDevUsers() {
  console.info("🌱 Seeding development users to PostgreSQL...");

  for (const user of DEV_USERS) {
    try {
      if (!user.password) {
        console.warn(
          `⚠️  Skipping ${user.email} — missing password env variable`,
        );
        continue;
      }

      const existing = await prisma.user.findUnique({
        where: { email: user.email },
      });

      if (existing) {
        console.log(`⏭️  User ${user.email} already exists, skipping...`);
        continue;
      }

      // Create the user in Supabase Auth first to get a real supabase_id
      const { data: authData, error: authError } =
        await supabase.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
        });

      if (authError) {
        console.error(
          `❌ Supabase Auth error for ${user.email}:`,
          authError.message,
        );
        continue;
      }

      const supabaseId = authData.user.id;

      await prisma.user.create({
        data: {
          name: user.name,
          email: user.email,
          role: user.role,
          email_verified: true,
          supabase_id: supabaseId,
          api_credits:
            user.role === UserRole.admin
              ? 999999
              : user.role === UserRole.developer
                ? 50000
                : 1000,
        },
      });

      console.log(`✅ Created ${user.role}: ${user.email}`);
    } catch (error) {
      console.error(`❌ Error creating ${user.email}:`, error);
    }
  }

  console.info("✨ Development seeding complete!");
}

seedDevUsers()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
