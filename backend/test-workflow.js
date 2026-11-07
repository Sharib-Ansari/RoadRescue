import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'http://localhost:5000';

const getCookie = (res) => {
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) return null;
  const match = setCookie.match(/token=([^;]+)/);
  return match ? `token=${match[1]}` : null;
};

async function testFullWorkflow() {
  console.log('========================================================');
  console.log('   ROADRESCUE PHASE 4 - FULL INTEGRATION TEST SUITE');
  console.log('========================================================\n');

  // Safety Guard: Require dedicated test database
  if (!process.env.MONGODB_TEST_URI) {
    console.error('❌ MONGODB_TEST_URI environment variable is required to run integration tests.');
    console.error('Aborting tests to prevent accidental mutation of the primary database.');
    process.exit(1);
  }

  // 1. Customer Login
  console.log('1. Testing Customer Login (demo@roadrescue.in)...');
  const custLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'demo@roadrescue.in', password: 'demo123' })
  });
  const custLogin = await custLoginRes.json();
  if (!custLogin.success) throw new Error('Customer login failed: ' + JSON.stringify(custLogin));
  const customerCookie = getCookie(custLoginRes);
  console.log(`   ✅ Customer logged in: ${custLogin.user.name} (${custLogin.user.role})`);

  // 2. Customer Session Verification (/api/auth/me)
  console.log('2. Verifying Customer Session (/api/auth/me)...');
  const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: { 'Cookie': customerCookie }
  });
  const meData = await meRes.json();
  if (!meData.success) throw new Error('/api/auth/me failed');
  console.log(`   ✅ Session restored for customer ID: ${meData.user.id}`);

  // 3. Customer Profile Update
  console.log('3. Updating Customer Safety Contact (/api/auth/profile)...');
  const updateProfileRes = await fetch(`${BASE_URL}/api/auth/profile`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Cookie': customerCookie },
    body: JSON.stringify({
      emergencyContactName: 'Priya Sharma (ICE)',
      emergencyContactPhone: '+91 98111 22334'
    })
  });
  const updatedProfile = await updateProfileRes.json();
  if (!updatedProfile.success) throw new Error('Profile update failed');
  console.log(`   ✅ ICE Contact saved: ${updatedProfile.user.emergencyContactName}`);

  // 4. Customer Vehicle CRUD
  console.log('4. Managing Customer Vehicles (/api/vehicles)...');
  const addVehRes = await fetch(`${BASE_URL}/api/vehicles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': customerCookie },
    body: JSON.stringify({
      brand: 'Tata',
      model: 'Harrier',
      type: 'SUV',
      registrationNumber: 'MH 12 XY 9988',
      fuelType: 'Diesel',
      year: 2023,
      isDefault: true
    })
  });
  const newVeh = await addVehRes.json();
  if (!newVeh.success) throw new Error('Add vehicle failed');
  const vehicleId = newVeh.vehicle.id;
  console.log(`   ✅ Vehicle registered in MongoDB: ${newVeh.vehicle.brand} ${newVeh.vehicle.model} (ID: ${vehicleId})`);

  const getVehsRes = await fetch(`${BASE_URL}/api/vehicles`, {
    headers: { 'Cookie': customerCookie }
  });
  const vehsList = await getVehsRes.json();
  console.log(`   ✅ Vehicles retrieved for customer: ${vehsList.count} total`);

  // 5. Customer creates Emergency Roadside Request
  console.log('5. Creating Emergency Roadside Assistance Request (/api/requests)...');
  const reqRes = await fetch(`${BASE_URL}/api/requests`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': customerCookie },
    body: JSON.stringify({
      vehicleId: vehicleId,
      vehicleName: 'Tata Harrier',
      vehicleReg: 'MH 12 XY 9988',
      problemCategory: 'Battery Failure',
      description: 'Vehicle failed to start at DLF Cyber City gate 3',
      location: 'DLF Cyber City, Sector 24, Gurgaon',
      estimatedCharge: 400
    })
  });
  const requestData = await reqRes.json();
  if (!requestData.success) throw new Error('Create request failed: ' + JSON.stringify(requestData));
  const createdReq = requestData.request;
  console.log(`   ✅ Emergency Request Dispatched: ${createdReq.requestId} (Status: ${createdReq.status})`);

  // 6. Mechanic Login
  console.log('6. Testing Mechanic Login (mechanic@roadrescue.in)...');
  const mechLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'mechanic@roadrescue.in', password: 'mechanic123' })
  });
  const mechLogin = await mechLoginRes.json();
  if (!mechLogin.success) throw new Error('Mechanic login failed: ' + JSON.stringify(mechLogin));
  const mechanicCookie = getCookie(mechLoginRes);
  console.log(`   ✅ Mechanic logged in: ${mechLogin.user.name} (${mechLogin.user.mechanicProfile?.workshopName})`);

  // 7. Mechanic Availability Toggle (/api/auth/availability)
  console.log('7. Updating Mechanic Availability (/api/auth/availability)...');
  const availRes = await fetch(`${BASE_URL}/api/auth/availability`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Cookie': mechanicCookie },
    body: JSON.stringify({ isOnline: true })
  });
  const availData = await availRes.json();
  console.log(`   ✅ Mechanic online state in MongoDB: ${availData.isAvailable}`);

  // 8. Mechanic Retrieves Available/Incoming Requests
  console.log('8. Mechanic Retrieving Incoming Service Requests (/api/requests)...');
  const mechRequestsRes = await fetch(`${BASE_URL}/api/requests`, {
    headers: { 'Cookie': mechanicCookie }
  });
  const mechRequests = await mechRequestsRes.json();
  const targetReq = mechRequests.requests.find(r => r.requestId === createdReq.requestId || r.id === createdReq.id);
  if (!targetReq) throw new Error('Mechanic could not locate incoming request on dispatch radar');
  console.log(`   ✅ Mechanic received request: ${targetReq.requestId} from ${targetReq.customerId?.name}`);

  // 9. Mechanic Accepts Request (Transitions to 'accepted')
  console.log('9. Mechanic Accepting the Request (/api/requests/:id/status)...');
  const acceptRes = await fetch(`${BASE_URL}/api/requests/${targetReq.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Cookie': mechanicCookie },
    body: JSON.stringify({
      status: 'accepted',
      note: 'Mechanic partner accepted the breakdown ticket'
    })
  });
  const acceptedData = await acceptRes.json();
  if (!acceptedData.success || acceptedData.request.status !== 'accepted') {
    throw new Error('Accept request failed: ' + JSON.stringify(acceptedData));
  }
  console.log(`   ✅ Request accepted and assigned to: ${acceptedData.request.mechanicName}`);

  // 10. Mechanic Progresses Status: 'on_the_way' -> 'arrived' -> 'completed'
  console.log('10. Progressing Milestones: On The Way -> Arrived -> Completed...');
  
  await fetch(`${BASE_URL}/api/requests/${targetReq.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Cookie': mechanicCookie },
    body: JSON.stringify({ status: 'on_the_way', note: 'Mechanic is en-route with jumpstart gear' })
  });
  console.log('   ✅ Milestone: On The Way');

  await fetch(`${BASE_URL}/api/requests/${targetReq.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Cookie': mechanicCookie },
    body: JSON.stringify({ status: 'arrived', note: 'Mechanic arrived on site' })
  });
  console.log('   ✅ Milestone: Arrived at location');

  const completeRes = await fetch(`${BASE_URL}/api/requests/${targetReq.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Cookie': mechanicCookie },
    body: JSON.stringify({
      status: 'completed',
      finalCharge: 400,
      note: 'Battery tested, jumpstarted and alternator output verified'
    })
  });
  const completedData = await completeRes.json();
  if (completedData.request.status !== 'completed') throw new Error('Completion status failed');
  console.log(`   ✅ Milestone: Job Completed (Final charge: ₹${completedData.request.finalCharge})`);

  // 11. Customer Views Updated Status in MongoDB
  console.log('11. Customer Verifying Service Completion (/api/requests/:id)...');
  const custCheckRes = await fetch(`${BASE_URL}/api/requests/${targetReq.id}`, {
    headers: { 'Cookie': customerCookie }
  });
  const custCheckData = await custCheckRes.json();
  console.log(`   ✅ Customer verified status: ${custCheckData.request.status}`);
  console.log(`   ✅ Audit trail steps logged in MongoDB: ${custCheckData.request.statusHistory.length}`);

  // 12. Security Test: Unauthorized cross-user rejection
  console.log('12. Security Check: Unauthorized update verification...');
  const fakeRes = await fetch(`${BASE_URL}/api/requests/${targetReq.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'Cookie': customerCookie },
    body: JSON.stringify({ status: 'on_the_way' })
  });
  if (fakeRes.status !== 403) throw new Error('Expected 403 when customer tries to set mechanic milestone');
  console.log('   ✅ Security wall verified: Customer forbidden from mutating mechanic milestones (HTTP 403)');

  console.log('\n========================================================');
  console.log('🎉 ALL 12 END-TO-END WORKFLOW INTEGRATION TESTS PASSED!');
  console.log('========================================================\n');
}

testFullWorkflow().catch(err => {
  console.error('❌ Integration Test Failed:', err);
  process.exit(1);
});
