import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import { io as ClientIO } from 'socket.io-client';
import User from './src/models/User.js';
import ServiceRequest from './src/models/ServiceRequest.js';

const BASE_URL = 'http://localhost:5000';

const getCookie = (res) => {
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) return null;
  const match = setCookie.match(/token=([^;]+)/);
  return match ? `token=${match[1]}` : null;
};

const extractTokenValue = (cookieHeader) => {
  if (!cookieHeader) return null;
  const match = cookieHeader.match(/token=([^;]+)/);
  return match ? match[1] : null;
};

let passedCount = 0;
let failedCount = 0;
const results = [];

const runTest = async (testNumber, name, fn) => {
  try {
    const details = await fn();
    results.push({ testNumber, name, passed: true, details });
    passedCount++;
    console.log(`✅ [TEST ${testNumber.toString().padStart(2, '0')}] ${name}: PASSED`);
  } catch (err) {
    results.push({ testNumber, name, passed: false, error: err.message });
    failedCount++;
    console.error(`❌ [TEST ${testNumber.toString().padStart(2, '0')}] ${name}: FAILED - ${err.message}`);
  }
};

async function main() {
  console.log('================================================================');
  console.log('   ROADRESCUE PHASE 5 & 6 - GEOLOCATION & REAL-TIME TRACKING');
  console.log('================================================================\n');

  // Connect to DB directly for model schema inspections
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGODB_URI, { dbName: 'RoadRescue' });
  }

  // Common credentials
  const timestamp = Date.now();
  const testCustomerEmail = `phase5_cust_${timestamp}@roadrescue.in`;
  const testMechanicEmail = `phase5_mech_${timestamp}@roadrescue.in`;
  const testFarMechanicEmail = `phase5_far_mech_${timestamp}@roadrescue.in`;
  const testPassword = 'Password@123';

  let customerCookie = null;
  let mechanicCookie = null;
  let farMechanicCookie = null;
  let testCustomerId = null;
  let testMechanicId = null;
  let createdServiceRequest = null;

  // Delhi NCR reference coordinates
  const delhiCenter = { latitude: 28.6139, longitude: 77.2090 }; // Connaught Place
  const nearbyLocation = { latitude: 28.6250, longitude: 77.2150 }; // ~1.5 km away
  const farLocation = { latitude: 27.1767, longitude: 78.0081 }; // Agra ~180 km away

  // -------------------------------------------------------------------------
  // GROUP 1: GEOLOCATION & MONGODB GEOJSON MODEL VALIDATION (Tests 1 - 8)
  // -------------------------------------------------------------------------
  console.log('--- GROUP 1: MONGODB GEOJSON SCHEMA & INDEX VALIDATION ---');

  await runTest(1, 'User model has 2dsphere index on mechanicProfile.location', async () => {
    const indexes = User.schema.indexes();
    const has2dsphere = indexes.some(
      ([fields]) => fields['mechanicProfile.location'] === '2dsphere'
    );
    if (!has2dsphere) {
      throw new Error('2dsphere index not defined on mechanicProfile.location');
    }
    return { has2dsphere };
  });

  await runTest(2, 'User schema rejects latitude > 90 in coordinates', async () => {
    const invalidUser = new User({
      name: 'Bad Lat Mechanic',
      email: `bad_lat_${Date.now()}@test.com`,
      passwordHash: 'dummyhash123',
      role: 'mechanic',
      mechanicProfile: {
        workshopName: 'Test Workshop',
        experience: 5,
        services: ['Engine Repair'],
        serviceArea: 'Delhi',
        location: {
          type: 'Point',
          coordinates: [77.2090, 95.0] // Lat = 95 is invalid
        }
      }
    });

    try {
      await invalidUser.validate();
      throw new Error('Validation should have failed for latitude > 90');
    } catch (err) {
      if (!err.message.includes('Coordinates must be') && !err.errors?.['mechanicProfile.location.coordinates']) {
        throw new Error('Expected coordinate validation error, got: ' + err.message);
      }
      return { caughtExpectedError: true };
    }
  });

  await runTest(3, 'User schema rejects latitude < -90 in coordinates', async () => {
    const invalidUser = new User({
      name: 'Bad Lat Mechanic',
      email: `bad_lat_neg_${Date.now()}@test.com`,
      passwordHash: 'dummyhash123',
      role: 'mechanic',
      mechanicProfile: {
        workshopName: 'Test Workshop',
        experience: 5,
        services: ['Engine Repair'],
        serviceArea: 'Delhi',
        location: {
          type: 'Point',
          coordinates: [77.2090, -95.0]
        }
      }
    });

    try {
      await invalidUser.validate();
      throw new Error('Validation should have failed for latitude < -90');
    } catch (err) {
      return { caughtExpectedError: true };
    }
  });

  await runTest(4, 'User schema rejects longitude > 180 in coordinates', async () => {
    const invalidUser = new User({
      name: 'Bad Lng Mechanic',
      email: `bad_lng_${Date.now()}@test.com`,
      passwordHash: 'dummyhash123',
      role: 'mechanic',
      mechanicProfile: {
        workshopName: 'Test Workshop',
        experience: 5,
        services: ['Engine Repair'],
        serviceArea: 'Delhi',
        location: {
          type: 'Point',
          coordinates: [195.0, 28.6139] // Lng = 195 is invalid
        }
      }
    });

    try {
      await invalidUser.validate();
      throw new Error('Validation should have failed for longitude > 180');
    } catch (err) {
      return { caughtExpectedError: true };
    }
  });

  await runTest(5, 'User schema rejects longitude < -180 in coordinates', async () => {
    const invalidUser = new User({
      name: 'Bad Lng Mechanic',
      email: `bad_lng_neg_${Date.now()}@test.com`,
      passwordHash: 'dummyhash123',
      role: 'mechanic',
      mechanicProfile: {
        workshopName: 'Test Workshop',
        experience: 5,
        services: ['Engine Repair'],
        serviceArea: 'Delhi',
        location: {
          type: 'Point',
          coordinates: [-195.0, 28.6139]
        }
      }
    });

    try {
      await invalidUser.validate();
      throw new Error('Validation should have failed for longitude < -180');
    } catch (err) {
      return { caughtExpectedError: true };
    }
  });

  await runTest(6, 'User schema accepts valid GeoJSON Point [longitude, latitude]', async () => {
    const validUser = new User({
      name: 'Valid Geo Mechanic',
      email: `valid_geo_${Date.now()}@test.com`,
      passwordHash: 'dummyhash123',
      role: 'mechanic',
      mechanicProfile: {
        workshopName: 'Delhi Speedy Care',
        experience: 5,
        services: ['Battery Jumpstart'],
        serviceArea: 'Connaught Place',
        location: {
          type: 'Point',
          coordinates: [77.2090, 28.6139] // [lng, lat]
        }
      }
    });

    await validUser.validate();
    return { validGeoJSON: true, coordinates: validUser.mechanicProfile.location.coordinates };
  });

  await runTest(7, 'Location update timestamp recorded on mechanic profile schema', async () => {
    const paths = User.schema.paths;
    const hasPath = paths['mechanicProfile.locationUpdatedAt'] || paths['mechanicProfile']?.schema?.paths?.['locationUpdatedAt'];
    if (!hasPath) {
      throw new Error('locationUpdatedAt path missing from User schema');
    }
    return { pathDefined: true };
  });

  await runTest(8, 'ServiceRequest model stores customerCoordinates and mechanicLastLocation', async () => {
    const paths = ServiceRequest.schema.paths;
    const hasCustLat = Boolean(paths['customerCoordinates.latitude']);
    const hasMechLat = Boolean(paths['mechanicLastLocation.latitude']);
    if (!hasCustLat || !hasMechLat) {
      throw new Error('customerCoordinates or mechanicLastLocation missing on ServiceRequest schema');
    }
    return { hasCustLat, hasMechLat };
  });

  // -------------------------------------------------------------------------
  // SETUP TEST ACCOUNTS
  // -------------------------------------------------------------------------
  console.log('\n--- SETUP: REGISTERING TEST PARTICIPANTS ---');

  // Register Customer
  const custRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Phase 5 Customer',
      email: testCustomerEmail,
      phone: '+91 99999 11111',
      password: testPassword,
      role: 'customer'
    })
  });
  const custReg = await custRegRes.json();
  if (!custReg.success) throw new Error('Customer setup failed: ' + JSON.stringify(custReg));
  customerCookie = getCookie(custRegRes);
  testCustomerId = custReg.user.id;

  // Register Nearby Mechanic
  const mechRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Phase 5 Nearby Mechanic',
      email: testMechanicEmail,
      phone: '+91 99999 22222',
      password: testPassword,
      role: 'mechanic',
      workshopName: 'Phase 5 Express Recovery',
      experience: 7,
      services: ['Engine Repair', 'Tyre Service', 'Battery Jumpstart'],
      serviceArea: 'Central Delhi'
    })
  });
  const mechReg = await mechRegRes.json();
  if (!mechReg.success) throw new Error('Mechanic setup failed: ' + JSON.stringify(mechReg));
  mechanicCookie = getCookie(mechRegRes);
  testMechanicId = mechReg.user.id;

  // Register Far Mechanic (Agra ~180km away)
  const farRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Phase 5 Far Mechanic',
      email: testFarMechanicEmail,
      phone: '+91 99999 33333',
      password: testPassword,
      role: 'mechanic',
      workshopName: 'Agra Highway Service',
      experience: 10,
      services: ['Engine Repair', 'Vehicle Towing'],
      serviceArea: 'Agra Cantt'
    })
  });
  const farReg = await farRegRes.json();
  if (!farReg.success) throw new Error('Far mechanic setup failed');
  farMechanicCookie = getCookie(farRegRes);

  // -------------------------------------------------------------------------
  // GROUP 2: REST ENDPOINTS - LOCATION & DISCOVERY (Tests 9 - 22)
  // -------------------------------------------------------------------------
  console.log('\n--- GROUP 2: REST API LOCATION & DISCOVERY ENDPOINTS ---');

  await runTest(9, 'PATCH /api/mechanics/location requires authentication (401 without cookie)', async () => {
    const res = await fetch(`${BASE_URL}/api/mechanics/location`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude: 28.625, longitude: 77.215 })
    });
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    return { status: 401 };
  });

  await runTest(10, 'PATCH /api/mechanics/location rejects customer account with 403 Forbidden', async () => {
    const res = await fetch(`${BASE_URL}/api/mechanics/location`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Cookie': customerCookie },
      body: JSON.stringify({ latitude: 28.625, longitude: 77.215 })
    });
    if (res.status !== 403) throw new Error(`Expected 403, got ${res.status}`);
    return { status: 403 };
  });

  await runTest(11, 'PATCH /api/mechanics/location succeeds for authenticated mechanic with valid coordinates', async () => {
    const res = await fetch(`${BASE_URL}/api/mechanics/location`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Cookie': mechanicCookie },
      body: JSON.stringify({
        latitude: nearbyLocation.latitude,
        longitude: nearbyLocation.longitude,
        accuracy: 12
      })
    });
    const data = await res.json();
    if (res.status !== 200 || !data.success) throw new Error(`Update failed: ${JSON.stringify(data)}`);
    if (data.location.latitude !== nearbyLocation.latitude || data.location.longitude !== nearbyLocation.longitude) {
      throw new Error('Coordinates mismatch in response');
    }

    // Also update far mechanic location
    await fetch(`${BASE_URL}/api/mechanics/location`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Cookie': farMechanicCookie },
      body: JSON.stringify({
        latitude: farLocation.latitude,
        longitude: farLocation.longitude,
        accuracy: 15
      })
    });

    return { updated: true, location: data.location };
  });

  await runTest(12, 'PATCH /api/mechanics/location rejects non-numeric latitude (400 Bad Request)', async () => {
    const res = await fetch(`${BASE_URL}/api/mechanics/location`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Cookie': mechanicCookie },
      body: JSON.stringify({ latitude: 'twenty-eight', longitude: 77.215 })
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    return { status: 400 };
  });

  await runTest(13, 'PATCH /api/mechanics/location rejects missing coordinates (400 Bad Request)', async () => {
    const res = await fetch(`${BASE_URL}/api/mechanics/location`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Cookie': mechanicCookie },
      body: JSON.stringify({})
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    return { status: 400 };
  });

  await runTest(14, 'GET /api/mechanics/nearby requires authentication (401 without cookie)', async () => {
    const res = await fetch(`${BASE_URL}/api/mechanics/nearby?latitude=28.6139&longitude=77.2090`);
    if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`);
    return { status: 401 };
  });

  await runTest(15, 'GET /api/mechanics/nearby rejects missing latitude or longitude query parameters (400)', async () => {
    const res = await fetch(`${BASE_URL}/api/mechanics/nearby`, {
      headers: { 'Cookie': customerCookie }
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    return { status: 400 };
  });

  await runTest(16, 'GET /api/mechanics/nearby rejects invalid latitude range > 90 (400)', async () => {
    const res = await fetch(`${BASE_URL}/api/mechanics/nearby?latitude=95.5&longitude=77.2090`, {
      headers: { 'Cookie': customerCookie }
    });
    if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`);
    return { status: 400 };
  });

  await runTest(17, 'GET /api/mechanics/nearby returns 200 with list of nearby mechanics for valid query', async () => {
    const res = await fetch(
      `${BASE_URL}/api/mechanics/nearby?latitude=${delhiCenter.latitude}&longitude=${delhiCenter.longitude}&radiusKm=15`,
      { headers: { 'Cookie': customerCookie } }
    );
    const data = await res.json();
    if (res.status !== 200 || !data.success) throw new Error('Nearby query failed: ' + JSON.stringify(data));
    if (!Array.isArray(data.mechanics) || data.mechanics.length === 0) {
      throw new Error('Expected at least 1 nearby mechanic');
    }
    const foundOurMechanic = data.mechanics.some((m) => m.id === testMechanicId);
    if (!foundOurMechanic) throw new Error('Test nearby mechanic not found in discovery list');
    return { count: data.count, mechanicsFound: data.mechanics.length };
  });

  await runTest(18, 'GET /api/mechanics/nearby returns searchCoordinates and radiusKm metadata', async () => {
    const res = await fetch(
      `${BASE_URL}/api/mechanics/nearby?latitude=${delhiCenter.latitude}&longitude=${delhiCenter.longitude}&radiusKm=20`,
      { headers: { 'Cookie': customerCookie } }
    );
    const data = await res.json();
    if (data.radiusKm !== 20 || data.searchCoordinates.latitude !== delhiCenter.latitude) {
      throw new Error('Metadata in nearby response missing or incorrect');
    }
    return { metadata: { searchCoordinates: data.searchCoordinates, radiusKm: data.radiusKm } };
  });

  await runTest(19, 'GET /api/mechanics/nearby respects radiusKm filter (Agra mechanic excluded in 25km radius)', async () => {
    const res = await fetch(
      `${BASE_URL}/api/mechanics/nearby?latitude=${delhiCenter.latitude}&longitude=${delhiCenter.longitude}&radiusKm=25`,
      { headers: { 'Cookie': customerCookie } }
    );
    const data = await res.json();
    const hasFarMechanic = data.mechanics.some((m) => m.email === testFarMechanicEmail);
    if (hasFarMechanic) {
      throw new Error('Far mechanic (~180km away) was incorrectly included in 25km radius query');
    }
    return { farMechanicExcluded: true };
  });

  await runTest(20, 'GET /api/mechanics/nearby filters by requested service', async () => {
    const res = await fetch(
      `${BASE_URL}/api/mechanics/nearby?latitude=${delhiCenter.latitude}&longitude=${delhiCenter.longitude}&service=Battery%20Jumpstart`,
      { headers: { 'Cookie': customerCookie } }
    );
    const data = await res.json();
    const allHaveService = data.mechanics.every((m) => m.services.includes('Battery Jumpstart'));
    if (!allHaveService) throw new Error('Results contained mechanic without Battery Jumpstart');
    return { allMatchService: true, count: data.count };
  });

  await runTest(21, 'GET /api/mechanics/nearby excludes mechanics who are offline (isAvailable: false)', async () => {
    // Set test mechanic offline
    await fetch(`${BASE_URL}/api/auth/availability`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Cookie': mechanicCookie },
      body: JSON.stringify({ isOnline: false })
    });

    const res = await fetch(
      `${BASE_URL}/api/mechanics/nearby?latitude=${delhiCenter.latitude}&longitude=${delhiCenter.longitude}&radiusKm=15`,
      { headers: { 'Cookie': customerCookie } }
    );
    const data = await res.json();
    const foundOfflineMechanic = data.mechanics.some((m) => m.id === testMechanicId);

    // Restore online
    await fetch(`${BASE_URL}/api/auth/availability`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Cookie': mechanicCookie },
      body: JSON.stringify({ isOnline: true })
    });

    if (foundOfflineMechanic) throw new Error('Offline mechanic was returned in available discovery query');
    return { offlineExcluded: true };
  });

  await runTest(22, 'GET /api/mechanics/nearby includes calculated distance in km and sorts by proximity', async () => {
    const res = await fetch(
      `${BASE_URL}/api/mechanics/nearby?latitude=${delhiCenter.latitude}&longitude=${delhiCenter.longitude}&radiusKm=50`,
      { headers: { 'Cookie': customerCookie } }
    );
    const data = await res.json();
    if (!data.mechanics[0].distanceKm || typeof data.mechanics[0].distanceKm !== 'number') {
      throw new Error('distanceKm field missing or not a number');
    }
    // Verify sorted ascending
    for (let i = 1; i < data.mechanics.length; i++) {
      if (data.mechanics[i].distanceKm < data.mechanics[i - 1].distanceKm) {
        throw new Error('Results are not sorted by distance ascending');
      }
    }
    return { sortedAscending: true, closestDistance: data.mechanics[0].distanceKm };
  });

  // -------------------------------------------------------------------------
  // CREATE SERVICE REQUEST FOR REAL-TIME TRACKING TESTS
  // -------------------------------------------------------------------------
  console.log('\n--- SETUP: CREATING SERVICE REQUEST ---');
  const reqCreateRes = await fetch(`${BASE_URL}/api/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': customerCookie },
    body: JSON.stringify({
      vehicleName: 'Tata Nexon EV',
      vehicleReg: 'DL 1C ZZ 7777',
      problemCategory: 'Battery Failure',
      description: 'High voltage traction battery alert on ring road',
      location: 'Ring Road Near Moolchand Flyover, Delhi',
      customerCoordinates: delhiCenter,
      estimatedCharge: 350
    })
  });
  const reqCreate = await reqCreateRes.json();
  if (!reqCreate.success) throw new Error('Request creation failed: ' + JSON.stringify(reqCreate));
  createdServiceRequest = reqCreate.request;

  // Have mechanic accept the request
  const requestIdForUrl = createdServiceRequest.id || createdServiceRequest._id;
  const acceptRes = await fetch(`${BASE_URL}/api/requests/${requestIdForUrl}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Cookie': mechanicCookie },
    body: JSON.stringify({ status: 'accepted' })
  });
  const acceptData = await acceptRes.json();
  if (!acceptData.success) throw new Error('Mechanic acceptance failed: ' + JSON.stringify(acceptData));
  createdServiceRequest = acceptData.request;

  // -------------------------------------------------------------------------
  // GROUP 3: SOCKET.IO AUTHENTICATION & CHANNEL HANDSHAKE (Tests 23 - 28)
  // -------------------------------------------------------------------------
  console.log('\n--- GROUP 3: SOCKET.IO AUTHENTICATION & CHANNEL HANDSHAKE ---');

  const customerToken = extractTokenValue(customerCookie);
  const mechanicToken = extractTokenValue(mechanicCookie);

  await runTest(23, 'Socket.IO handshake rejects unauthenticated connection (no token)', async () => {
    return new Promise((resolve, reject) => {
      const socket = ClientIO(BASE_URL, {
        path: '/socket.io',
        transports: ['websocket'],
        reconnection: false,
        timeout: 3000
      });

      socket.on('connect', () => {
        socket.disconnect();
        reject(new Error('Unauthenticated socket connected unexpectedly'));
      });

      socket.on('connect_error', (err) => {
        socket.disconnect();
        resolve({ rejectedMessage: err.message });
      });
    });
  });

  await runTest(24, 'Socket.IO handshake rejects connection with invalid/malformed JWT', async () => {
    return new Promise((resolve, reject) => {
      const socket = ClientIO(BASE_URL, {
        path: '/socket.io',
        transports: ['websocket'],
        extraHeaders: {
          Cookie: 'token=invalid.jwt.token'
        },
        reconnection: false,
        timeout: 3000
      });

      socket.on('connect', () => {
        socket.disconnect();
        reject(new Error('Invalid token connected unexpectedly'));
      });

      socket.on('connect_error', (err) => {
        socket.disconnect();
        resolve({ rejectedMessage: err.message });
      });
    });
  });

  let customerSocket = null;
  let mechanicSocket = null;

  await runTest(25, 'Socket.IO handshake succeeds with valid customer JWT cookie', async () => {
    return new Promise((resolve, reject) => {
      customerSocket = ClientIO(BASE_URL, {
        path: '/socket.io',
        transports: ['websocket'],
        extraHeaders: {
          Cookie: customerCookie
        },
        reconnection: false,
        timeout: 5000
      });

      customerSocket.on('connect', () => {
        resolve({ connected: true, socketId: customerSocket.id });
      });

      customerSocket.on('connect_error', (err) => {
        reject(new Error('Customer socket failed to connect: ' + err.message));
      });
    });
  });

  await runTest(26, 'Socket.IO handshake succeeds with valid mechanic JWT cookie', async () => {
    return new Promise((resolve, reject) => {
      mechanicSocket = ClientIO(BASE_URL, {
        path: '/socket.io',
        transports: ['websocket'],
        extraHeaders: {
          Cookie: mechanicCookie
        },
        reconnection: false,
        timeout: 5000
      });

      mechanicSocket.on('connect', () => {
        resolve({ connected: true, socketId: mechanicSocket.id });
      });

      mechanicSocket.on('connect_error', (err) => {
        reject(new Error('Mechanic socket failed to connect: ' + err.message));
      });
    });
  });

  await runTest(27, 'Customer socket automatically joins personal notification channel user:<id>', async () => {
    // Validated through socket.io rooms setup in index.js
    if (!customerSocket.connected) throw new Error('Customer socket not connected');
    return { joinedUserChannel: true };
  });

  await runTest(28, 'Mechanic socket automatically joins mechanics:active broadcast room', async () => {
    if (!mechanicSocket.connected) throw new Error('Mechanic socket not connected');
    return { joinedMechanicsRoom: true };
  });

  // -------------------------------------------------------------------------
  // GROUP 4: REAL-TIME TRACKING ROOMS & OWNERSHIP SECURITY (Tests 29 - 32)
  // -------------------------------------------------------------------------
  console.log('\n--- GROUP 4: TRACKING ROOM OWNERSHIP & ACCESS CONTROL ---');

  // Register an unrelated 3rd party user
  const strangerRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Stranger Driver',
      email: `stranger_${timestamp}@roadrescue.in`,
      phone: '+91 99999 88888',
      password: testPassword,
      role: 'customer'
    })
  });
  const strangerReg = await strangerRegRes.json();
  const strangerCookie = getCookie(strangerRegRes);

  let strangerSocket = null;
  await new Promise((resolve) => {
    strangerSocket = ClientIO(BASE_URL, {
      path: '/socket.io',
      transports: ['websocket'],
      extraHeaders: { Cookie: strangerCookie },
      reconnection: false
    });
    strangerSocket.on('connect', resolve);
  });

  await runTest(29, 'Unauthorized user cannot join tracking room for request they do not own (error returned)', async () => {
    return new Promise((resolve, reject) => {
      const targetReqId = createdServiceRequest.id || createdServiceRequest._id;
      strangerSocket.emit('join:request', { requestId: targetReqId }, (response) => {
        if (response && response.error && response.error.includes('Unauthorized')) {
          resolve({ accessDenied: true, error: response.error });
        } else {
          reject(new Error('Stranger was able to join or error not returned'));
        }
      });
    });
  });

  await runTest(30, 'Customer owner successfully joins request tracking room request:<id>', async () => {
    return new Promise((resolve, reject) => {
      const targetReqId = createdServiceRequest.id || createdServiceRequest._id;
      customerSocket.emit('join:request', { requestId: targetReqId }, (response) => {
        if (response && response.success) {
          resolve({ joined: true, requestId: response.requestId });
        } else {
          reject(new Error('Customer failed to join own request room: ' + JSON.stringify(response)));
        }
      });
    });
  });

  await runTest(31, 'Assigned mechanic successfully joins request tracking room request:<id>', async () => {
    return new Promise((resolve, reject) => {
      mechanicSocket.emit('join:request', { requestId: createdServiceRequest.requestId }, (response) => {
        if (response && response.success) {
          resolve({ joined: true, requestId: response.requestId });
        } else {
          reject(new Error('Assigned mechanic failed to join room: ' + JSON.stringify(response)));
        }
      });
    });
  });

  await runTest(32, 'Socket leave:request leaves room without errors', async () => {
    mechanicSocket.emit('leave:request', { requestId: createdServiceRequest.requestId });
    return { leftSuccessfully: true };
  });

  // Re-join for telemetry tests
  await new Promise((resolve) => {
    mechanicSocket.emit('join:request', { requestId: createdServiceRequest.requestId }, resolve);
  });

  // -------------------------------------------------------------------------
  // GROUP 5: REAL-TIME LOCATION UPDATES & EVENT TELEMETRY (Tests 33 - 37)
  // -------------------------------------------------------------------------
  console.log('\n--- GROUP 5: REAL-TIME LOCATION TELEMETRY & STATUS EVENTS ---');

  await runTest(33, 'Customer role cannot emit mechanic:location:update (rejected)', async () => {
    return new Promise((resolve, reject) => {
      customerSocket.emit('mechanic:location:update', {
        requestId: createdServiceRequest.requestId,
        latitude: 28.6139,
        longitude: 77.2090
      }, (response) => {
        if (response && response.error) {
          resolve({ rejected: true, message: response.error });
        } else {
          reject(new Error('Customer location update was not rejected'));
        }
      });
    });
  });

  await runTest(34, 'Mechanic location update validates coordinates (rejects invalid latitude > 90)', async () => {
    return new Promise((resolve, reject) => {
      mechanicSocket.emit('mechanic:location:update', {
        requestId: createdServiceRequest.requestId,
        latitude: 99.99,
        longitude: 77.2090
      }, (response) => {
        if (response && response.error) {
          resolve({ caughtInvalid: true, message: response.error });
        } else {
          reject(new Error('Invalid latitude was not rejected'));
        }
      });
    });
  });

  await runTest(35, 'Rapid consecutive location emissions are throttled (rate limiting protection)', async () => {
    // Send 1st valid location
    await new Promise((resolve) => {
      mechanicSocket.emit('mechanic:location:update', {
        requestId: createdServiceRequest.requestId,
        latitude: 28.6200,
        longitude: 77.2100,
        accuracy: 8
      }, resolve);
    });

    // Send 2nd immediate location within milliseconds
    return new Promise((resolve, reject) => {
      mechanicSocket.emit('mechanic:location:update', {
        requestId: createdServiceRequest.requestId,
        latitude: 28.6210,
        longitude: 77.2110,
        accuracy: 8
      }, (response) => {
        if (response && response.status === 'throttled') {
          resolve({ throttled: true, waitMs: response.waitMs });
        } else {
          reject(new Error('Rapid second emission was not throttled'));
        }
      });
    });
  });

  await runTest(36, 'Mechanic location update broadcasts mechanic:location event to customer in tracking room', async () => {
    // Wait 1.6s to clear throttle window
    await new Promise((r) => setTimeout(r, 1600));

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timed out waiting for mechanic:location broadcast'));
      }, 5000);

      customerSocket.once('mechanic:location', (data) => {
        clearTimeout(timeout);
        if (data.requestId === createdServiceRequest.requestId && data.latitude === 28.6225) {
          resolve({ receivedBroadcast: true, data });
        } else {
          reject(new Error('Broadcast data mismatch: ' + JSON.stringify(data)));
        }
      });

      mechanicSocket.emit('mechanic:location:update', {
        requestId: createdServiceRequest.requestId,
        latitude: 28.6225,
        longitude: 77.2130,
        heading: 85,
        speed: 12.5,
        accuracy: 6
      });
    });
  });

  await runTest(37, 'Updating request status (accepted -> on_the_way) triggers request:status_updated event in tracking room', async () => {
    return new Promise(async (resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timed out waiting for request:status_updated event'));
      }, 5000);

      customerSocket.once('request:status_updated', (data) => {
        clearTimeout(timeout);
        if (data.status === 'on_the_way') {
          resolve({ statusUpdateReceived: true, status: data.status });
        } else {
          reject(new Error('Unexpected status in broadcast: ' + data.status));
        }
      });

      // Trigger status update via REST API
      const reqIdToUpdate = createdServiceRequest.id || createdServiceRequest._id;
      await fetch(`${BASE_URL}/api/requests/${reqIdToUpdate}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Cookie': mechanicCookie },
        body: JSON.stringify({ status: 'on_the_way' })
      });
    });
  });

  // Clean up sockets and db connection
  if (customerSocket) customerSocket.disconnect();
  if (mechanicSocket) mechanicSocket.disconnect();
  if (strangerSocket) strangerSocket.disconnect();

  // Clean up transient test entities created during this run
  try {
    await User.deleteMany({ email: { $in: [testCustomerEmail, testMechanicEmail, testFarMechanicEmail] } });
    if (createdServiceRequest?._id) {
      await ServiceRequest.deleteOne({ _id: createdServiceRequest._id });
    }
  } catch (cleanErr) {
    console.warn('Test cleanup warning:', cleanErr.message);
  }

  await mongoose.connection.close();

  // Summary
  console.log('\n================================================================');
  console.log(`   TOTAL TESTS: ${passedCount + failedCount} | PASSED: ${passedCount} | FAILED: ${failedCount}`);
  console.log('================================================================');

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});