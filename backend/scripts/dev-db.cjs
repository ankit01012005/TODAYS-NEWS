// Persistent local PostgreSQL for day-to-day development — no native
// install or admin rights required. Not a production database strategy;
// see README.md's "Local database" section for the native-install/Docker
// alternatives. Data lives in .devdb-data/ (git-ignored) and survives
// between `db:start`/`db:stop` calls, unlike the ephemeral, --no-save
// embedded-postgres instances used for one-off phase verification.
const path = require("path");
const EmbeddedPostgres = require("embedded-postgres").default;

const DATA_DIR = path.join(__dirname, "..", ".devdb-data");
const PORT = 5432;
const USER = "postgres";
const PASSWORD = "postgres";
const DATABASE = "today_news";

const pg = new EmbeddedPostgres({
  databaseDir: DATA_DIR,
  user: USER,
  password: PASSWORD,
  port: PORT,
  persistent: true,
});

async function start() {
  const fs = require("fs");
  const isFirstRun = !fs.existsSync(path.join(DATA_DIR, "PG_VERSION"));
  if (isFirstRun) {
    await pg.initialise();
  }
  await pg.start();
  if (isFirstRun) {
    await pg.createDatabase(DATABASE);
  }
  console.log(`Postgres is up on port ${PORT}, database "${DATABASE}".`);
  console.log(`DATABASE_URL="postgresql://${USER}:${PASSWORD}@localhost:${PORT}/${DATABASE}?schema=public"`);
}

async function stop() {
  await pg.stop();
  console.log("Postgres stopped.");
}

const command = process.argv[2];
const run = command === "stop" ? stop : start;

run().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
