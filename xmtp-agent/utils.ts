import { config } from "dotenv";
import { existsSync } from "fs";

export function loadEnvFile() {
  // Try to load .env file using dotenv
  if (existsSync(".env")) {
    config({ path: ".env" });
  } else if (existsSync(`../../.env`)) {
    config({ path: `../../.env` });
  }
}
