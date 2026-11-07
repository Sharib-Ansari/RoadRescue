import dotenv from 'dotenv';
dotenv.config();

import jwt from 'jsonwebtoken';

const BASE_URL = 'http://localhost:5000';

// Helper to extract cookie from response headers
const getCookie = (res) => {
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) return null;
  const match = setCookie.match(/token=([^;]+)/);
  return match ? `token=${match[1]}` : null;
};

// Unique timestamp for test runs
const timestamp = Date.now();
const customerEmail = `customer_${timestamp}@test.com`;
const mechanicEmail = `mechanic_${timestamp}@test.com`;
const testPassword = 'Password@123';

const results = [];

const runTest = async (testNumber, name, fn) => {
  try {
    const res = await fn();
    results.push({ testNumber, name, passed: true, details: res });
    console.log(`✅ [TEST ${testNumber}] ${name}: PASSED`);
  } catch (err) {
    results.push({ testNumber, name, passed: false, error: err.message });
    console.error(`❌ [TEST ${testNumber}] ${name}: FAILED - ${err.message}`);
  }
};

async function main() {
  console.log('========================================================');
  console.log('   ROADRESCUE BACKEND PHASE 2 - AUTH TEST SUITE');
  console.log('========================================================\n');

  // Safety Guard: Require dedicated test database
  if (!process.env.MONGODB_TEST_URI) {
    console.error('❌ MONGODB_TEST_URI environment variable is required to run test suite.');
    console.error('Aborting tests to prevent accidental mutation of the primary database.');
    process.exit(1);
  }

  let customerCookie = null;
  let mechanicCookie = null;

  // TEST 1: Register Customer
  await runTest(1, 'Register a customer', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Test Customer',
        email: customerEmail,
        phone: '9876543210',
        password: testPassword,
        role: 'customer'
      })
    });
    const data = await res.json();
    if (res.status !== 201) throw new Error(`Expected status 201, got ${res.status}: ${JSON.stringify(data)}`);
    if (!data.success) throw new Error('Response success flag is false');
    if (data.user.role !== 'customer') throw new Error(`Expected role customer, got ${data.user.role}`);
    if (data.user.passwordHash) throw new Error('passwordHash leaked in response!');
    customerCookie = getCookie(res);
    if (!customerCookie) throw new Error('No auth cookie received');
    return `Customer ID: ${data.user.id}, Cookie set`;
  });

  // TEST 2: Register Mechanic
  await runTest(2, 'Register a mechanic', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Test Mechanic',
        email: mechanicEmail,
        phone: '9876543211',
        password: testPassword,
        role: 'mechanic',
        workshopName: 'RoadRescue Speed Garage',
        experienceYears: 5,
        serviceArea: 'Mumbai South',
        servicesOffered: ['Engine Repair', 'Tyre Service', 'Battery Jumpstart']
      })
    });
    const data = await res.json();
    if (res.status !== 201) throw new Error(`Expected status 201, got ${res.status}: ${JSON.stringify(data)}`);
    if (!data.success) throw new Error('Response success flag is false');
    if (data.user.role !== 'mechanic') throw new Error(`Expected role mechanic, got ${data.user.role}`);
    if (!data.user.mechanicProfile) throw new Error('Mechanic profile missing in response');
    mechanicCookie = getCookie(res);
    if (!mechanicCookie) throw new Error('No auth cookie received');
    return `Mechanic ID: ${data.user.id}, Workshop: ${data.user.mechanicProfile.workshopName}`;
  });

  // TEST 3: Duplicate Email Registration
  await runTest(3, 'Attempt duplicate email registration', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: 'Duplicate User',
        email: customerEmail,
        password: testPassword,
        role: 'customer'
      })
    });
    const data = await res.json();
    if (res.status !== 409) throw new Error(`Expected status 409 Conflict, got ${res.status}`);
    return `Correctly rejected duplicate with 409: "${data.message}"`;
  });

  // TEST 4: Login as Customer
  await runTest(4, 'Login as a customer', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: customerEmail,
        password: testPassword
      })
    });
    const data = await res.json();
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}: ${JSON.stringify(data)}`);
    if (!data.success) throw new Error('Response success flag is false');
    if (data.user.role !== 'customer') throw new Error(`Expected role customer, got ${data.user.role}`);
    customerCookie = getCookie(res);
    if (!customerCookie) throw new Error('No auth cookie received');
    return `Logged in customer: ${data.user.name}`;
  });

  // TEST 5: Login as Mechanic
  await runTest(5, 'Login as a mechanic', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: mechanicEmail,
        password: testPassword
      })
    });
    const data = await res.json();
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}: ${JSON.stringify(data)}`);
    if (!data.success) throw new Error('Response success flag is false');
    if (data.user.role !== 'mechanic') throw new Error(`Expected role mechanic, got ${data.user.role}`);
    mechanicCookie = getCookie(res);
    if (!mechanicCookie) throw new Error('No auth cookie received');
    return `Logged in mechanic: ${data.user.name}`;
  });

  // TEST 6: Incorrect Password
  await runTest(6, 'Attempt incorrect password', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: customerEmail,
        password: 'WrongPassword123'
      })
    });
    const data = await res.json();
    if (res.status !== 401) throw new Error(`Expected status 401, got ${res.status}`);
    if (data.message !== 'Invalid email or password') throw new Error(`Unexpected message: ${data.message}`);
    return `Correctly rejected invalid password with 401 generic error`;
  });

  // TEST 7: Access /api/auth/me with valid cookie
  await runTest(7, 'Access /api/auth/me with a valid cookie', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Cookie': customerCookie
      }
    });
    const data = await res.json();
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    if (!data.success || !data.user) throw new Error('User profile missing');
    if (data.user.email !== customerEmail) throw new Error('User email mismatch');
    return `Authenticated as: ${data.user.name} (${data.user.role})`;
  });

  // TEST 8: Access /api/auth/me without cookie
  await runTest(8, 'Access /api/auth/me without a cookie', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      method: 'GET'
    });
    const data = await res.json();
    if (res.status !== 401) throw new Error(`Expected status 401, got ${res.status}`);
    return `Rejected unauthenticated request with 401: "${data.message}"`;
  });

  // TEST 9: Logout
  let clearedSetCookie = null;
  await runTest(9, 'Logout and verify cookie clearance', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Cookie': customerCookie
      }
    });
    const data = await res.json();
    if (res.status !== 200) throw new Error(`Expected status 200, got ${res.status}`);
    clearedSetCookie = res.headers.get('set-cookie');
    if (!clearedSetCookie || !clearedSetCookie.includes('token=')) {
      throw new Error('Logout did not issue Set-Cookie header to clear token');
    }
    return `Logged out successfully, cleared cookie: ${clearedSetCookie.split(';')[0]}`;
  });

  // TEST 10: Attempt to reuse logged-out cookie
  await runTest(10, 'Attempt to reuse logged-out / cleared cookie', async () => {
    // The cleared cookie will have empty value or max-age=0
    const res = await fetch(`${BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: {
        'Cookie': 'token='
      }
    });
    const data = await res.json();
    if (res.status !== 401) throw new Error(`Expected status 401, got ${res.status}`);
    return `Subsequent request rejected with 401: "${data.message}"`;
  });

  // Re-login customer for remaining tests
  const reloginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: customerEmail, password: testPassword })
  });
  customerCookie = getCookie(reloginRes);

  // TEST 11: Access mechanic dashboard as a customer
  await runTest(11, 'Access mechanic dashboard as a customer (Forbidden check)', async () => {
    const res = await fetch(`${BASE_URL}/api/mechanic/dashboard`, {
      method: 'GET',
      headers: {
        'Cookie': customerCookie
      }
    });
    const data = await res.json();
    if (res.status !== 403) throw new Error(`Expected status 403 Forbidden, got ${res.status}`);
    return `Correctly blocked customer from mechanic dashboard with 403: "${data.message}"`;
  });

  // TEST 12: Access customer dashboard as a mechanic
  await runTest(12, 'Access customer dashboard as a mechanic (Forbidden check)', async () => {
    const res = await fetch(`${BASE_URL}/api/customer/dashboard`, {
      method: 'GET',
      headers: {
        'Cookie': mechanicCookie
      }
    });
    const data = await res.json();
    if (res.status !== 403) throw new Error(`Expected status 403 Forbidden, got ${res.status}`);
    return `Correctly blocked mechanic from customer dashboard with 403: "${data.message}"`;
  });

  // TEST 13: Test expired and invalid JWT handling
  await runTest(13, 'Test expired and invalid JWT handling', async () => {
    // 13a: Invalid signature
    const invalidRes = await fetch(`${BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: { 'Cookie': 'token=invalid.tampered.token' }
    });
    if (invalidRes.status !== 401) {
      throw new Error(`Expected 401 for invalid token, got ${invalidRes.status}`);
    }

    // 13b: Expired token
    const expiredToken = jwt.sign(
      { sub: 'usr_test_expired', role: 'customer' },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: '0s' }
    );
    // Give 50ms to ensure it's past
    await new Promise((r) => setTimeout(r, 50));

    const expiredRes = await fetch(`${BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers: { 'Cookie': `token=${expiredToken}` }
    });
    const expiredData = await expiredRes.json();
    if (expiredRes.status !== 401) {
      throw new Error(`Expected 401 for expired token, got ${expiredRes.status}`);
    }
    if (!expiredData.message.includes('expired')) {
      throw new Error(`Expected expired message, got: ${expiredData.message}`);
    }

    return `Both invalid token (401) and expired token (401: "${expiredData.message}") verified`;
  });

  // TEST 14: Test login rate limiting
  await runTest(14, 'Test login rate limiting (Brute force protection)', async () => {
    let rateLimited = false;
    let attemptsCount = 0;

    // We already made a few login attempts. Let's make up to 15 quick attempts to trigger limit (max 10)
    for (let i = 0; i < 15; i++) {
      attemptsCount++;
      const res = await fetch(`${BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'nonexistent@test.com',
          password: 'BadPassword'
        })
      });

      if (res.status === 429) {
        rateLimited = true;
        const data = await res.json();
        return `Rate limiter triggered on attempt ${attemptsCount} with HTTP 429: "${data.message}"`;
      }
    }

    if (!rateLimited) {
      throw new Error('Rate limit was not triggered after 15 attempts');
    }
  });

  console.log('\n========================================================');
  console.log(`TEST SUMMARY: ${results.filter(r => r.passed).length} / ${results.length} PASSED`);
  console.log('========================================================\n');

  if (results.every(r => r.passed)) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
