/**
 * End-to-end authentication tests
 * Tests the complete auth flow to prevent flash/bounce regressions
 */
import { test, expect } from '@playwright/test';

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TEST_EMAIL = 'test-auth-e2e@example.com';
const TEST_PASSWORD = 'TestPassword123!';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();
    await page.goto(BASE_URL);
  });

  test('unauthenticated flow gates dashboard and allows signin', async ({ page }) => {
    // 1. Verify unauthenticated user cannot access dashboard
    await page.goto(`${BASE_URL}/dashboard`);
    
    // Should redirect to landing page or show signin
    await page.waitForURL(/\/(auth\/signin|$)/);
    
    // Verify no flash content from dashboard
    await expect(page.locator('[data-testid="dashboard-content"]')).not.toBeVisible();
    
    // 2. Navigate to sign-in page
    await page.goto(`${BASE_URL}/auth/signin`);
    
    // Verify sign-in form is visible without flashing
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Verify no loading overlay on initial load
    await expect(page.locator('[data-testid="auth-loading"]')).not.toBeVisible();
    
    console.log('✅ Unauthenticated flow properly gates dashboard access');
  });

  test('successful login lands on dashboard and session persists', async ({ page }) => {
    // 1. Navigate to sign-in page
    await page.goto(`${BASE_URL}/auth/signin`);
    
    // Wait for form to be fully loaded
    await expect(page.locator('input[type="email"]')).toBeVisible();
    
    // 2. Fill in credentials (using test account or mock)
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    
    // 3. Submit form and check for loading state
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeEnabled();
    
    // Click submit and wait for navigation
    await Promise.all([
      page.waitForURL(/\/dashboard/, { timeout: 10000 }),
      submitButton.click()
    ]);
    
    // 4. Verify successful landing on dashboard
    await expect(page).toHaveURL(/\/dashboard/);
    
    // Verify dashboard content loads without flash
    await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible({ timeout: 5000 });
    
    // 5. Test session persistence across page refresh
    await page.reload();
    
    // Should remain on dashboard without redirect
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
    
    // 6. Test session persistence across browser tab
    const newPage = await page.context().newPage();
    await newPage.goto(`${BASE_URL}/dashboard`);
    
    // Should access dashboard directly without auth redirect
    await expect(newPage).toHaveURL(/\/dashboard/);
    await expect(newPage.locator('[data-testid="dashboard-content"]')).toBeVisible();
    
    await newPage.close();
    
    console.log('✅ Authentication persists across refresh and new tabs');
  });

  test('protected AI tools require authentication', async ({ page }) => {
    const aiRoutes = [
      '/ai-tools/damage-analyzer',
      '/ai-tools/policy-advisor', 
      '/ai-tools/inventory-scanner'
    ];

    for (const route of aiRoutes) {
      await page.goto(`${BASE_URL}${route}`);
      
      // Should redirect to auth or landing, not show AI tool content
      await page.waitForURL(/\/(auth\/signin|$)/);
      
      // Verify no flash of AI tool content
      await expect(page.locator('[data-testid="ai-tool-content"]')).not.toBeVisible();
      
      console.log(`✅ ${route} properly requires authentication`);
    }
  });

  test('logout clears session completely', async ({ page }) => {
    // First, sign in (reuse signin flow)
    await page.goto(`${BASE_URL}/auth/signin`);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL(/\/dashboard/);
    
    // Find and click logout button
    const logoutButton = page.locator('button').filter({ hasText: /sign out|logout/i }).first();
    await logoutButton.click();
    
    // Should redirect to landing page
    await page.waitForURL(/\/(auth\/signin|$)/);
    
    // Attempt to access dashboard again - should be blocked
    await page.goto(`${BASE_URL}/dashboard`);
    await page.waitForURL(/\/(auth\/signin|$)/);
    
    // Verify dashboard content is not accessible
    await expect(page.locator('[data-testid="dashboard-content"]')).not.toBeVisible();
    
    console.log('✅ Logout completely clears authentication session');
  });

  test('middleware correctly handles auth routes without loops', async ({ page }) => {
    // Test auth routes are accessible without redirect loops
    const authRoutes = ['/auth/signin', '/auth/signup', '/auth/verify'];
    
    for (const route of authRoutes) {
      const startTime = Date.now();
      await page.goto(`${BASE_URL}${route}`);
      const loadTime = Date.now() - startTime;
      
      // Should load quickly without redirect loops
      expect(loadTime).toBeLessThan(3000); // 3 second max
      
      // Verify we're on the intended route
      await expect(page).toHaveURL(route);
      
      console.log(`✅ ${route} loads without redirect loops (${loadTime}ms)`);
    }
  });

  test('admin routes require proper authorization', async ({ page }) => {
    // Test admin routes are properly protected
    const adminRoutes = ['/admin', '/admin/users', '/admin/analytics'];
    
    for (const route of adminRoutes) {
      await page.goto(`${BASE_URL}${route}`);
      
      // Should redirect to auth or show 403, not admin content
      const url = page.url();
      const hasAuthRedirect = url.includes('/auth/') || url === BASE_URL + '/';
      const is403 = await page.locator('text="403"').isVisible().catch(() => false);
      
      expect(hasAuthRedirect || is403).toBeTruthy();
      
      // Verify no flash of admin content
      await expect(page.locator('[data-testid="admin-content"]')).not.toBeVisible();
      
      console.log(`✅ ${route} properly requires admin authorization`);
    }
  });
});

test.describe('Error Handling', () => {
  test('handles invalid credentials gracefully', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/signin`);
    
    // Enter invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Should show error message, not redirect
    await expect(page.locator('text=/invalid|error|incorrect/i')).toBeVisible({ timeout: 5000 });
    
    // Should remain on signin page
    await expect(page).toHaveURL(/\/auth\/signin/);
    
    console.log('✅ Invalid credentials handled gracefully');
  });

  test('handles network errors during auth', async ({ page }) => {
    // Intercept auth requests and simulate network error
    await page.route('**/auth/**', route => route.abort());
    
    await page.goto(`${BASE_URL}/auth/signin`);
    await page.fill('input[type="email"]', TEST_EMAIL);
    await page.fill('input[type="password"]', TEST_PASSWORD);
    
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Should show network error, not crash or redirect
    await expect(page.locator('text=/error|failed|network/i')).toBeVisible({ timeout: 5000 });
    
    console.log('✅ Network errors during auth handled gracefully');
  });
});

test.describe('Performance', () => {
  test('auth flows complete within acceptable time limits', async ({ page }) => {
    // Test signin page load time
    const startTime = Date.now();
    await page.goto(`${BASE_URL}/auth/signin`);
    await expect(page.locator('input[type="email"]')).toBeVisible();
    const signinLoadTime = Date.now() - startTime;
    
    expect(signinLoadTime).toBeLessThan(2000); // 2 seconds max
    
    // Test dashboard redirect time (for authenticated users)
    // This would require a pre-authenticated session
    
    console.log(`✅ Signin page loads in ${signinLoadTime}ms`);
  });
});