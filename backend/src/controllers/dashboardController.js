import mongoose from 'mongoose';
import Vehicle from '../models/Vehicle.js';
import ServiceRequest from '../models/ServiceRequest.js';
import Order from '../models/Order.js';

/**
 * GET /api/customer/dashboard
 * Returns real aggregated stats for the logged-in customer.
 *
 * Response shape:
 * {
 *   status: 'success',
 *   data: {
 *     totalVehicles: Number,
 *     activeRequests: Number,
 *     completedAssistance: Number,
 *     totalOrders: Number,
 *     recentOrders: Array<OrderSummary>
 *   }
 * }
 */
export const getCustomerDashboard = async (req, res, next) => {
  try {
    // Always use req.user.id — never trust a client-supplied ID
    const userId = req.user._id || req.user.id;
    const userObjId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;

    const ACTIVE_STATUSES = ['submitted', 'accepted', 'on_the_way', 'arrived', 'repair_in_progress'];

    // Run all queries in parallel for minimum latency
    const [
      totalVehicles,
      activeRequests,
      completedAssistance,
      totalOrders,
      recentOrders
    ] = await Promise.all([
      Vehicle.countDocuments({ userId: userObjId }),

      ServiceRequest.countDocuments({
        customerId: userObjId,
        status: { $in: ACTIVE_STATUSES }
      }),

      ServiceRequest.countDocuments({
        customerId: userObjId,
        status: 'completed'
      }),

      Order.countDocuments({ customerId: userObjId }),

      // Last 5 orders with shop name populated
      Order.find({ customerId: userObjId })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('shopId', 'name city')
        .select('orderNumber orderStatus totalAmount createdAt fulfillmentMethod shopId')
        .lean()
    ]);

    // Normalize orders: replace populated shopId object with clean fields
    const normalizedOrders = recentOrders.map((o) => ({
      id: o._id.toString(),
      orderNumber: o.orderNumber,
      orderStatus: o.orderStatus,
      totalAmount: o.totalAmount,
      fulfillmentMethod: o.fulfillmentMethod,
      shopName: o.shopId?.name || 'Shop',
      shopCity: o.shopId?.city || '',
      createdAt: o.createdAt
    }));

    return res.status(200).json({
      status: 'success',
      data: {
        totalVehicles,
        activeRequests,
        completedAssistance,
        totalOrders,
        recentOrders: normalizedOrders
      }
    });
  } catch (err) {
    next(err);
  }
};
