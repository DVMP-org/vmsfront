# Playwright E2E Tests - VMS Front

This directory contains end-to-end tests for the VMS (Visitor Management System) Front application using Playwright.

## Structure

```
playwright/
├── configs/              # Configuration files
│   └── vms.config.ts    # VMS-specific config with credentials
├── pages/               # Page Object Models (POM)
│   ├── BasePage.ts      # Base page with common methods
│   ├── AuthPage.ts      # Authentication pages
│   ├── AdminBasePage.ts # Admin base functionality
│   ├── ResidentsPage.ts # Residents management
│   ├── HousesPage.ts    # Houses management
│   └── GateEventsPage.ts# Gate events management
├── test-suites/         # Test specifications
│   ├── auth.spec.ts     # Authentication tests
│   ├── residents.spec.ts# Residents CRUD tests
│   ├── houses.spec.ts   # Houses CRUD tests
│   └── gate-events.spec.ts # Gate events tests
├── utils/               # Utility functions
│   ├── test-tag.utils.ts      # Test tagging utilities
│   ├── data-generator.utils.ts # Fake data generation
│   └── selectors.constants.ts  # Selector constants
├── playwright.config.ts # Main Playwright configuration
├── globalSetup.ts      # Global setup (env loading)
├── package.json        # Dependencies and scripts
├── tsconfig.json       # TypeScript configuration
└── .env.example        # Environment variables template
```

## Setup

1. **Install dependencies:**

   ```bash
   cd playwright
   npm install
   ```

2. **Install Playwright browsers:**

   ```bash
   npx playwright install
   ```

3. **Configure environment variables:**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` with your test credentials and URLs:

   ```env
   VMS_BASE_URL=http://localhost:3000
   API_BASE_URL=http://localhost:8000
   ADMIN_E2E_EMAIL=admin@test.com
   ADMIN_E2E_PASSWORD=TestPassword123!
   ```

## Running Tests

### Run all tests

```bash
npm test
```

### Run tests in UI mode (recommended for development)

```bash
npm run test:ui
```

### Run tests in headed mode (see browser)

```bash
npm run test:headed
```

### Run specific test file

```bash
npx playwright test test-suites/auth.spec.ts
```

### Run in debug mode

```bash
npm run test:debug
```

### View test report

```bash
npm run report
```

## Writing Tests

### Page Object Pattern

All tests use the Page Object Model pattern. Each page/feature has its own class:

```typescript
import { ResidentsPage } from "../pages/ResidentsPage";

test("example test", async ({ page }) => {
  const residentsPage = new ResidentsPage(page, page.request);
  await residentsPage.processAdminLogin();
  await residentsPage.openResidentsPage();
  // ... test actions
});
```

### Using Test Data Generator

Generate realistic test data using Faker.js:

```typescript
import { TestDataGenerator } from "../utils/data-generator.utils";

const residentData = TestDataGenerator.generateResidentData();
// {
//   firstName: "John",
//   lastName: "Doe",
//   email: "john.doe@example.com",
//   phone: "0801234567",
//   houseNumber: "H123"
// }
```

### Using Test Tags

Create unique identifiers for test data:

```typescript
import { TestTagStorage } from "../utils/test-tag.utils";

const storage = new TestTagStorage(page);
const tag = await storage.generateOrGetTag();
// Use tag in test data to make it unique and traceable
```

## Best Practices

1. **Use test.step()** for better readability:

   ```typescript
   await test.step("Login as admin", async () => {
     await authPage.login();
   });
   ```

2. **Use selectors from constants** when possible:

   ```typescript
   import { AUTH_SELECTORS } from "../utils/selectors.constants";
   await page.locator(AUTH_SELECTORS.LOGIN_EMAIL_INPUT).fill(email);
   ```

3. **Clean up test data** in afterEach hooks when needed

4. **Use meaningful test descriptions** that explain the expected behavior

5. **Keep tests independent** - each test should be able to run in isolation

## CI/CD Integration

Tests are configured to run in CI with:

- Retries on failure (2 retries in CI)
- Multiple reporters (HTML, GitHub Actions)
- Video recording on failure
- Screenshots on failure

## Debugging

### Using Playwright Inspector

```bash
npm run test:debug
```

### Using VS Code Debugger

Install the Playwright extension and use the built-in debugger

### Viewing traces

Traces are automatically captured on first retry. View them in the HTML report:

```bash
npm run report
```

## Configuration

### Browser Configuration

Tests run on:

- Chromium (Desktop Chrome)
- Firefox (Desktop Firefox)
- WebKit (Desktop Safari)

### Timeouts

- Test timeout: 900s (15 minutes)
- Expect timeout: 60s
- Navigation timeout: 120s
- Action timeout: 60s

## Troubleshooting

### Tests timing out

- Increase timeouts in `playwright.config.ts`
- Check if the app is running and accessible
- Verify network connectivity

### Element not found

- Update selectors in `utils/selectors.constants.ts`
- Use `page.pause()` to debug live
- Check if elements have unique IDs in your app

### Authentication issues

- Verify credentials in `.env`
- Check if the login flow matches your app
- Update `processLogin()` in `BasePage.ts` if needed

## Support

For more information, visit:

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
