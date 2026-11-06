import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'http://localhost:5000';

const getCookie = (res) => {
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) return null;
  const match = setCookie.match(/token=([^;]+)/) || setCookie.match(/roadrescue_token=([^;]+)/);
  return match ? `${match[0].split(';')[0]}` : null;
};

async function testStage1() {
  console.log('🧪 Starting Stage 1 Verification Suite...\n');
  const timestamp = Date.now();

  // Test 1: Customer Registration
  const custEmail = `test_cust_${timestamp}@roadrescue.test`;
  const custRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Stage 1 Customer',
      email: custEmail,
      phone: '9876543210',
      password: 'password123',
      role: 'customer'
    })
  });
  const custData = await custRes.json();
  if (!custData.success || custData.user.role !== 'customer') {
    throw new Error(`Customer registration failed: ${JSON.stringify(custData)}`);
  }
  console.log('✅ Test 1: Customer registration successful & role verified:', custData.user.role);

  // Test 2: Mechanic Registration
  const mechEmail = `test_mech_${timestamp}@roadrescue.test`;
  const mechRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Stage 1 Mechanic',
      email: mechEmail,
      phone: '9876543211',
      password: 'password123',
      role: 'mechanic',
      workshopName: 'Precision Repairs',
      experienceYears: 5,
      serviceArea: 'Delhi NCR',
      servicesOffered: ['Engine Repair', 'Tyre Service']
    })
  });
  const mechData = await mechRes.json();
  if (!mechData.success || mechData.user.role !== 'mechanic' || !mechData.user.mechanicProfile) {
    throw new Error(`Mechanic registration failed: ${JSON.stringify(mechData)}`);
  }
  console.log('✅ Test 2: Mechanic registration successful & mechanic profile created:', mechData.user.mechanicProfile.workshopName);

  // Test 3: Shop Owner Registration (Atomic User + Shop creation)
  const shopOwnerEmail = `test_shop_${timestamp}@roadrescue.test`;
  const shopOwnerRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Stage 1 Shop Owner',
      email: shopOwnerEmail,
      phone: '9876543212',
      password: 'password123',
      role: 'shop_owner',
      shopName: 'Metro Genuine Spares',
      shopAddress: 'Shop 21, Auto Market, Mayapuri',
      shopCity: 'New Delhi',
      shopPinCode: '110064',
      shopDescription: 'Genuine spare parts & consumables',
      latitude: 28.6139,
      longitude: 77.2090,
      acceptsHomeDelivery: true,
      acceptsShopPickup: true,
      deliveryCharge: 60
    })
  });
  const shopOwnerData = await shopOwnerRes.json();
  if (!shopOwnerData.success || shopOwnerData.user.role !== 'shop_owner' || !shopOwnerData.user.shop) {
    throw new Error(`Shop owner registration failed: ${JSON.stringify(shopOwnerData)}`);
  }
  const shopOwnerCookie = getCookie(shopOwnerRes);
  console.log('✅ Test 3: Shop Owner registration successful with atomic Shop creation:');
  console.log(`   - Shop Name: ${shopOwnerData.user.shop.name}`);
  console.log(`   - Delivery Charge: ₹${shopOwnerData.user.shop.deliveryCharge}`);
  console.log(`   - Location: [${shopOwnerData.user.shop.location.coordinates.join(', ')}]`);

  // Test 4: Shop Owner Validation Failure (Missing required shop name should reject transaction)
  const failEmail = `test_fail_${timestamp}@roadrescue.test`;
  const failRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Incomplete Shop Owner',
      email: failEmail,
      phone: '9876543213',
      password: 'password123',
      role: 'shop_owner',
      // Missing shopName
      shopAddress: 'No Name Street',
      shopCity: 'Delhi',
      shopPinCode: '110001'
    })
  });
  const failData = await failRes.json();
  if (failRes.status !== 400) {
    throw new Error(`Expected status 400 for incomplete shop registration, got ${failRes.status}`);
  }
  console.log('✅ Test 4: Incomplete shop registration properly rejected with 400:', failData.message);

  // Test 5: GET /api/shops/me as authenticated shop owner
  const myShopRes = await fetch(`${BASE_URL}/api/shops/me`, {
    headers: {
      Cookie: shopOwnerCookie
    }
  });
  const myShopData = await myShopRes.json();
  if (!myShopData.success || myShopData.shop.name !== 'Metro Genuine Spares') {
    throw new Error(`GET /api/shops/me failed: ${JSON.stringify(myShopData)}`);
  }
  console.log('✅ Test 5: GET /api/shops/me retrieved authenticated shop profile successfully.');

  // Test 6: PATCH /api/shops/me
  const updateRes = await fetch(`${BASE_URL}/api/shops/me`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Cookie: shopOwnerCookie
    },
    body: JSON.stringify({
      deliveryCharge: 80,
      description: 'Updated description for Metro Spares'
    })
  });
  const updateData = await updateRes.json();
  if (!updateData.success || updateData.shop.deliveryCharge !== 80) {
    throw new Error(`PATCH /api/shops/me failed: ${JSON.stringify(updateData)}`);
  }
  console.log('✅ Test 6: PATCH /api/shops/me updated delivery charge to ₹80.');

  // Test 7: Public Shop Directory GET /api/shops and GET /api/shops/:id
  const publicRes = await fetch(`${BASE_URL}/api/shops?city=Delhi`);
  const publicData = await publicRes.json();
  if (!publicData.success || !Array.isArray(publicData.shops)) {
    throw new Error(`Public GET /api/shops failed: ${JSON.stringify(publicData)}`);
  }
  console.log(`✅ Test 7: Public GET /api/shops returned ${publicData.shops.length} active shop(s).`);

  const singleRes = await fetch(`${BASE_URL}/api/shops/${myShopData.shop.id || myShopData.shop._id}`);
  const singleData = await singleRes.json();
  if (!singleData.success || !singleData.shop) {
    throw new Error(`GET /api/shops/:id failed: ${JSON.stringify(singleData)}`);
  }
  console.log(`✅ Test 8: Public GET /api/shops/:id retrieved shop '${singleData.shop.name}'.`);

  // Clean up test documents to keep database pristine
  console.log('\n🧹 Cleaning up test accounts from database...');
  const mongoose = (await import('mongoose')).default;
  await mongoose.connect(process.env.MONGODB_URI);
  const User = (await import('../src/models/User.js')).default;
  const Shop = (await import('../src/models/Shop.js')).default;

  const userIds = [custData.user.id, mechData.user.id, shopOwnerData.user.id];
  await Shop.deleteMany({ owner: { $in: userIds } });
  await User.deleteMany({ _id: { $in: userIds } });
  await mongoose.disconnect();
  console.log('✅ Cleanup complete. All test entities removed.');

  console.log('\n🎉 ALL STAGE 1 TESTS PASSED SUCCESSFULLY!\n');
}

testStage1().catch((err) => {
  console.error('❌ Stage 1 Test Failed:', err);
  process.exit(1);
});
