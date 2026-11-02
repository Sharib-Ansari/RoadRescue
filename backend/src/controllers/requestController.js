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
 * Update request status (e.g. mechanic accepts, on the way, arrives, completes)
 * PATCH /api/requests/:id/status
 */
export const updateRequestStatus = async (req, res, next) => {
  try {
    const { status, note, finalCharge } = req.body;

    const validStatuses = ['submitted', 'accepted', 'on_the_way', 'arrived', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return next(new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400));
    }

    const request = await ServiceRequest.findById(req.params.id);
    if (!request) {
      return next(new AppError('Service request not found', 404));
    }

    // If a mechanic accepts an unassigned request, assign them
    if (status === 'accepted' && req.user.role === 'mechanic') {
      request.mechanicId = req.user._id;
      request.mechanicName = req.user.name;
      request.workshopName = req.user.mechanicProfile?.workshopName || '';
    }

    request.status = status;
    if (finalCharge !== undefined) {
      request.finalCharge = Number(finalCharge);
    }

    request.statusHistory.push({
      status,
      timestamp: new Date(),
      note: note || `Status updated to ${status}`
    });

    await request.save();

    res.status(200).json({
      success: true,
      message: `Request status updated to ${status}`,
      request
    });
  } catch (error) {
    next(error);
  }
};
