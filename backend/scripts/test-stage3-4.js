import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'http://localhost:5000';

const getCookie = (res) => {
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) return null;
  const match = setCookie.match(/token=([^;]+)/) || setCookie.match(/roadrescue_token=([^;]+)/);
  return match ? `${match[0].split(';')[0]}` : null;
};

async function testStage34() {
  console.log('🧪 Starting Stage 3 & 4 Verification Suite (Orders, Cart & Transactional Stock)...\n');
  const timestamp = Date.now();

  // 1. Register Shop Owner A
  const shopEmailA = `shopA_${timestamp}@roadrescue.test`;
  const shopResA = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Alpha Spares Owner',
      email: shopEmailA,
      phone: '9876543230',
      password: 'password123',
      role: 'shop_owner',
      shopName: 'Alpha Auto Spares',
      shopAddress: 'Road 4, Okhla Phase 2',
      shopCity: 'New Delhi',
      shopPinCode: '110020',
      latitude: 28.5355,
      longitude: 77.2687,
      acceptsHomeDelivery: true,
      acceptsShopPickup: true,
      deliveryCharge: 80
    })
  });
  const shopDataA = await shopResA.json();
  const shopCookieA = getCookie(shopResA);
  const shopIdA = shopDataA.user.shop._id || shopDataA.user.shop.id;
  console.log('✅ 1. Shop A created:', shopDataA.user.shop.name);

  // 2. Register Customer
  const custEmail = `cust_${timestamp}@roadrescue.test`;
  const custRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Order Test Customer',
      email: custEmail,
      phone: '9876543231',
      password: 'password123',
      role: 'customer'
    })
  });
  const custData = await custRes.json();
  const custCookie = getCookie(custRes);
  console.log('✅ 2. Customer created:', custData.user.name);

  // 3. Shop A creates a product with initial stock = 5
  const prodRes = await fetch(`${BASE_URL}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: shopCookieA },
    body: JSON.stringify({
      name: 'Exide Car Battery 12V',
      category: 'Batteries',
      brand: 'Exide',
      SKU: `BAT-${timestamp}`,
      price: 5200,
      stockQuantity: 5,
      isAvailable: true
    })
  });
  const prodData = await prodRes.json();
  const prodId = prodData.product._id || prodData.product.id;
  console.log(`✅ 3. Product created with stock = 5 at ₹5200`);

  // 4. Test Insufficient Stock Transactional Rollback: Customer tries to order quantity 10 (exceeds stock 5)
  const failOrderRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: custCookie },
    body: JSON.stringify({
      shopId: shopIdA,
      fulfillmentMethod: 'home_delivery',
      items: [{ productId: prodId, quantity: 10 }],
      deliveryAddress: {
        street: 'Connaught Place',
        city: 'New Delhi',
        pinCode: '110001',
        contactPhone: '9876543231'
      }
    })
  });
  const failOrderData = await failOrderRes.json();
  if (failOrderRes.status !== 400) {
    throw new Error(`Expected 400 for stock shortage, got ${failOrderRes.status}`);
  }
  console.log('✅ 4. Insufficient stock rejected with 400:', failOrderData.message);

  // Verify stock remained intact at 5
  const checkProdRes = await fetch(`${BASE_URL}/api/products/${prodId}`);
  const checkProdData = await checkProdRes.json();
  if (checkProdData.product.stockQuantity !== 5) {
    throw new Error(`Stock rolled back incorrectly: ${checkProdData.product.stockQuantity} != 5`);
  }
  console.log('✅ 5. Stock verification after rollback confirmed stock is still 5');

  // 5. Place Home Delivery Order: Customer orders quantity 2
  const successOrderRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: custCookie },
    body: JSON.stringify({
      shopId: shopIdA,
      fulfillmentMethod: 'home_delivery',
      items: [{ productId: prodId, quantity: 2 }],
      deliveryAddress: {
        street: 'Block B, Connaught Place',
        city: 'New Delhi',
        pinCode: '110001',
        contactPhone: '9876543231'
      }
    })
  });
  const successOrderData = await successOrderRes.json();
  if (!successOrderData.success || !successOrderData.order) {
    throw new Error(`Order placement failed: ${JSON.stringify(successOrderData)}`);
  }
  const order = successOrderData.order;
  const orderId = order._id || order.id;

  // Expected subtotal: 2 * 5200 = 10400. Delivery fee: 80. Total: 10480.
  if (order.subtotal !== 10400 || order.deliveryCharge !== 80 || order.totalAmount !== 10480) {
    throw new Error(`Order calculation error: subtotal=${order.subtotal}, deliv=${order.deliveryCharge}, total=${order.totalAmount}`);
  }
  console.log(`✅ 6. Home Delivery order placed successfully:`);
  console.log(`   - Order Number: ${order.orderNumber}`);
  console.log(`   - Subtotal: ₹${order.subtotal}, Delivery: ₹${order.deliveryCharge}, Total: ₹${order.totalAmount}`);

  // Verify stock was decremented to 3
  const afterStockRes = await fetch(`${BASE_URL}/api/products/${prodId}`);
  const afterStockData = await afterStockRes.json();
  if (afterStockData.product.stockQuantity !== 3) {
    throw new Error(`Stock did not decrement to 3: got ${afterStockData.product.stockQuantity}`);
  }
  console.log('✅ 7. Stock successfully decremented to 3 in MongoDB');

  // 6. Test Shop Pickup Order (Delivery charge must be ₹0)
  const pickupOrderRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: custCookie },
    body: JSON.stringify({
      shopId: shopIdA,
      fulfillmentMethod: 'shop_pickup',
      items: [{ productId: prodId, quantity: 1 }]
    })
  });
  const pickupOrderData = await pickupOrderRes.json();
  if (!pickupOrderData.success || pickupOrderData.order.deliveryCharge !== 0) {
    throw new Error(`Shop pickup order delivery charge must be 0, got ${pickupOrderData.order.deliveryCharge}`);
  }
  console.log(`✅ 8. Shop Pickup order placed with delivery charge = ₹0: ${pickupOrderData.order.orderNumber}`);

  // 7. Get Customer Orders
  const myOrdersRes = await fetch(`${BASE_URL}/api/orders/my-orders`, {
    headers: { Cookie: custCookie }
  });
  const myOrdersData = await myOrdersRes.json();
  if (!myOrdersData.success || myOrdersData.orders.length < 2) {
    throw new Error(`GET /api/orders/my-orders failed: ${JSON.stringify(myOrdersData)}`);
  }
  console.log(`✅ 9. GET /api/orders/my-orders returned ${myOrdersData.orders.length} orders for customer`);

  // 8. Order Status Workflow: Shop Owner confirms and prepares order
  const confirmRes = await fetch(`${BASE_URL}/api/orders/${orderId}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: shopCookieA },
    body: JSON.stringify({ status: 'confirmed', notes: 'Parts verified and reserved' })
  });
  const confirmData = await confirmRes.json();
  if (!confirmData.success || confirmData.order.orderStatus !== 'confirmed') {
    throw new Error(`Failed to confirm order: ${JSON.stringify(confirmData)}`);
  }
  console.log('✅ 10. Order status transitioned to "confirmed"');

  // 9. Order Cancellation & Stock Restoration Guard:
  // Cancel the pickup order (which used 1 item) and verify that 1 item is restored to stock
  const cancelRes = await fetch(`${BASE_URL}/api/orders/${pickupOrderData.order._id || pickupOrderData.order.id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Cookie: shopCookieA },
    body: JSON.stringify({ status: 'cancelled', reason: 'Customer requested cancellation' })
  });
  const cancelData = await cancelRes.json();
  if (!cancelData.success || !cancelData.order.inventoryRestored) {
    throw new Error(`Cancellation failed or inventoryRestored was not true: ${JSON.stringify(cancelData)}`);
  }
  console.log('✅ 11. Order cancelled and inventoryRestored flag set to true');

  // Stock before was 2, now with 1 restored it should be 3
  const restoredStockRes = await fetch(`${BASE_URL}/api/products/${prodId}`);
  const restoredStockData = await restoredStockRes.json();
  if (restoredStockData.product.stockQuantity !== 3) {
    throw new Error(`Expected restored stock 3, got ${restoredStockData.product.stockQuantity}`);
  }
  console.log('✅ 12. Atomic stock restoration verified: stock restored back to 3');

  // Clean up
  console.log('\n🧹 Cleaning up test accounts and orders...');
  const mongoose = (await import('mongoose')).default;
  await mongoose.connect(process.env.MONGODB_URI);
  const User = (await import('../src/models/User.js')).default;
  const Shop = (await import('../src/models/Shop.js')).default;
  const Product = (await import('../src/models/Product.js')).default;
  const Order = (await import('../src/models/Order.js')).default;

  await Order.deleteMany({ customerId: custData.user.id });
  await Product.deleteMany({ shopId: shopIdA });
  await Shop.deleteMany({ _id: shopIdA });
  await User.deleteMany({ _id: { $in: [shopDataA.user.id, custData.user.id] } });
  await mongoose.disconnect();
  console.log('✅ Cleanup complete.');

  console.log('\n🎉 ALL STAGE 3 & 4 TESTS PASSED SUCCESSFULLY!\n');
}

testStage34().catch((err) => {
  console.error('❌ Stage 3-4 Test Failed:', err);
  process.exit(1);
});
