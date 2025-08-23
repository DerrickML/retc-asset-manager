# Authentication Test Suite

This comprehensive test suite helps identify and diagnose authentication issues in the RETC Asset Manager application.

## Test Files

### 1. `login.test.js` - Login Page Component Tests
Tests the login page UI component including:
- Form rendering and validation
- Credential submission
- Loading states
- Error handling
- Session establishment verification
- Redirect mechanisms

### 2. `auth-integration.test.js` - Integration Tests
Tests the complete authentication flow including:
- Middleware protection for routes
- Session management and caching
- User and staff data retrieval
- Race condition prevention
- Session monitoring
- Error recovery

### 3. `auth-e2e.test.js` - End-to-End Tests
Simulates real-world authentication scenarios:
- Timing issues in login flow
- Session cookie problems
- Race conditions
- Browser-specific issues
- Storage synchronization
- Redirect loops

### 4. `auth-diagnostic.test.js` - Diagnostic Tests
Provides detailed diagnostics for authentication issues:
- Cookie configuration checks
- Timing verification
- Storage availability
- Redirect flow analysis
- API integration checks
- Generates recommendations

## Running the Tests

### Run All Authentication Tests
```bash
npm run test:auth
```

### Run Specific Test Suites

#### Login Component Tests
```bash
npm run test:auth:login
```

#### Integration Tests
```bash
npm run test:auth:integration
```

#### End-to-End Tests
```bash
npm run test:auth:e2e
```

#### Diagnostic Tests (Most Important for Debugging)
```bash
npm run test:auth:diagnostic
```

## Test Credentials

The tests use the following credentials:
- Email: `derrickmal123@gmail.com`
- Password: `derrickloma`

## Interpreting Diagnostic Results

When you run the diagnostic tests, you'll see a summary with:

- **✅ PASSED CHECKS**: Things working correctly
- **❌ FAILED CHECKS**: Issues that need fixing
- **⚠️ WARNINGS**: Potential problems to investigate
- **💡 RECOMMENDATIONS**: Suggested fixes

## Common Issues and Solutions

### Issue: Users Stay on Login Page After Submitting Credentials

**Diagnostic Command:**
```bash
npm run test:auth:diagnostic
```

**Look for these failures:**
1. "Session verification delay too short" - The fix added a 200ms delay
2. "Cookie path is not set to root" - Cookies might not be accessible
3. "LocalStorage not available" - Browser storage might be blocked

### Issue: Redirect Loops Between Login and Dashboard

**Check with:**
```bash
npm run test:auth:e2e
```

**Common causes:**
1. Middleware and client-side auth state mismatch
2. Session cookies not properly set
3. Incorrect redirect logic

### Issue: Session Lost After Login

**Test with:**
```bash
npm run test:auth:integration
```

**Possible reasons:**
1. Cookies blocked by browser
2. localStorage cleared
3. Session expiry too short

## Testing in Development

1. **Start the application:**
```bash
npm run dev
```

2. **In another terminal, run diagnostics:**
```bash
npm run test:auth:diagnostic
```

3. **Test actual login flow:**
- Open http://localhost:3000/login
- Open DevTools (F12)
- Go to Application/Storage tab
- Clear all site data
- Try logging in with test credentials
- Check:
  - Network tab for API calls
  - Application tab for cookies/localStorage
  - Console for errors

## Manual Testing Checklist

When the automated tests pass but issues persist:

1. **Browser Console Checks:**
   - [ ] No JavaScript errors in console
   - [ ] Network requests complete successfully
   - [ ] No CORS errors

2. **Storage Inspection:**
   - [ ] Check for `a_session` cookies
   - [ ] Verify localStorage has `auth_user`
   - [ ] Check session expiry times

3. **Network Analysis:**
   - [ ] Login API returns session
   - [ ] Session verification succeeds
   - [ ] Redirect happens after session established

4. **Timing Verification:**
   - [ ] Login takes < 2 seconds
   - [ ] Session verified before redirect
   - [ ] No rapid repeated API calls

## Debugging Tips

1. **Enable verbose logging:**
   Add console.log statements in:
   - `/app/login/page.js` - handleSubmit function
   - `/lib/utils/auth.js` - login and verifySession functions
   - `/middleware.js` - middleware function

2. **Check browser settings:**
   - Cookies enabled
   - JavaScript enabled
   - Not in private/incognito mode
   - No aggressive ad blockers

3. **Test in different browsers:**
   - Chrome/Edge
   - Firefox
   - Safari (stricter cookie policies)

4. **Monitor with tools:**
   - Chrome DevTools
   - React Developer Tools
   - Network traffic analyzer

## Recent Fixes Applied

The authentication system was recently updated to address race conditions:

1. **Added session verification** before redirect (200ms delay)
2. **Implemented proper timing** in login flow
3. **Added session verification functions** to ensure establishment

These fixes are tested in the test suite to ensure they work correctly.

## Need Help?

If tests are passing but issues persist:

1. Run the diagnostic suite for detailed analysis
2. Check the browser console for client-side errors
3. Verify the Appwrite backend is accessible
4. Ensure environment variables are correctly set
5. Check for browser-specific issues (cookies, storage)