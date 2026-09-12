// Creates the first ADMIN account so there's someone who can sign in and
// invite everyone else — there is no self-serve sign-up by design
// (invite-only, docs/03), so a first admin has to be created out of band
// somehow. Safe to re-run: no-ops if the account already exists.
//
//   BOOTSTRAP_ADMIN_EMAIL=you@example.com \
//   BOOTSTRAP_ADMIN_PASSWORD='a long passphrase' \
//   BOOTSTRAP_ADMIN_NAME='Your Name' \
//   npm run db:bootstrap-admin
//
// No defaults on purpose: a known default password on a production
// database is an open door. Change the password after first sign-in via
// /staff/profile regardless.
const { PrismaClient } = require("@prisma/client");
const argon2 = require("argon2");

const MIN_PASSWORD_LENGTH = 12;

const EMAIL = (process.env.BOOTSTRAP_ADMIN_EMAIL || "").trim().toLowerCase();
const PASSWORD = process.env.BOOTSTRAP_ADMIN_PASSWORD || "";
const DISPLAY_NAME = (process.env.BOOTSTRAP_ADMIN_NAME || "").trim();

function usage(message) {
  console.error(`Error: ${message}`);
  console.error("Set BOOTSTRAP_ADMIN_EMAIL, BOOTSTRAP_ADMIN_PASSWORD and BOOTSTRAP_ADMIN_NAME, then re-run.");
  process.exit(2);
}

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(EMAIL)) usage("BOOTSTRAP_ADMIN_EMAIL must be a valid email address");
if (PASSWORD.length < MIN_PASSWORD_LENGTH) usage(`BOOTSTRAP_ADMIN_PASSWORD must be at least ${MIN_PASSWORD_LENGTH} characters`);
if (!DISPLAY_NAME) usage("BOOTSTRAP_ADMIN_NAME is required");

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (existing) {
    console.log(`Account already exists: ${EMAIL} (nothing to do).`);
    return;
  }

  const passwordHash = await argon2.hash(PASSWORD);
  await prisma.user.create({
    data: { email: EMAIL, passwordHash, displayName: DISPLAY_NAME, role: "ADMIN", passwordSetAt: new Date() },
  });

  console.log(`Created the first admin account: ${EMAIL}`);
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
