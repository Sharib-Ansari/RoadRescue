import { Server } from 'socket.io';
import { verifyToken, COOKIE_NAME } from '../utils/jwt.js';
import User from '../models/User.js';
import ServiceRequest from '../models/ServiceRequest.js';
import findServiceRequestByIdOrRequestId from '../utils/requestLookup.js';

let io = null;

// Parse cookie string into key-value map
const parseCookies = (cookieHeader) => {
  const cookies = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    if (parts.length >= 2) {
      const name = parts[0].trim();
      const value = parts.slice(1).join('=').trim();
      cookies[name] = decodeURIComponent(value);
    }
  });
  return cookies;
};

/**
 * Initialize Socket.IO with HTTP server
 */
export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true,
      methods: ['GET', 'POST']
    },
    pingTimeout: 30000,
    pingInterval: 25000
  });

  // Socket Authentication Middleware
  io.use(async (socket, next) => {
    try {
      let token = null;

      // 1. Check cookies from handshake headers
      const cookieHeader = socket.request.headers.cookie;
      const cookies = parseCookies(cookieHeader);
      if (cookies[COOKIE_NAME]) {
        token = cookies[COOKIE_NAME];
      } else if (cookies.roadrescue_token) {
        token = cookies.roadrescue_token;
      }

      // 2. Check auth object from handshake (fallback for mobile/custom clients)
      if (!token && socket.handshake.auth && socket.handshake.auth.token) {
        token = socket.handshake.auth.token;
      }

      // 3. Check authorization header (Bearer)
      if (!token && socket.handshake.headers && socket.handshake.headers.authorization) {
        const authHeader = socket.handshake.headers.authorization;
        if (authHeader.startsWith('Bearer ')) {
          token = authHeader.split(' ')[1];
        }
      }

      if (!token) {
        return next(new Error('Authentication required for real-time tracking'));
      }

      // Verify JWT
      let decoded;
      try {
        decoded = verifyToken(token);
      } catch (err) {
        return next(new Error('Invalid or expired authentication token'));
      }

      // Load user
      const user = await User.findById(decoded.sub);
      if (!user || !user.isActive) {
        return next(new Error('User account not found or deactivated'));
      }

      // Attach user to socket
      socket.user = {
        id: user._id.toString(),
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        mechanicProfile: user.mechanicProfile
      };

      next();
    } catch (error) {
      next(new Error('Socket authentication failed'));
    }
  });

  // Connection Handler
  io.on('connection', (socket) => {
    const user = socket.user;
    const userId = user.id;

    // Join user's private notification channel
    socket.join(`user:${userId}`);

    // If mechanic, join general active mechanics broadcast room
    if (user.role === 'mechanic') {
      socket.join('mechanics:active');
    }

    // Rate-limiting tracker for location emissions
    socket.lastLocationEmission = 0;

    /**
     * Join private request tracking room with ownership verification
     */
    socket.on('join:request', async (data, callback) => {
      try {
        const requestId = typeof data === 'string' ? data : data?.requestId;
        if (!requestId) {
          if (callback) callback({ error: 'requestId is required' });
          return;
        }

        // Find service request by either MongoDB _id or human RR-XXXXX ID safely
        const request = await findServiceRequestByIdOrRequestId(requestId);
        if (!request) {
          if (callback) callback({ error: 'Service request not found' });
          socket.emit('error', { message: 'Service request not found' });
          return;
        }

        // Check ownership
        const isCustomer = request.customerId?.toString() === userId;
        const isAssignedMechanic = request.mechanicId && request.mechanicId.toString() === userId;

        if (!isCustomer && !isAssignedMechanic) {
          if (callback) callback({ error: 'Unauthorized: You are not authorized to track this request' });
          socket.emit('error', { message: 'Unauthorized room access' });
          return;
        }

        // Join rooms (both _id and requestId for flexibility)
        const roomName1 = `request:${request._id.toString()}`;
        const roomName2 = `request:${request.requestId}`;
        socket.join(roomName1);
        socket.join(roomName2);

        let latestMechanicLocation = request.mechanicLastLocation || null;

        // If not yet recorded on the request, fallback to assigned mechanic's real profile location
        if (!latestMechanicLocation && request.mechanicId) {
          try {
            const assignedMech = await User.findById(request.mechanicId).select('name mechanicProfile');
            const coords = assignedMech?.mechanicProfile?.location?.coordinates;
            if (Array.isArray(coords) && coords.length === 2) {
              latestMechanicLocation = {
                latitude: coords[1], // GeoJSON index 1 is latitude
                longitude: coords[0], // GeoJSON index 0 is longitude
                updatedAt: assignedMech.mechanicProfile.locationUpdatedAt || request.updatedAt
              };
            }
          } catch (e) {
            // quiet ignore
          }
        }

        const responsePayload = {
          success: true,
          requestId: request.requestId,
          id: request._id.toString(),
          status: request.status,
          customerCoordinates: request.customerCoordinates || null,
          mechanicLastLocation: latestMechanicLocation
        };

        if (callback) callback(responsePayload);
        socket.emit('joined:request', responsePayload);
      } catch (error) {
        if (callback) callback({ error: 'Failed to join tracking room' });
      }
    });

    /**
     * Leave private request tracking room
     */
    socket.on('leave:request', (data) => {
      const requestId = typeof data === 'string' ? data : data?.requestId;
      if (requestId) {
        socket.leave(`request:${requestId}`);
      }
    });

    /**
     * Mechanic real-time location update
     */
    socket.on('mechanic:location:update', async (data, callback) => {
      try {
        // Only mechanics are allowed to emit location
        if (user.role !== 'mechanic') {
          if (callback) callback({ error: 'Only mechanics can broadcast location' });
          return;
        }

        const { requestId, latitude, longitude, heading, speed, accuracy } = data || {};

        // Coordinate validation
        if (typeof latitude !== 'number' || latitude < -90 || latitude > 90) {
          if (callback) callback({ error: 'Invalid latitude (-90 to 90)' });
          return;
        }
        if (typeof longitude !== 'number' || longitude < -180 || longitude > 180) {
          if (callback) callback({ error: 'Invalid longitude (-180 to 180)' });
          return;
        }

        // Rate limiting throttle: minimum 1.5 seconds between updates
        const now = Date.now();
        if (now - socket.lastLocationEmission < 1500) {
          if (callback) callback({ status: 'throttled', waitMs: 1500 - (now - socket.lastLocationEmission) });
          return;
        }
        socket.lastLocationEmission = now;

        const timestamp = new Date();

        // If requestId is provided, verify request and broadcast to room
        if (requestId) {
          const request = await findServiceRequestByIdOrRequestId(requestId);

          if (request) {
            // Verify this mechanic is assigned to this request
            const isAssigned = request.mechanicId && request.mechanicId.toString() === userId;
            const validActiveStatuses = ['accepted', 'on_the_way', 'arrived', 'repair_in_progress'];

            if (isAssigned && validActiveStatuses.includes(request.status)) {
              // Update last known location on request doc
              request.mechanicLastLocation = {
                latitude,
                longitude,
                updatedAt: timestamp
              };
              await request.save();

              const locationPayload = {
                requestId: request.requestId,
                id: request._id.toString(),
                mechanicId: userId,
                mechanicName: user.name,
                latitude,
                longitude,
                heading: heading || 0,
                speed: speed || 0,
                accuracy: accuracy || null,
                timestamp: timestamp.toISOString()
              };

              // Broadcast to request rooms (both _id and readable ID)
              io.to(`request:${request._id.toString()}`).emit('mechanic:location', locationPayload);
              io.to(`request:${request.requestId}`).emit('mechanic:location', locationPayload);
            }
          }
        }

        // Update mechanic's persistent profile location in MongoDB
        await User.findByIdAndUpdate(userId, {
          'mechanicProfile.location': {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          'mechanicProfile.locationUpdatedAt': timestamp,
          'mechanicProfile.lastLocationAccuracy': accuracy || null
        });

        if (callback) callback({ success: true, timestamp });
      } catch (error) {
        if (callback) callback({ error: 'Failed to update location' });
      }
    });

    socket.on('disconnect', () => {
      // Clean up if needed
    });
  });

  return io;
};

