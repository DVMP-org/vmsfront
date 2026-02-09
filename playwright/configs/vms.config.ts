export const vmsConfig = {
  apiBaseURL: process.env.API_BASE_URL || "http://localhost:8000",
  webBaseURL: process.env.VMS_BASE_URL || "http://localhost:3000",

  // Admin credentials
  adminEmail: process.env.ADMIN_E2E_EMAIL || "admin@test.com",
  adminPassword: process.env.ADMIN_E2E_PASSWORD || "TestPassword123!",

  // Resident credentials
  residentEmail: process.env.RESIDENT_E2E_EMAIL || "resident@test.com",
  residentPassword: process.env.RESIDENT_E2E_PASSWORD || "TestPassword123!",

  // House Owner credentials
  houseOwnerEmail: process.env.HOUSE_OWNER_E2E_EMAIL || "houseowner@test.com",
  houseOwnerPassword:
    process.env.HOUSE_OWNER_E2E_PASSWORD || "TestPassword123!",
};
