import { createApp } from "./app.js";
import { DEFAULT_CORS_ORIGIN } from "./config/constants.js";
import { defaultDatabasePath, migrateAndSeed, openDatabase } from "./db/database.js";

const databasePath = process.env.DATABASE_PATH ?? defaultDatabasePath;
const parsedPort = Number(process.env.PORT ?? 3001);
const port = Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : 3001;

const corsOrigin = process.env.CORS_ORIGIN?.trim() || DEFAULT_CORS_ORIGIN;
const host = process.env.HOST?.trim() || "0.0.0.0";
const db = openDatabase(databasePath);
migrateAndSeed(db);

createApp(db, () => new Date(), corsOrigin).listen(port, host, () => {
  console.log(`API http://${host}:${port}`);
  console.log(`Swagger http://${host}:${port}/api-docs`);
});