/**
 * Access the initialized Socket.IO instance
 */
export const getIO = () => {
  return io;
};

/**
 * Broadcast request status update to request tracking rooms
 */
export const emitRequestStatusUpdate = (request) => {
  if (!io || !request) return;

  const payload = {
    id: request._id ? request._id.toString() : request.id,
    requestId: request.requestId,
    status: request.status,
    mechanicId: request.mechanicId?._id ? request.mechanicId._id.toString() : request.mechanicId?.toString(),
    mechanicName: request.mechanicName || '',
    workshopName: request.workshopName || '',
    finalCharge: request.finalCharge,
    statusHistory: request.statusHistory,
    updatedAt: new Date().toISOString()
  };

  if (request._id) {
    io.to(`request:${request._id.toString()}`).emit('request:status_updated', payload);
  }
  if (request.requestId) {
    io.to(`request:${request.requestId}`).emit('request:status_updated', payload);
  }

  // Also notify the customer and assigned mechanic directly
  if (request.customerId) {
    const custId = request.customerId._id ? request.customerId._id.toString() : request.customerId.toString();
    io.to(`user:${custId}`).emit('request:status_updated', payload);
  }
  if (request.mechanicId) {
    const mechId = request.mechanicId._id ? request.mechanicId._id.toString() : request.mechanicId.toString();
    io.to(`user:${mechId}`).emit('request:status_updated', payload);
  }
};

/**
 * Broadcast new service request notification to mechanics
 */
export const emitNewServiceRequest = (request) => {
  if (!io || !request) return;

  const payload = {
    id: request._id ? request._id.toString() : request.id,
    requestId: request.requestId,
    vehicleName: request.vehicleName,
    problemCategory: request.problemCategory,
    location: request.location,
    customerCoordinates: request.customerCoordinates,
    estimatedCharge: request.estimatedCharge,
    createdAt: request.createdAt
  };

  // If assigned to a specific mechanic, notify that mechanic's user room
  if (request.mechanicId) {
    const mechId = request.mechanicId._id ? request.mechanicId._id.toString() : request.mechanicId.toString();
    io.to(`user:${mechId}`).emit('request:available', payload);
  } else {
    // Open request broadcast to all active mechanics
    io.to('mechanics:active').emit('request:available', payload);
  }
};