import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'http://localhost:5000';

const getCookie = (res) => {
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) return null;
  const match = setCookie.match(/token=([^;]+)/) || setCookie.match(/roadrescue_token=([^;]+)/);
  return match ? `${match[0].split(';')[0]}` : null;
};

async function testStage2() {
  console.log('🧪 Starting Stage 2 Verification Suite (Product & Inventory APIs)...\n');
  const timestamp = Date.now();

  // 1. Create a genuine shop owner for this test
  const shopOwnerEmail = `stage2_shop_${timestamp}@roadrescue.test`;
  const shopRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Stage 2 Shop Owner',
      email: shopOwnerEmail,
      phone: '9876543220',
      password: 'password123',
      role: 'shop_owner',
      shopName: 'Supreme Auto Spares',
      shopAddress: 'Sector 18, Auto Hub',
      shopCity: 'Gurugram',
      shopPinCode: '122001',
      latitude: 28.4595,
      longitude: 77.0266,
      acceptsHomeDelivery: true,
      acceptsShopPickup: true,
      deliveryCharge: 70
    })
  });
  const shopData = await shopRes.json();
  if (!shopData.success) throw new Error(`Shop owner creation failed: ${JSON.stringify(shopData)}`);
  const shopCookie = getCookie(shopRes);
  const shopId = shopData.user.shop._id || shopData.user.shop.id;
  console.log('✅ 1. Test Shop Owner registered and Shop created:', shopData.user.shop.name);

  // 2. Create customer to verify role-based security
  const custEmail = `stage2_cust_${timestamp}@roadrescue.test`;
  const custRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Stage 2 Customer',
      email: custEmail,
      phone: '9876543221',
      password: 'password123',
      role: 'customer'
    })
  });
  const custData = await custRes.json();
  const custCookie = getCookie(custRes);
  console.log('✅ 2. Customer registered for authorization tests');

  // 3. Security test: Customer attempts to create product -> must return 403
  const forbiddenRes = await fetch(`${BASE_URL}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: custCookie },
    body: JSON.stringify({
      name: 'Illegal Product',
      SKU: 'ILLEGAL-01',
      price: 100,
      stockQuantity: 10
    })
  });
  if (forbiddenRes.status !== 403) {
    throw new Error(`Expected 403 Forbidden for customer creating product, got ${forbiddenRes.status}`);
  }
  console.log('✅ 3. Customer role-guard verified: 403 Forbidden correctly returned');

  // 4. Shop owner creates Product 1: Ceramic Brake Pads
  const sku1 = `BRK-${timestamp}`;
  const p1Res = await fetch(`${BASE_URL}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: shopCookie },
    body: JSON.stringify({
      name: 'Ceramic Front Brake Pads',
      category: 'Brakes',
      brand: 'Brembo',
      partNumber: 'BR-9844',
      SKU: sku1,
      price: 2450,
      stockQuantity: 12,
      description: 'High performance ceramic brake pads with low dust emission.',
      isAvailable: true
    })
  });
  const p1Data = await p1Res.json();
  if (!p1Data.success || p1Data.product.price !== 2450) {
    throw new Error(`Product 1 creation failed: ${JSON.stringify(p1Data)}`);
  }
  const product1Id = p1Data.product.id || p1Data.product._id;
  console.log(`✅ 4. Product 1 created: ${p1Data.product.name} (SKU: ${p1Data.product.SKU}, ₹${p1Data.product.price})`);

  // 5. Shop owner creates Product 2: Low Stock Battery
  const sku2 = `BAT-${timestamp}`;
  const p2Res = await fetch(`${BASE_URL}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: shopCookie },
    body: JSON.stringify({
      name: 'Amaron 12V 45Ah Car Battery',
      category: 'Batteries',
      brand: 'Amaron',
      SKU: sku2,
      price: 4800,
      stockQuantity: 3, // Low stock <= 5
      isAvailable: true
    })
  });
  const p2Data = await p2Res.json();
  if (!p2Data.success) throw new Error(`Product 2 creation failed: ${JSON.stringify(p2Data)}`);
  const product2Id = p2Data.product.id || p2Data.product._id;
  console.log(`✅ 5. Product 2 created: ${p2Data.product.name} (Stock: ${p2Data.product.stockQuantity})`);

  // 6. Test Compound Unique SKU Index within the same shop
  const duplicateRes = await fetch(`${BASE_URL}/api/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: shopCookie },
    body: JSON.stringify({
      name: 'Duplicate SKU Product',
      SKU: sku1, // Duplicate SKU
      price: 1500,
      stockQuantity: 5
    })
  });
  if (duplicateRes.status !== 409) {
    throw new Error(`Expected 409 Conflict for duplicate SKU, got ${duplicateRes.status}`);
  }
  console.log('✅ 6. Duplicate SKU correctly rejected with 409 Conflict');

  // 7. Get Shop Owner Products & Low Stock Filter
  const listRes = await fetch(`${BASE_URL}/api/products/my-products`, {
    headers: { Cookie: shopCookie }
  });
  const listData = await listRes.json();
  if (!listData.success || listData.products.length < 2) {
    throw new Error(`Failed to list shop products: ${JSON.stringify(listData)}`);
  }
  console.log(`✅ 7. GET /api/products/my-products returned ${listData.products.length} products`);

  const lowStockRes = await fetch(`${BASE_URL}/api/products/my-products?lowStock=1`, {
    headers: { Cookie: shopCookie }
  });
  const lowStockData = await lowStockRes.json();
  if (!lowStockData.success || !lowStockData.products.some((p) => p.SKU === sku2)) {
    throw new Error(`Low stock filter failed: ${JSON.stringify(lowStockData)}`);
  }
  console.log(`✅ 8. Low stock filter returned product with stock <= 5 correctly`);

  // 8. Update Product (e.g. price and stock)
  const updateRes = await fetch(`${BASE_URL}/api/products/${product1Id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: shopCookie },
    body: JSON.stringify({
      price: 2600,
      stockQuantity: 15
    })
  });
  const updateData = await updateRes.json();
  if (!updateData.success || updateData.product.price !== 2600 || updateData.product.stockQuantity !== 15) {
    throw new Error(`Product update failed: ${JSON.stringify(updateData)}`);
  }
  console.log('✅ 9. Product updated successfully: price updated to ₹2600 and stock to 15');

  // 9. Public Marketplace Product Catalog Query
  const publicRes = await fetch(`${BASE_URL}/api/products?search=Brembo`);
  const publicData = await publicRes.json();
  if (!publicData.success || !publicData.products.some((p) => p.SKU === sku1)) {
    throw new Error(`Public search failed: ${JSON.stringify(publicData)}`);
  }
  console.log('✅ 10. Public catalog search successfully found product by brand/name with populated shop');

  // 10. Delete / Archive Product Test
  const deleteRes = await fetch(`${BASE_URL}/api/products/${product2Id}`, {
    method: 'DELETE',
    headers: { Cookie: shopCookie }
  });
  const deleteData = await deleteRes.json();
  if (!deleteData.success) throw new Error(`Product delete failed: ${JSON.stringify(deleteData)}`);
  console.log('✅ 11. Product deletion / archival handled correctly');

  // Clean up
  console.log('\n🧹 Cleaning up test accounts and products...');
  const mongoose = (await import('mongoose')).default;
  await mongoose.connect(process.env.MONGODB_URI);
  const User = (await import('../src/models/User.js')).default;
  const Shop = (await import('../src/models/Shop.js')).default;
  const Product = (await import('../src/models/Product.js')).default;

  await Product.deleteMany({ shopId: { $in: [shopId] } });
  await Shop.deleteMany({ _id: { $in: [shopId] } });
  await User.deleteMany({ _id: { $in: [shopData.user.id, custData.user.id] } });
  await mongoose.disconnect();
  console.log('✅ Cleanup complete.');

  console.log('\n🎉 ALL STAGE 2 TESTS PASSED SUCCESSFULLY!\n');
}

testStage2().catch((err) => {
  console.error('❌ Stage 2 Test Failed:', err);
  process.exit(1);
});
