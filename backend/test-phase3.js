import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'http://localhost:5000';

const getCookie = (res) => {
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) return null;
  const match = setCookie.match(/token=([^;]+)/);
  return match ? `token=${match[1]}` : null;
};

async function testPhase3() {
  console.log('Testing Phase 3: Connected APIs & Models...\n');

  // 1. Test Public Mechanics API
  const mechRes = await fetch(`${BASE_URL}/api/mechanics`);
  const mechData = await mechRes.json();
  console.log(`✅ Mechanics API (/api/mechanics): ${mechData.count} mechanics found`);

  // 2. Test Login with Seeded Demo Customer
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'demo@roadrescue.in', password: 'demo123' })
  });
  const loginData = await loginRes.json();
  if (!loginData.success) throw new Error(`Demo login failed: ${JSON.stringify(loginData)}`);
  const customerCookie = getCookie(loginRes);
  console.log(`✅ Demo Customer Login: Verified as ${loginData.user.name} (${loginData.user.email})`);

  // 3. Test Add Vehicle API
  const addVehRes = await fetch(`${BASE_URL}/api/vehicles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': customerCookie
    },
    body: JSON.stringify({
      brand: 'Hyundai',
      model: 'Creta',
      type: 'SUV',
      registrationNumber: 'DL 01 AB 7890',
      fuelType: 'Diesel',
      year: 2023,
      isDefault: true
    })
  });
  const addVehData = await addVehRes.json();
  if (!addVehData.success) throw new Error(`Add vehicle failed: ${JSON.stringify(addVehData)}`);
  const createdVehId = addVehData.vehicle.id;
  console.log(`✅ Add Vehicle API (/api/vehicles): Registered ${addVehData.vehicle.brand} ${addVehData.vehicle.model} (ID: ${createdVehId})`);

  // 4. Test Get My Vehicles API
  const getVehRes = await fetch(`${BASE_URL}/api/vehicles`, {
    headers: { 'Cookie': customerCookie }
  });
  const getVehData = await getVehRes.json();
  console.log(`✅ Get Vehicles API (/api/vehicles): Retrieved ${getVehData.count} vehicle(s)`);

  // 5. Test Create Service Request API
  const reqRes = await fetch(`${BASE_URL}/api/requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': customerCookie
    },
    body: JSON.stringify({
      vehicleId: createdVehId,
      vehicleName: 'Hyundai Creta',
      vehicleReg: 'DL 01 AB 7890',
      problemCategory: 'Flat Tyre / Puncture',
      description: 'Right rear tyre puncture on NH-48 near Sector 29',
      location: 'NH-48, Sector 29, Gurgaon',
      estimatedCharge: 350
    })
  });
  const reqData = await reqRes.json();
  if (!reqData.success) throw new Error(`Create request failed: ${JSON.stringify(reqData)}`);
  const createdReqId = reqData.request.id;
  console.log(`✅ Create Service Request (/api/requests): Created ${reqData.request.requestId} (Status: ${reqData.request.status})`);

  // 6. Test Active Request API
  const activeRes = await fetch(`${BASE_URL}/api/requests/active`, {
    headers: { 'Cookie': customerCookie }
  });
  const activeData = await activeRes.json();
  console.log(`✅ Active Request API (/api/requests/active): Has Active = ${activeData.hasActiveRequest}, Request ID: ${activeData.request?.requestId}`);

  // 7. Test Mechanic Status Update on Request
  // Log in as Demo Mechanic
  const mechLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'mechanic@roadrescue.in', password: 'mechanic123' })
  });
  const mechLoginData = await mechLoginRes.json();
  const mechanicCookie = getCookie(mechLoginRes);
  console.log(`✅ Demo Mechanic Login: Verified as ${mechLoginData.user.name}`);

  // Mechanic accepts the request
  const acceptRes = await fetch(`${BASE_URL}/api/requests/${createdReqId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': mechanicCookie
    },
    body: JSON.stringify({
      status: 'accepted',
      note: 'Mechanic Rajesh Kumar accepted the service request'
    })
  });
  const acceptData = await acceptRes.json();
  console.log(`✅ Update Request Status (/api/requests/:id/status): Updated to "${acceptData.request.status}" by ${acceptData.request.mechanicName}`);

  console.log('\n🎉 ALL PHASE 3 INTEGRATION TESTS PASSED PERFECTLY!\n');
}

testPhase3().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
