import { createApp } from "./app.js";
import { defaultDatabasePath, migrateAndSeed, openDatabase } from "./db/database.js";

const databasePath = process.env.DATABASE_PATH ?? defaultDatabasePath;
const parsedPort = Number(process.env.PORT ?? 3001);
const port = Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : 3001;

const db = openDatabase(databasePath);
migrateAndSeed(db);

createApp(db).listen(port, () => {
  console.log(`API http://localhost:${port}`);
  console.log(`Swagger http://localhost:${port}/api-docs`);
});
