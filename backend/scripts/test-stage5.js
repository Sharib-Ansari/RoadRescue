import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'http://localhost:5000';

const getCookie = (res) => {
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) return null;
  const match = setCookie.match(/token=([^;]+)/) || setCookie.match(/roadrescue_token=([^;]+)/);
  return match ? `${match[0].split(';')[0]}` : null;
};

async function testStage5() {
  console.log('🧪 Starting Stage 5 Verification Suite (Dashboards, Order Management & KPI Stats)...\n');
  const timestamp = Date.now();

  // 1. Create Shop Owner
  const shopEmail = `dash_shop_${timestamp}@roadrescue.test`;
  const shopRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Dashboard Test Shop Owner',
      email: shopEmail,
      phone: '9876543240',
      password: 'password123',
      role: 'shop_owner',
      shopName: 'Metro Dashboard Spares',
      shopAddress: 'Sector 62, Auto Complex',
      shopCity: 'Noida',
      shopPinCode: '201301',
      latitude: 28.6280,
      longitude: 77.3649,
      acceptsHomeDelivery: true,
      acceptsShopPickup: true,
      deliveryCharge: 60
    })
  });
  const shopData = await shopRes.json();
  const shopCookie = getCookie(shopRes);
  const shopId = shopData.user.shop._id || shopData.user.shop.id;
  console.log('✅ 1. Shop Owner registered & Shop profile initialized:', shopData.user.shop.name);

  // 2. Create Customer
  const custEmail = `dash_cust_${timestamp}@roadrescue.test`;
  const custRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Dashboard Test Customer',
      email: custEmail,
      phone: '9876543241',
      password: 'password123',
      role: 'customer'
    })
  });
  const custData = await custRes.json();
  const custCookie = getCookie(custRes);
  console.log('✅ 2. Customer registered');

  // 3. Shop Owner adds 3 products (one normal stock, one low stock <= 5, one out of stock = 0)
  const p1Res = await fetch(`${BASE_URL}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: shopCookie },
    body: JSON.stringify({
      name: 'Synthetic Motor Oil 5W-40',
      category: 'Fluids & Oils',
      brand: 'Mobil 1',
      SKU: `OIL-${timestamp}`,
      price: 3200,
      stockQuantity: 20,
      isAvailable: true
    })
  });
  const p1Data = await p1Res.json();

  const p2Res = await fetch(`${BASE_URL}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: shopCookie },
    body: JSON.stringify({
      name: 'High Performance Spark Plugs',
      category: 'Engine',
      brand: 'NGK',
      SKU: `PLG-${timestamp}`,
      price: 1400,
      stockQuantity: 4, // Low stock <= 5
      isAvailable: true
    })
  });
  const p2Data = await p2Res.json();

  const prodId1 = p1Data.product.id || p1Data.product._id;
  const prodId2 = p2Data.product.id || p2Data.product._id;
  console.log('✅ 3. Added 2 test inventory products (including low stock item)');

  // 4. Customer places Home Delivery Order
  const ord1Res = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: custCookie },
    body: JSON.stringify({
      shopId,
      fulfillmentMethod: 'home_delivery',
      items: [{ productId: prodId1, quantity: 1 }],
      deliveryAddress: {
        street: 'Sector 62, Tower B',
        city: 'Noida',
        pinCode: '201301',
        contactPhone: '9876543241'
      }
    })
  });
  const ord1Data = await ord1Res.json();
  if (!ord1Data.success) throw new Error(`Order 1 failed: ${JSON.stringify(ord1Data)}`);
  const order1Id = ord1Data.order._id || ord1Data.order.id;
  console.log(`✅ 4. Customer placed Home Delivery order: ${ord1Data.order.orderNumber} (₹${ord1Data.order.totalAmount})`);

  // 5. Customer places Shop Pickup Order
  const ord2Res = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: custCookie },
    body: JSON.stringify({
      shopId,
      fulfillmentMethod: 'shop_pickup',
      items: [{ productId: prodId2, quantity: 2 }]
    })
  });
  const ord2Data = await ord2Res.json();
  if (!ord2Data.success) throw new Error(`Order 2 failed: ${JSON.stringify(ord2Data)}`);
  const order2Id = ord2Data.order._id || ord2Data.order.id;
  console.log(`✅ 5. Customer placed Shop Pickup order: ${ord2Data.order.orderNumber} (₹${ord2Data.order.totalAmount})`);

  // 6. Test GET /api/orders/shop-stats (Live Dashboard KPI Metrics)
  const statsRes = await fetch(`${BASE_URL}/api/orders/shop-stats`, {
    headers: { Cookie: shopCookie }
  });
  const statsData = await statsRes.json();
  if (!statsData.success) throw new Error(`Shop stats failed: ${JSON.stringify(statsData)}`);

  console.log('✅ 6. GET /api/orders/shop-stats returned live KPI metrics:');
  console.log(`   - Total Products: ${statsData.stats.totalProducts}`);
  console.log(`   - Low Stock Items: ${statsData.stats.lowStockProducts}`);
  console.log(`   - Total Orders: ${statsData.stats.totalOrders}`);
  console.log(`   - Pending Orders: ${statsData.stats.pendingOrders}`);
  console.log(`   - Current Revenue: ₹${statsData.stats.totalRevenue}`);

  if (statsData.stats.totalOrders !== 2 || statsData.stats.pendingOrders !== 2) {
    throw new Error(`Expected 2 total orders and 2 pending orders, got ${statsData.stats.totalOrders} / ${statsData.stats.pendingOrders}`);
  }

  // 7. Full Workflow Transition for Home Delivery Order:
  // placed -> confirmed -> preparing -> out_for_delivery -> completed
  console.log('\n🔄 Testing Home Delivery Order status flow...');
  await fetch(`${BASE_URL}/api/orders/${order1Id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: shopCookie },
    body: JSON.stringify({ status: 'confirmed' })
  });
  await fetch(`${BASE_URL}/api/orders/${order1Id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: shopCookie },
    body: JSON.stringify({ status: 'preparing' })
  });
  await fetch(`${BASE_URL}/api/orders/${order1Id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: shopCookie },
    body: JSON.stringify({ status: 'out_for_delivery' })
  });
  const completeRes1 = await fetch(`${BASE_URL}/api/orders/${order1Id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: shopCookie },
    body: JSON.stringify({ status: 'completed', notes: 'Delivered to recipient' })
  });
  const completeData1 = await completeRes1.json();
  if (!completeData1.success || completeData1.order.orderStatus !== 'completed') {
    throw new Error(`Order 1 completion failed: ${JSON.stringify(completeData1)}`);
  }
  console.log('✅ 7. Home Delivery order successfully advanced through all states to "completed"');

  // 8. Full Workflow Transition for Shop Pickup Order:
  // placed -> confirmed -> preparing -> ready_for_pickup -> completed
  console.log('\n🔄 Testing Shop Pickup Order status flow...');
  await fetch(`${BASE_URL}/api/orders/${order2Id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: shopCookie },
    body: JSON.stringify({ status: 'confirmed' })
  });
  await fetch(`${BASE_URL}/api/orders/${order2Id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: shopCookie },
    body: JSON.stringify({ status: 'preparing' })
  });
  await fetch(`${BASE_URL}/api/orders/${order2Id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: shopCookie },
    body: JSON.stringify({ status: 'ready_for_pickup' })
  });
  const completeRes2 = await fetch(`${BASE_URL}/api/orders/${order2Id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: shopCookie },
    body: JSON.stringify({ status: 'completed', notes: 'Customer picked up at shop' })
  });
  const completeData2 = await completeRes2.json();
  if (!completeData2.success || completeData2.order.orderStatus !== 'completed') {
    throw new Error(`Order 2 completion failed: ${JSON.stringify(completeData2)}`);
  }
  console.log('✅ 8. Shop Pickup order successfully advanced through all states to "completed"');

  // 9. Verify Revenue and Completed count update in stats
  const afterStatsRes = await fetch(`${BASE_URL}/api/orders/shop-stats`, {
    headers: { Cookie: shopCookie }
  });
  const afterStatsData = await afterStatsRes.json();
  const expectedRevenue = ord1Data.order.totalAmount + ord2Data.order.totalAmount;
  if (afterStatsData.stats.completedOrders !== 2 || afterStatsData.stats.totalRevenue !== expectedRevenue) {
    throw new Error(`Stats mismatch: completed=${afterStatsData.stats.completedOrders}, rev=${afterStatsData.stats.totalRevenue}, expectedRev=${expectedRevenue}`);
  }
  console.log(`✅ 9. Verified revenue correctly accrued to ₹${afterStatsData.stats.totalRevenue} with 2 completed orders`);

  // 10. Access control: unauthorized customer cannot query shop orders
  const authCheckRes = await fetch(`${BASE_URL}/api/orders/shop-orders`, {
    headers: { Cookie: custCookie }
  });
  if (authCheckRes.status !== 403) {
    throw new Error(`Expected 403 Forbidden for customer accessing shop orders, got ${authCheckRes.status}`);
  }
  console.log('✅ 10. Access control verified: customer received 403 Forbidden on shop orders endpoint');

  // Clean up
  console.log('\n🧹 Cleaning up test accounts, products, and orders...');
  const mongoose = (await import('mongoose')).default;
  await mongoose.connect(process.env.MONGODB_URI);
  const User = (await import('../src/models/User.js')).default;
  const Shop = (await import('../src/models/Shop.js')).default;
  const Product = (await import('../src/models/Product.js')).default;
  const Order = (await import('../src/models/Order.js')).default;

  await Order.deleteMany({ shopId });
  await Product.deleteMany({ shopId });
  await Shop.deleteMany({ _id: shopId });
  await User.deleteMany({ _id: { $in: [shopData.user.id, custData.user.id] } });
  await mongoose.disconnect();
  console.log('✅ Cleanup complete.');

  console.log('\n🎉 ALL STAGE 5 TESTS PASSED SUCCESSFULLY!\n');
}

testStage5().catch((err) => {
  console.error('❌ Stage 5 Test Failed:', err);
  process.exit(1);
});
