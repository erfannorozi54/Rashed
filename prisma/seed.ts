import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const phone = process.env.ADMIN_PHONE;
  const password = process.env.ADMIN_PASSWORD;
  const name = process.env.ADMIN_NAME ?? "مدیر";

  if (!phone || !password) {
    console.error("ADMIN_PHONE and ADMIN_PASSWORD must be set in .env");
    process.exit(1);
  }

  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    console.log("Admin user already exists, skipping seed.");
    return;
  }

  const [firstName, ...rest] = name.trim().split(" ");
  const lastName = rest.join(" ") || "";

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.create({
    data: {
      phone,
      name,
      firstName,
      lastName,
      password: passwordHash,
      role: "ADMIN",
    },
  });

  console.log("Admin user created successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
