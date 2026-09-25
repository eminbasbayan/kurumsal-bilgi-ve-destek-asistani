import { createApp } from "./app.js";
import { DEFAULT_CORS_ORIGIN } from "./config/constants.js";
import { defaultDatabasePath, migrateAndSeed, openDatabase } from "./db/database.js";

const databasePath = process.env.DATABASE_PATH ?? defaultDatabasePath;
const parsedPort = Number(process.env.PORT ?? 3001);
const port = Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : 3001;

const corsOrigin = process.env.CORS_ORIGIN?.trim() || DEFAULT_CORS_ORIGIN;
const db = openDatabase(databasePath);
migrateAndSeed(db);

createApp(db, () => new Date(), corsOrigin).listen(port, () => {
  console.log(`API http://localhost:${port}`);
  console.log(`Swagger http://localhost:${port}/api-docs`);
});
