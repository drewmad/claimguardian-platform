# E2E Authentication Tests

## Overview

These Playwright tests prevent authentication regression issues, specifically the "flash/bounce" behavior that was fixed in commit 1b1f57b.

## Test Coverage

### Core Authentication Flow
- ✅ Unauthenticated users cannot access protected routes
- ✅ Sign-in form loads without flashing/loading overlays
- ✅ Successful authentication redirects to dashboard
- ✅ Sessions persist across page refreshes and new tabs
- ✅ Protected AI tools require authentication

### Security & Access Control
- ✅ Middleware correctly excludes auth routes (no redirect loops)
- ✅ Admin routes require proper authorization
- ✅ Logout completely clears session state

### Error Handling
- ✅ Invalid credentials show appropriate error messages
- ✅ Network errors during auth are handled gracefully

### Performance
- ✅ Auth flows complete within acceptable time limits
- ✅ No redirect loops or excessive loading times

## Running Tests

### Prerequisites
```bash
# Install Playwright browsers
pnpm run install:playwright
```

### Local Development
```bash
# Run all e2e tests
pnpm test:e2e

# Run tests with UI (interactive mode)
pnpm test:e2e:ui

# Run tests with browser visible
pnpm test:e2e:headed

# Debug mode (step-by-step)
pnpm test:e2e:debug
```

### CI/CD Integration
Tests automatically run in GitHub Actions on:
- Pull requests to main
- Pushes to main
- Scheduled weekly runs

## Configuration

### Environment Variables
- `BASE_URL`: Target URL for tests (default: http://localhost:3000)
- `NODE_ENV`: Set to 'test' for full test user setup
- `CI`: Enables CI-specific settings (retries, parallel execution)

### Browser Coverage
Tests run on:
- ✅ Desktop Chrome (Chromium)
- ✅ Desktop Firefox
- ✅ Desktop Safari (WebKit)
- ✅ Mobile Chrome (Pixel 5)
- ✅ Mobile Safari (iPhone 12)

## Test Strategy

### 1. Flash Prevention
- Verify protected content never flashes before redirect
- Ensure loading states are appropriate and brief
- Check that auth forms load cleanly without overlays

### 2. Session Management
- Test session persistence across refreshes
- Verify cross-tab session sharing
- Ensure complete session cleanup on logout

### 3. Security Validation
- Confirm middleware blocks unauthenticated access
- Verify admin routes require proper roles
- Test API endpoints respect authentication

### 4. User Experience
- Measure auth flow completion times
- Ensure error messages are user-friendly
- Verify mobile responsiveness

## Troubleshooting

### Common Issues

**Tests timing out:**
- Check that dev server is running (`pnpm dev`)
- Increase timeout in `playwright.config.ts`
- Verify network connectivity

**Auth flow failures:**
- Ensure test environment has proper Supabase configuration
- Check that test users exist in database
- Verify auth service is responding

**Flaky tests:**
- Review retry configuration
- Add explicit waits for async operations
- Check for race conditions in auth state

### Debug Commands
```bash
# Run specific test file
pnpm test:e2e tests/e2e/auth.spec.ts

# Run with debug output
pnpm test:e2e --debug

# Generate test report
pnpm test:e2e --reporter=html
```

## Test Data

### Mock Users
The tests use predefined mock users:
- `test-auth-e2e@example.com` - Standard user account
- Admin users require separate test database setup

### Test Environment
- Uses isolated test database (when `NODE_ENV=test`)
- Automatic cleanup after test completion
- No impact on production data

## Maintenance

### Adding New Tests
1. Create test functions in `auth.spec.ts`
2. Follow existing naming conventions
3. Add appropriate assertions and timeouts
4. Update this README with new test coverage

### Updating Configuration
- Modify `playwright.config.ts` for global settings
- Update `global-setup.ts` for test environment preparation
- Adjust timeouts and retries as needed

### CI/CD Updates
Tests integrate with existing GitHub Actions workflow:
```yaml
- name: Run E2E tests
  run: pnpm test:e2e
```

## Related Files
- `playwright.config.ts` - Main Playwright configuration
- `tests/e2e/global-setup.ts` - Test environment setup
- `tests/e2e/global-teardown.ts` - Test cleanup
- `.github/workflows/` - CI/CD integration
- `apps/web/src/middleware.ts` - Auth middleware being tested