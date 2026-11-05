import ServiceRequest from '../models/ServiceRequest.js';
import User from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';
import { emitRequestStatusUpdate, emitNewServiceRequest } from '../socket/index.js';
import findServiceRequestByIdOrRequestId from '../utils/requestLookup.js';

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
      requestedMechanicId,
      vehicleId,
      vehicleName,
      vehicleReg,
      problemCategory,
      description,
      location,
      customerCoordinates,
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

    const targetMechanicId = requestedMechanicId || mechanicId;
    let targetMechanicName = '';
    let targetWorkshop = '';

    if (targetMechanicId) {
      const mech = await User.findById(targetMechanicId);
      if (mech) {
        targetMechanicName = mech.name;
        targetWorkshop = mech.mechanicProfile?.workshopName || '';
      }
    }

    const requestId = generateRequestId();
    const now = new Date();

    const newRequest = await ServiceRequest.create({
      requestId,
      customerId: req.user._id,
      requestedMechanicId: targetMechanicId || undefined,
      mechanicId: undefined, // Unassigned until the mechanic explicitly accepts
      mechanicName: targetMechanicName,
      workshopName: targetWorkshop,
      vehicleId: vehicleId || undefined,
      vehicleName,
      vehicleReg: vehicleReg || '',
      problemCategory,
      description: (description || '').trim(),
      location: (location || '').trim(),
      customerCoordinates: (customerCoordinates && typeof customerCoordinates.latitude === 'number' && typeof customerCoordinates.longitude === 'number')
        ? { latitude: customerCoordinates.latitude, longitude: customerCoordinates.longitude }
        : undefined,
      estimatedCharge: estimatedCharge ? Number(estimatedCharge) : 250,
      status: 'submitted',
      statusHistory: [
        {
          status: 'submitted',
          timestamp: now,
          note: targetMechanicName
            ? `Request dispatched specifically to ${targetMechanicName}`
            : 'Request created and broadcast to nearby network'
        }
      ]
    });

    // Real-time broadcast to available mechanics
    try {
      emitNewServiceRequest(newRequest);
    } catch (e) {
      console.warn('Socket dispatch warning:', e.message);
    }

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
      // Mechanic can see requests assigned to them OR pending open requests not rejected by them
      query = {
        $or: [
          { mechanicId: req.user._id },
          {
            status: 'submitted',
            rejectedBy: { $ne: req.user._id },
            $or: [
              { requestedMechanicId: req.user._id },
              { requestedMechanicId: { $exists: false } },
              { requestedMechanicId: null }
            ]
          }
        ]
      };
    }

    const requests = await ServiceRequest.find(query)
      .populate('customerId', 'name phone email')
      .populate('mechanicId', 'name phone email mechanicProfile')
      .populate('requestedMechanicId', 'name phone email mechanicProfile')
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
      status: { $nin: ['completed', 'cancelled', 'rejected'] }
    };

    if (req.user.role === 'customer') {
      query.customerId = req.user._id;
    } else if (req.user.role === 'mechanic') {
      query.mechanicId = req.user._id;
      query.status = { $nin: ['completed', 'cancelled', 'rejected'] };
    }

    const activeRequest = await ServiceRequest.findOne(query)
      .populate('customerId', 'name phone email')
      .populate('mechanicId', 'name phone email mechanicProfile')
      .populate('requestedMechanicId', 'name phone email mechanicProfile')
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
    const request = await findServiceRequestByIdOrRequestId(req.params.id, [
      { path: 'customerId', select: 'name phone email' },
      { path: 'mechanicId', select: 'name phone email mechanicProfile' },
      { path: 'requestedMechanicId', select: 'name phone email mechanicProfile' }
    ]);

    if (!request) {
      return next(new AppError('Service request not found', 404));
    }

    // Ensure only the involved customer or mechanic can view it
    const isCustomer = request.customerId?._id?.toString() === req.user._id.toString();
    const isAssignedMechanic = request.mechanicId?._id?.toString() === req.user._id.toString();
    const isRequestedMechanic = request.requestedMechanicId?._id?.toString() === req.user._id.toString();

    if (!isCustomer && !isAssignedMechanic && !isRequestedMechanic && req.user.role !== 'mechanic') {
      return next(new AppError('Access forbidden to this request', 403));
    }

    const reqJson = request.toJSON ? request.toJSON() : request;

    // If mechanicLastLocation is not explicitly saved on the request document,
    // convert and provide the assigned mechanic's real MongoDB GeoJSON profile location [lng, lat] -> { latitude, longitude }
    if (!reqJson.mechanicLastLocation && request.mechanicId?.mechanicProfile?.location?.coordinates?.length === 2) {
      const coords = request.mechanicId.mechanicProfile.location.coordinates;
      reqJson.mechanicLastLocation = {
        latitude: coords[1], // GeoJSON index 1 is latitude
        longitude: coords[0], // GeoJSON index 0 is longitude
        updatedAt: request.mechanicId.mechanicProfile.locationUpdatedAt || request.updatedAt
      };
    }

    res.status(200).json({
      success: true,
      request: reqJson
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
    const validStatuses = ['submitted', 'accepted', 'on_the_way', 'arrived', 'repair_in_progress', 'completed', 'cancelled', 'rejected'];
    if (!validStatuses.includes(targetStatus)) {
      return next(new AppError(`Invalid status. Must be one of: ${validStatuses.join(', ')}`, 400));
    }

    // Safe lookup supporting both MongoDB _id and human-readable requestId (e.g., RR-XXXXXX)
    const request = await findServiceRequestByIdOrRequestId(req.params.id);
    if (!request) {
      return next(new AppError('Service request not found', 404));
    }

    // Permission and ownership verification
    const isCustomerOwner = request.customerId.toString() === req.user._id.toString();
    const isAssignedMechanic = request.mechanicId && request.mechanicId.toString() === req.user._id.toString();
    const isRequestedMechanic = request.requestedMechanicId && request.requestedMechanicId.toString() === req.user._id.toString();

    if (req.user.role === 'customer') {
      if (!isCustomerOwner) {
        return next(new AppError('Unauthorized: You can only update your own service request', 403));
      }
      if (targetStatus !== 'cancelled') {
        return next(new AppError('Customers can only cancel a pending service request', 403));
      }
    } else if (req.user.role === 'mechanic') {
      // 1. Mechanic Accepts Request
      if (targetStatus === 'accepted') {
        // Prevent race condition: request must be submitted
        if (request.status !== 'submitted' && (!isAssignedMechanic || request.status === 'completed')) {
          return next(new AppError('This service request is no longer open for acceptance', 409));
        }

        // If targeted to someone else, reject
        if (request.requestedMechanicId && !isRequestedMechanic && !isAssignedMechanic) {
          return next(new AppError('This request was dispatched to another designated workshop', 403));
        }

        request.mechanicId = req.user._id;
        request.mechanicName = req.user.name;
        request.workshopName = req.user.mechanicProfile?.workshopName || 'Certified Workshop Partner';
      }
      // 2. Mechanic Rejects Request
      else if (targetStatus === 'rejected') {
        if (!request.rejectedBy) {
          request.rejectedBy = [];
        }
        if (!request.rejectedBy.some((id) => id.toString() === req.user._id.toString())) {
          request.rejectedBy.push(req.user._id);
        }

        // If this mechanic was assigned or targeted, release assignment
        if (isAssignedMechanic) {
          request.mechanicId = undefined;
        }
      }
      // 3. Active Milestones
      else if (['on_the_way', 'arrived', 'repair_in_progress', 'completed'].includes(targetStatus)) {
        if (!isAssignedMechanic) {
          return next(new AppError('Unauthorized: Only the assigned technician can update active milestones', 403));
        }
      }
    }

    request.status = targetStatus;
    if (finalCharge !== undefined) {
      request.finalCharge = Number(finalCharge);
    }

    request.statusHistory.push({
      status: targetStatus,
      timestamp: new Date(),
      note: note || (targetStatus === 'rejected'
        ? 'Mechanic declined the service request. You may select another nearby specialist.'
        : `Status updated to ${targetStatus} by ${req.user.name}`)
    });

    await request.save();

    // Broadcast status update via Socket.IO
    try {
      emitRequestStatusUpdate(request);
    } catch (e) {
      console.warn('Socket status broadcast warning:', e.message);
    }

    res.status(200).json({
      success: true,
      message: `Request status updated to ${targetStatus}`,
      request
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Re-dispatch request to a new mechanic after rejection or customer re-selection
 * PATCH /api/requests/:id/reassign
 */
export const reassignRequest = async (req, res, next) => {
  try {
    const { mechanicId } = req.body;
    if (!mechanicId) {
      return next(new AppError('New mechanicId is required for reassignment', 400));
    }

    const request = await findServiceRequestByIdOrRequestId(req.params.id);
    if (!request) {
      return next(new AppError('Service request not found', 404));
    }

    // Only customer owner can reassign
    if (request.customerId.toString() !== req.user._id.toString()) {
      return next(new AppError('Unauthorized: Only the request creator can reassign this ticket', 403));
    }

    if (['completed', 'cancelled'].includes(request.status)) {
      return next(new AppError('Cannot reassign a completed or cancelled request', 400));
    }

    const newMechanic = await User.findById(mechanicId);
    if (!newMechanic || newMechanic.role !== 'mechanic') {
      return next(new AppError('Selected mechanic not found', 404));
    }

    request.requestedMechanicId = newMechanic._id;
    request.mechanicId = undefined; // Unassigned until accepted
    request.mechanicName = newMechanic.name;
    request.workshopName = newMechanic.mechanicProfile?.workshopName || '';
    request.status = 'submitted';

    request.statusHistory.push({
      status: 'submitted',
      timestamp: new Date(),
      note: `Request re-assigned to ${newMechanic.name} by customer`
    });

    await request.save();

    try {
      emitNewServiceRequest(request);
      emitRequestStatusUpdate(request);
    } catch (e) {
      console.warn('Socket reassign broadcast warning:', e.message);
    }

    res.status(200).json({
      success: true,
      message: `Request successfully re-assigned to ${newMechanic.name}`,
      request
    });
  } catch (error) {
    next(error);
  }
};
