import * as dotenv from "dotenv";
import { resolve } from "node:path";

async function globalSetup() {
  dotenv.config({ path: resolve(process.cwd(), ".env") });
  dotenv.config({ path: resolve(process.cwd(), "..", ".env.local") });
}

export default globalSetup;
