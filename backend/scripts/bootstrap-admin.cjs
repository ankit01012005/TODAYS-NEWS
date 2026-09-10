// Creates the first ADMIN account so there's someone who can sign in and
// invite everyone else — there is no self-serve sign-up by design
// (invite-only, docs/03), so a first admin has to be created out of band
// somehow. Safe to re-run: no-ops if the account already exists. Change
// the password immediately after first sign-in via /staff/profile.
const { PrismaClient } = require("@prisma/client");
const argon2 = require("argon2");

const EMAIL = process.env.BOOTSTRAP_ADMIN_EMAIL || "admin@today-news.local";
const PASSWORD = process.env.BOOTSTRAP_ADMIN_PASSWORD || "ChangeMe123!";
const DISPLAY_NAME = process.env.BOOTSTRAP_ADMIN_NAME || "Admin";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (existing) {
    console.log(`Admin account already exists: ${EMAIL} (nothing to do).`);
    return;
  }

  const passwordHash = await argon2.hash(PASSWORD);
  await prisma.user.create({
    data: { email: EMAIL, passwordHash, displayName: DISPLAY_NAME, role: "ADMIN" },
  });

  console.log("Created first admin account:");
  console.log(`  Email:    ${EMAIL}`);
  console.log(`  Password: ${PASSWORD}`);
  console.log("Sign in at /staff/sign-in, then change the password at /staff/profile.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
