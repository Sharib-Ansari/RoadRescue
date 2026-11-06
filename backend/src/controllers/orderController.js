import Order from '../models/Order.js';
import Product from '../models/Product.js';
import Shop from '../models/Shop.js';
import User from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';
import mongoose from 'mongoose';

/**
 * Helper to generate order numbers
 */
const generateOrderNumber = () => {
  const ts = Date.now().toString().slice(-6);
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RR-ORD-${ts}-${rand}`;
};

/**
 * Place a new spare parts order with atomic stock deduction and rollback
 * POST /api/orders
 */
export const createOrder = async (req, res, next) => {
  const session = await mongoose.startSession();
  let transactionStarted = false;

  try {
    const {
      shopId,
      items,
      fulfillmentMethod,
      deliveryAddress
    } = req.body;

    // 1. Basic validation
    if (!shopId) {
      throw new AppError('Fulfilling shop ID is required', 400);
    }
    if (!Array.isArray(items) || items.length === 0) {
      throw new AppError('Order must contain at least one item', 400);
    }
    if (!['home_delivery', 'shop_pickup'].includes(fulfillmentMethod)) {
      throw new AppError('Fulfillment method must be either "home_delivery" or "shop_pickup"', 400);
    }

    // 2. Fetch and validate fulfilling shop
    const shop = await Shop.findById(shopId);
    if (!shop) {
      throw new AppError('Fulfilling shop not found', 404);
    }
    if (!shop.isActive) {
      throw new AppError('This shop is currently inactive and cannot accept orders', 400);
    }

    if (fulfillmentMethod === 'home_delivery' && !shop.acceptsHomeDelivery) {
      throw new AppError(`Shop "${shop.name}" does not offer Home Delivery. Please choose Shop Pickup.`, 400);
    }
    if (fulfillmentMethod === 'shop_pickup' && !shop.acceptsShopPickup) {
      throw new AppError(`Shop "${shop.name}" does not offer Shop Pickup. Please choose Home Delivery.`, 400);
    }

    // 3. Validate delivery address if Home Delivery
    let validatedDeliveryAddress = undefined;
    if (fulfillmentMethod === 'home_delivery') {
      const street = (deliveryAddress?.street || '').trim();
      const city = (deliveryAddress?.city || '').trim();
      const pinCode = (deliveryAddress?.pinCode || '').trim();
      const contactPhone = (deliveryAddress?.contactPhone || req.user.phone || '').trim();

      if (!street) throw new AppError('Delivery street address is required for Home Delivery', 400);
      if (!city) throw new AppError('Delivery city is required for Home Delivery', 400);
      if (!pinCode) throw new AppError('PIN code is required for Home Delivery', 400);
      if (!contactPhone) throw new AppError('Contact phone number is required for Home Delivery', 400);

      validatedDeliveryAddress = {
        street,
        city,
        pinCode,
        contactPhone,
        notes: (deliveryAddress?.notes || '').trim()
      };
    }

    const pickupDetails = fulfillmentMethod === 'shop_pickup' ? {
      shopAddress: shop.address,
      shopCity: shop.city,
      shopPinCode: shop.pinCode,
      shopPhone: shop.phone || '',
      instructions: 'Please present your Order Number and phone number at the counter for pickup.'
    } : undefined;

    // 4. Start Transaction for atomic inventory deduction
    try {
      session.startTransaction();
      transactionStarted = true;
    } catch (tErr) {
      transactionStarted = false;
    }

    const sessionOpt = transactionStarted ? { session } : {};

    const orderItems = [];
    let calculatedSubtotal = 0;

    // 5. Verify every product, check stock, and decrement atomically
    for (const item of items) {
      const prodId = item.productId || item.id || item._id;
      const reqQty = Math.floor(Number(item.quantity));

      if (!prodId) {
        throw new AppError('Product ID is missing for an item in the cart', 400);
      }
      if (!reqQty || reqQty < 1) {
        throw new AppError('Item quantity must be at least 1', 400);
      }

      // Find product in DB
      const product = await Product.findById(prodId).session(sessionOpt.session || null);
      if (!product) {
        throw new AppError(`Product "${item.name || prodId}" no longer exists`, 404);
      }

      // Enforce single-shop: product must belong to the shop
      if (product.shopId.toString() !== shop._id.toString()) {
        throw new AppError(`Product "${product.name}" belongs to a different shop. Single-shop order rule violated.`, 400);
      }

      if (!product.isAvailable || product.isArchived) {
        throw new AppError(`Product "${product.name}" is currently not available for purchase`, 400);
      }

      // Check stock availability
      if (product.stockQuantity < reqQty) {
        throw new AppError(
          `Insufficient stock for "${product.name}". Available stock: ${product.stockQuantity}, Requested: ${reqQty}`,
          400
        );
      }

      // Atomic stock deduction
      const updatedProduct = await Product.findOneAndUpdate(
        { _id: product._id, stockQuantity: { $gte: reqQty } },
        { $inc: { stockQuantity: -reqQty } },
        { new: true, ...sessionOpt }
      );

      if (!updatedProduct) {
        throw new AppError(
          `Stock changed concurrently for "${product.name}". Only ${product.stockQuantity} items remaining.`,
          409
        );
      }

      // Compute line total using genuine DB price (server-authoritative)
      const unitPrice = product.price;
      const lineTotal = unitPrice * reqQty;
      calculatedSubtotal += lineTotal;

      orderItems.push({
        productId: product._id,
        productName: product.name,
        brand: product.brand,
        SKU: product.SKU,
        unitPrice,
        quantity: reqQty,
        lineTotal
      });
    }

    // 6. Calculate delivery fee and total
    const deliveryCharge = fulfillmentMethod === 'home_delivery' ? (shop.deliveryCharge || 0) : 0;
    const totalAmount = calculatedSubtotal + deliveryCharge;
    const orderNumber = generateOrderNumber();

    // 7. Create Order document
    const [newOrder] = await Order.create(
      [
        {
          orderNumber,
          customerId: req.user._id,
          shopId: shop._id,
          items: orderItems,
          subtotal: calculatedSubtotal,
          deliveryCharge,
          totalAmount,
          fulfillmentMethod,
          deliveryAddress: validatedDeliveryAddress,
          pickupDetails,
          orderStatus: 'placed',
          paymentStatus: 'pending',
          paymentMethod: fulfillmentMethod === 'home_delivery' ? 'cash_on_delivery' : 'pay_at_shop',
          inventoryRestored: false,
          statusHistory: [
            {
              status: 'placed',
              timestamp: new Date(),
              note: `Order placed via ${fulfillmentMethod === 'home_delivery' ? 'Home Delivery' : 'Shop Pickup'}`
            }
          ]
        }
      ],
      sessionOpt
    );

    if (transactionStarted) {
      await session.commitTransaction();
    }

    res.status(201).json({
      success: true,
      message: 'Order placed successfully',
      order: newOrder
    });
  } catch (err) {
    if (transactionStarted) {
      await session.abortTransaction();
    }
    next(err);
  } finally {
    session.endSession();
  }
};

/**
 * Get authenticated customer's orders
 * GET /api/orders/my-orders
 */
export const getMyOrders = async (req, res, next) => {
  try {
    const { status, limit = 50 } = req.query;
    const filter = { customerId: req.user._id };

    if (status && status !== 'all') {
      filter.orderStatus = status;
    }

    const orders = await Order.find(filter)
      .populate('shopId', 'name address city pinCode phone deliveryCharge')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10));

    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get single order by ID or orderNumber (accessible by customer or shop owner)
 * GET /api/orders/:id
 */
export const getOrderById = async (req, res, next) => {
  try {
    const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
    const query = isObjectId ? { _id: req.params.id } : { orderNumber: req.params.id.toUpperCase() };

    const order = await Order.findOne(query)
      .populate('shopId', 'name address city pinCode phone deliveryCharge location')
      .populate('customerId', 'name email phone');

    if (!order) {
      return next(new AppError('Order not found', 404));
    }

    // Access control: requester must be either the customer who placed it OR the shop owner
    const isCustomer = order.customerId._id.toString() === req.user._id.toString();
    let isShopOwner = false;

    if (!isCustomer) {
      const shop = await Shop.findOne({ _id: order.shopId._id, owner: req.user._id });
      if (shop) isShopOwner = true;
    }

    if (!isCustomer && !isShopOwner) {
      return next(new AppError('You do not have permission to view this order', 403));
    }

    res.status(200).json({
      success: true,
      order
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get orders for authenticated shop owner
 * GET /api/orders/shop-orders
 */
export const getShopOrders = async (req, res, next) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
      return next(new AppError('No shop found for this account', 404));
    }

    const { status, fulfillmentMethod, search } = req.query;
    const filter = { shopId: shop._id };

    if (status && status !== 'all') {
      filter.orderStatus = status;
    }
    if (fulfillmentMethod && fulfillmentMethod !== 'all') {
      filter.fulfillmentMethod = fulfillmentMethod;
    }
    if (search) {
      filter.orderNumber = new RegExp(search.trim(), 'i');
    }

    const orders = await Order.find(filter)
      .populate('customerId', 'name email phone')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: orders.length,
      orders
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update order status workflow
 * PATCH /api/orders/:id/status
 */
export const updateOrderStatus = async (req, res, next) => {
  const session = await mongoose.startSession();
  let transactionStarted = false;

  try {
    const { status, notes, reason } = req.body;
    if (!status) {
      throw new AppError('New order status is required', 400);
    }

    const validStatuses = [
      'placed',
      'confirmed',
      'preparing',
      'out_for_delivery',
      'ready_for_pickup',
      'completed',
      'cancelled'
    ];
    if (!validStatuses.includes(status)) {
      throw new AppError(`Invalid status: ${status}`, 400);
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Verify shop ownership or customer cancellation
    const shop = await Shop.findOne({ _id: order.shopId, owner: req.user._id });
    const isCustomer = order.customerId.toString() === req.user._id.toString();

    if (!shop && !isCustomer) {
      throw new AppError('You are not authorized to update this order', 403);
    }

    // Customer can only cancel their own order if it is in 'placed' status
    if (isCustomer && !shop) {
      if (status !== 'cancelled') {
        throw new AppError('Customers can only cancel pending orders', 403);
      }
      if (order.orderStatus !== 'placed') {
        throw new AppError('Order has already been confirmed or processed and cannot be cancelled by customer', 400);
      }
    }

    // Never allow cancelling an order that is already completed
    if (order.orderStatus === 'completed' && status === 'cancelled') {
      throw new AppError('Cannot cancel an order that has already been delivered or completed', 400);
    }

    // Start transaction if cancellation requires stock restoration
    try {
      session.startTransaction();
      transactionStarted = true;
    } catch (tErr) {
      transactionStarted = false;
    }
    const sessionOpt = transactionStarted ? { session } : {};

    // If order is being cancelled and inventory has NOT been restored yet, restore stock atomically!
    if (status === 'cancelled' && !order.inventoryRestored) {
      for (const item of order.items) {
        await Product.updateOne(
          { _id: item.productId },
          { $inc: { stockQuantity: item.quantity } },
          sessionOpt
        );
      }
      order.inventoryRestored = true;
      order.cancellationReason = (reason || notes || 'Order cancelled').trim();
    }

    order.orderStatus = status;
    order.statusHistory.push({
      status,
      timestamp: new Date(),
      note: (notes || reason || `Status updated to ${status}`).trim()
    });

    await order.save(sessionOpt);

    if (transactionStarted) {
      await session.commitTransaction();
    }

    res.status(200).json({
      success: true,
      message: `Order status updated to ${status}`,
      order
    });
  } catch (err) {
    if (transactionStarted) {
      await session.abortTransaction();
    }
    next(err);
  } finally {
    session.endSession();
  }
};

/**
 * Get shop owner dashboard live statistics
 * GET /api/orders/shop-stats
 */
export const getShopDashboardStats = async (req, res, next) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
      return next(new AppError('No shop found for this account', 404));
    }

    // Product counts
    const [totalProducts, activeProducts, lowStockProducts] = await Promise.all([
      Product.countDocuments({ shopId: shop._id, isArchived: false }),
      Product.countDocuments({ shopId: shop._id, isArchived: false, isAvailable: true }),
      Product.countDocuments({ shopId: shop._id, isArchived: false, stockQuantity: { $lte: 5 } })
    ]);

    // Order counts and revenue
    const [totalOrders, pendingOrders, completedOrders, cancelledOrders, recentOrders] = await Promise.all([
      Order.countDocuments({ shopId: shop._id }),
      Order.countDocuments({ shopId: shop._id, orderStatus: { $in: ['placed', 'confirmed', 'preparing', 'out_for_delivery', 'ready_for_pickup'] } }),
      Order.countDocuments({ shopId: shop._id, orderStatus: 'completed' }),
      Order.countDocuments({ shopId: shop._id, orderStatus: 'cancelled' }),
      Order.find({ shopId: shop._id })
        .populate('customerId', 'name email phone')
        .sort({ createdAt: -1 })
        .limit(6)
    ]);

    // Calculate revenue from completed orders
    const revenueAgg = await Order.aggregate([
      { $match: { shopId: shop._id, orderStatus: 'completed' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].totalRevenue : 0;

    res.status(200).json({
      success: true,
      shop: {
        id: shop._id,
        name: shop.name,
        city: shop.city,
        acceptsHomeDelivery: shop.acceptsHomeDelivery,
        acceptsShopPickup: shop.acceptsShopPickup,
        deliveryCharge: shop.deliveryCharge,
        isActive: shop.isActive
      },
      stats: {
        totalProducts,
        activeProducts,
        lowStockProducts,
        totalOrders,
        pendingOrders,
        completedOrders,
        cancelledOrders,
        totalRevenue
      },
      recentOrders
    });
  } catch (err) {
    next(err);
  }
};
