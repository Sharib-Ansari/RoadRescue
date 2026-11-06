import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'http://localhost:5000';

const getCookie = (res) => {
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) return null;
  const match = setCookie.match(/token=([^;]+)/) || setCookie.match(/roadrescue_token=([^;]+)/);
  return match ? `${match[0].split(';')[0]}` : null;
};

async function runMasterTest() {
  console.log('================================================================');
  console.log('   ROADRESCUE PHASE 7: SPARE PARTS MARKETPLACE MASTER SUITE    ');
  console.log('================================================================\n');

  let passed = 0;
  let total = 0;

  const assert = (condition, message) => {
    total++;
    if (!condition) {
      console.error(`❌ FAILED: ${message}`);
      throw new Error(message);
    }
    passed++;
    console.log(`✅ [${passed}/${total}] ${message}`);
  };

  const ts = Date.now();

  // STAGE 1: Registration and Shop Model
  console.log('--- STAGE 1: User Role Extension & Shop Profile ---');
  const shopOwnerEmail = `p7_shop_${ts}@roadrescue.test`;
  const regShopRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Master Shop Owner',
      email: shopOwnerEmail,
      phone: '9876543250',
      password: 'password123',
      role: 'shop_owner',
      shopName: 'Supreme Master Spares',
      shopAddress: 'Sector 29, Industrial Area',
      shopCity: 'Gurugram',
      shopPinCode: '122002',
      latitude: 28.4601,
      longitude: 77.0601,
      acceptsHomeDelivery: true,
      acceptsShopPickup: true,
      deliveryCharge: 65
    })
  });
  const regShopData = await regShopRes.json();
  assert(regShopData.success && regShopData.user.role === 'shop_owner', 'Shop Owner atomic registration returns role shop_owner');
  assert(regShopData.user.shop && regShopData.user.shop.name === 'Supreme Master Spares', 'Shop document automatically created with correct name');
  const shopCookie = getCookie(regShopRes);
  const shopId = regShopData.user.shop.id || regShopData.user.shop._id;

  // Verify GET /api/shops/me
  const myShopRes = await fetch(`${BASE_URL}/api/shops/me`, { headers: { Cookie: shopCookie } });
  const myShopData = await myShopRes.json();
  assert(myShopData.success && myShopData.shop.city === 'Gurugram', 'GET /api/shops/me retrieves authenticated shop profile');

  // Customer registration
  const custEmail = `p7_cust_${ts}@roadrescue.test`;
  const regCustRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Master Test Customer',
      email: custEmail,
      phone: '9876543251',
      password: 'password123',
      role: 'customer'
    })
  });
  const regCustData = await regCustRes.json();
  assert(regCustData.success && regCustData.user.role === 'customer', 'Customer registration operates normally');
  const custCookie = getCookie(regCustRes);

  // STAGE 2: Product & Inventory
  console.log('\n--- STAGE 2: Product Model & Inventory Management ---');
  const prodSku = `SKU-MTR-${ts}`;
  const addProdRes = await fetch(`${BASE_URL}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: shopCookie },
    body: JSON.stringify({
      name: 'High Performance Disc Brake Rotor',
      category: 'Brakes',
      brand: 'Brembo',
      SKU: prodSku,
      price: 3800,
      stockQuantity: 10,
      isAvailable: true
    })
  });
  const addProdData = await addProdRes.json();
  assert(addProdData.success && addProdData.product.SKU === prodSku, 'Shop owner successfully creates product with SKU');
  const prodId = addProdData.product.id || addProdData.product._id;

  // Compound unique index test
  const dupSkuRes = await fetch(`${BASE_URL}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: shopCookie },
    body: JSON.stringify({
      name: 'Duplicate SKU Rotor',
      SKU: prodSku,
      price: 2000,
      stockQuantity: 5
    })
  });
  assert(dupSkuRes.status === 409, 'Duplicate SKU within same shop rejected with 409 Conflict');

  // Authorization wall: Customer cannot manage products
  const custAddProdRes = await fetch(`${BASE_URL}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: custCookie },
    body: JSON.stringify({
      name: 'Unauthorized Product',
      SKU: `UNAUTH-${ts}`,
      price: 1000,
      stockQuantity: 5
    })
  });
  assert(custAddProdRes.status === 403, 'Customer forbidden from product management (403)');

  // STAGE 3 & 4: Cart, Checkout & Orders
  console.log('\n--- STAGE 3 & 4: Marketplace, Checkout & Atomic Stock Deduction ---');

  // Test insufficient stock rollback
  const failStockRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: custCookie },
    body: JSON.stringify({
      shopId,
      fulfillmentMethod: 'home_delivery',
      items: [{ productId: prodId, quantity: 15 }], // exceeds 10
      deliveryAddress: { street: 'Main Rd', city: 'Gurugram', pinCode: '122002', contactPhone: '9876543251' }
    })
  });
  assert(failStockRes.status === 400, 'Ordering more than available stock rejected with 400');

  // Verify stock was not mutated
  const stockCheck1 = await fetch(`${BASE_URL}/api/products/${prodId}`);
  const stockCheck1Data = await stockCheck1.json();
  assert(stockCheck1Data.product.stockQuantity === 10, 'Stock remained at 10 after transactional rollback');

  // Place valid Home Delivery Order (qty = 3)
  const orderRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: custCookie },
    body: JSON.stringify({
      shopId,
      fulfillmentMethod: 'home_delivery',
      items: [{ productId: prodId, quantity: 3 }],
      deliveryAddress: { street: 'Park Avenue, DLF', city: 'Gurugram', pinCode: '122002', contactPhone: '9876543251' }
    })
  });
  const orderData = await orderRes.json();
  assert(orderData.success && orderData.order.orderNumber.startsWith('RR-ORD-'), 'Home Delivery order placed with generated orderNumber');
  assert(orderData.order.subtotal === 11400 && orderData.order.deliveryCharge === 65 && orderData.order.totalAmount === 11465, 'Server recalculated immutable prices and added shop delivery fee accurately');
  assert(orderData.order.paymentStatus === 'pending', 'Payment status preserved as "pending"');
  const orderId = orderData.order.id || orderData.order._id;

  // Verify stock decremented to 7
  const stockCheck2 = await fetch(`${BASE_URL}/api/products/${prodId}`);
  const stockCheck2Data = await stockCheck2.json();
  assert(stockCheck2Data.product.stockQuantity === 7, 'Stock decremented atomically to 7 in MongoDB');

  // Place valid Shop Pickup Order (qty = 2)
  const pickupRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: custCookie },
    body: JSON.stringify({
      shopId,
      fulfillmentMethod: 'shop_pickup',
      items: [{ productId: prodId, quantity: 2 }]
    })
  });
  const pickupData = await pickupRes.json();
  assert(pickupData.success && pickupData.order.deliveryCharge === 0, 'Shop Pickup order placed with deliveryCharge = ₹0');
  const pickupOrderId = pickupData.order.id || pickupData.order._id;

  // STAGE 5: Order Status Workflows, Inventory Restoration & Dashboards
  console.log('\n--- STAGE 5: Dashboards, Workflows & Stock Restoration Guard ---');

  // Advance Order 1 to Completed
  await fetch(`${BASE_URL}/api/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: shopCookie },
    body: JSON.stringify({ status: 'confirmed' })
  });
  await fetch(`${BASE_URL}/api/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: shopCookie },
    body: JSON.stringify({ status: 'preparing' })
  });
  await fetch(`${BASE_URL}/api/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: shopCookie },
    body: JSON.stringify({ status: 'out_for_delivery' })
  });
  const compRes = await fetch(`${BASE_URL}/api/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: shopCookie },
    body: JSON.stringify({ status: 'completed' })
  });
  const compData = await compRes.json();
  assert(compData.success && compData.order.orderStatus === 'completed', 'Order 1 successfully transitioned to "completed"');

  // Verify that an already completed order CANNOT be cancelled
  const badCancelRes = await fetch(`${BASE_URL}/api/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: shopCookie },
    body: JSON.stringify({ status: 'cancelled' })
  });
  assert(badCancelRes.status === 400, 'Attempt to cancel a completed order rejected with 400');

  // Cancel Order 2 (pickup order with qty = 2) and verify stock is restored from 5 to 7
  const cancelPickupRes = await fetch(`${BASE_URL}/api/orders/${pickupOrderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: shopCookie },
    body: JSON.stringify({ status: 'cancelled', reason: 'Customer cancelled' })
  });
  const cancelPickupData = await cancelPickupRes.json();
  assert(cancelPickupData.success && cancelPickupData.order.inventoryRestored === true, 'Cancelled order sets inventoryRestored = true');

  // Check restored stock: 5 + 2 = 7
  const stockCheck3 = await fetch(`${BASE_URL}/api/products/${prodId}`);
  const stockCheck3Data = await stockCheck3.json();
  assert(stockCheck3Data.product.stockQuantity === 7, 'Inventory restored once upon order cancellation (stock = 7)');

  // Verify Shop Dashboard Stats
  const statsRes = await fetch(`${BASE_URL}/api/orders/shop-stats`, { headers: { Cookie: shopCookie } });
  const statsData = await statsRes.json();
  assert(statsData.success, 'GET /api/orders/shop-stats returns successfully');
  assert(statsData.stats.totalOrders === 2 && statsData.stats.completedOrders === 1 && statsData.stats.cancelledOrders === 1, 'Order counts accurately segregated in dashboard stats');
  assert(statsData.stats.totalRevenue === 11465, 'Shop total revenue calculated from completed orders (₹11,465)');

  // Clean up
  console.log('\n🧹 Cleaning up test documents...');
  const mongoose = (await import('mongoose')).default;
  await mongoose.connect(process.env.MONGODB_URI);
  const User = (await import('../src/models/User.js')).default;
  const Shop = (await import('../src/models/Shop.js')).default;
  const Product = (await import('../src/models/Product.js')).default;
  const Order = (await import('../src/models/Order.js')).default;

  await Order.deleteMany({ shopId });
  await Product.deleteMany({ shopId });
  await Shop.deleteMany({ _id: shopId });
  await User.deleteMany({ _id: { $in: [regShopData.user.id, regCustData.user.id] } });
  await mongoose.disconnect();
  console.log('✅ Cleanup complete.');

  console.log('\n================================================================');
  console.log(`🎉 ALL ${passed}/${total} PHASE 7 MASTER VERIFICATION TESTS PASSED!`);
  console.log('================================================================\n');
}

runMasterTest().catch((err) => {
  console.error('❌ Master Test Suite Failed:', err);
  process.exit(1);
});
