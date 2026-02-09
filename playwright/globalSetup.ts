import * as dotenv from "dotenv";

async function globalSetup() {
  dotenv.config();
  console.log("🎭 Playwright E2E Tests - VMS Front");
  console.log("Base URL:", process.env.VMS_BASE_URL || "http://localhost:3000");
  console.log("Running tests...");
}

export default globalSetup;
