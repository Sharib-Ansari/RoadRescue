import ServiceRequest from '../models/ServiceRequest.js';
import User from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';

// Helper to generate a human-readable request ID
const generateRequestId = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let rand = '';
  for (let i = 0; i < 4; i++) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `RR-${Date.now().toString().slice(-6)}-${rand}`;
};

/**
 * Create a new roadside service request
 * POST /api/requests
 */
export const createRequest = async (req, res, next) => {
  try {
    const {
      mechanicId,
      vehicleId,
      vehicleName,
      vehicleReg,
      problemCategory,
      description,
      location,
      estimatedCharge
    } = req.body;

    if (!vehicleName) {
      return next(new AppError('Vehicle name is required', 400));
    }
    if (!problemCategory) {
      return next(new AppError('Problem category is required', 400));
    }
    if (!location) {
      return next(new AppError('Location is required', 400));
    }

    let assignedMechanicName = '';
    let assignedWorkshop = '';

    if (mechanicId) {
      const mech = await User.findById(mechanicId);
      if (mech) {
        assignedMechanicName = mech.name;
        assignedWorkshop = mech.mechanicProfile?.workshopName || '';
      }
    }

    const requestId = generateRequestId();
    const now = new Date();

    const newRequest = await ServiceRequest.create({
      requestId,
      customerId: req.user._id,
      mechanicId: mechanicId || undefined,
      mechanicName: assignedMechanicName,
      workshopName: assignedWorkshop,
      vehicleId: vehicleId || undefined,
      vehicleName,
      vehicleReg: vehicleReg || '',
      problemCategory,
      description: (description || '').trim(),
      location: (location || '').trim(),
      estimatedCharge: estimatedCharge ? Number(estimatedCharge) : 250,
      status: 'submitted',
      statusHistory: [
        {
          status: 'submitted',
          timestamp: now,
          note: 'Request created and dispatched'
        }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Service request submitted successfully',
      request: newRequest
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all requests relevant to the user (customer or mechanic)
 * GET /api/requests
 */
export const getMyRequests = async (req, res, next) => {
  try {
    let query = {};

    if (req.user.role === 'customer') {
      query = { customerId: req.user._id };
    } else if (req.user.role === 'mechanic') {
      // Mechanic can see requests specifically assigned to them OR pending open requests
      query = {
        $or: [
          { mechanicId: req.user._id },
          { mechanicId: { $exists: false }, status: 'submitted' },
          { mechanicId: null, status: 'submitted' }
        ]
      };
    }

    const requests = await ServiceRequest.find(query)
      .populate('customerId', 'name phone email')
      .populate('mechanicId', 'name phone email mechanicProfile')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get the current active ongoing service request
 * GET /api/requests/active
 */
export const getActiveRequest = async (req, res, next) => {
  try {
    let query = {
      status: { $nin: ['completed', 'cancelled'] }
    };

    if (req.user.role === 'customer') {
      query.customerId = req.user._id;
    } else if (req.user.role === 'mechanic') {
      query.mechanicId = req.user._id;
    }

    const activeRequest = await ServiceRequest.findOne(query)
      .populate('customerId', 'name phone email')
      .populate('mechanicId', 'name phone email mechanicProfile')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      hasActiveRequest: Boolean(activeRequest),
      request: activeRequest || null
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a specific service request by ID
 * GET /api/requests/:id
 */
export const getRequestById = async (req, res, next) => {
  try {
    const request = await ServiceRequest.findById(req.params.id)
      .populate('customerId', 'name phone email')
      .populate('mechanicId', 'name phone email mechanicProfile');

    if (!request) {
      return next(new AppError('Service request not found', 404));
    }

    // Ensure only the involved customer or mechanic can view it
    const isCustomer = request.customerId?._id?.toString() === req.user._id.toString();
    const isMechanic = request.mechanicId?._id?.toString() === req.user._id.toString();

    if (!isCustomer && !isMechanic && req.user.role !== 'mechanic') {
      return next(new AppError('Access forbidden to this request', 403));
    }

    res.status(200).json({
      success: true,
      request
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update request status (e.g. mechanic accepts, on the way, arrives, completes, rejects)
 * PATCH /api/requests/:id/status
 */
export const updateRequestStatus = async (req, res, next) => {
  try {
    const { status, note, finalCharge } = req.body;

    // Normalize incoming status from frontend (handles spaces/casing)
    const normalizeStatus = (s) => {
      if (!s) return '';
      const lower = s.toLowerCase().replace(/\s+/g, '_');
      if (lower === 'on_the_way' || lower === 'ontheway') return 'on_the_way';
      if (lower === 'repair_in_progress' || lower === 'repairinprogress') return 'repair_in_progress';
      return lower;
    };

    const targetStatus = normalizeStatus(status);
    const validStatuses = ['submitted', 'accepted', 'on_the_way', 'arrived', 'repair_in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(targetStatus)) {
      return next(new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400));
    }

    // Support lookup by MongoDB _id or human-readable requestId (e.g., RR-XXXXXX)
    const query = req.params.id.startsWith('RR-')
      ? { requestId: req.params.id }
      : { _id: req.params.id };

    const request = await ServiceRequest.findOne(query);
    if (!request) {
      return next(new AppError('Service request not found', 404));
    }

    // Permission and ownership verification
    const isCustomerOwner = request.customerId.toString() === req.user._id.toString();
    const isAssignedMechanic = request.mechanicId && request.mechanicId.toString() === req.user._id.toString();

    if (req.user.role === 'customer') {
      if (!isCustomerOwner) {
        return next(new AppError('Unauthorized: You can only update your own service request', 403));
      }
      if (targetStatus !== 'cancelled') {
        return next(new AppError('Customers can only cancel a pending service request', 403));
      }
    } else if (req.user.role === 'mechanic') {
      // Mechanic can accept an open request, or manage a request already assigned to them
      if (!isAssignedMechanic && request.status !== 'submitted' && targetStatus !== 'accepted') {
        return next(new AppError('Unauthorized: This request is assigned to another mechanic', 403));
      }

      // If a mechanic accepts an unassigned request, assign them
      if (targetStatus === 'accepted') {
        request.mechanicId = req.user._id;
        request.mechanicName = req.user.name;
        request.workshopName = req.user.mechanicProfile?.workshopName || 'Certified Workshop Partner';
      }
    }

    request.status = targetStatus;
    if (finalCharge !== undefined) {
      request.finalCharge = Number(finalCharge);
    }

    request.statusHistory.push({
      status: targetStatus,
      timestamp: new Date(),
      note: note || `Status updated to ${targetStatus} by ${req.user.name}`
    });

    await request.save();

    res.status(200).json({
      success: true,
      message: `Request status updated to ${targetStatus}`,
      request
    });
  } catch (error) {
    next(error);
  }
};
