import User from '../models/User.js';
import ServiceRequest from '../models/ServiceRequest.js';
import { AppError } from '../middleware/errorHandler.js';

// Development and automated test fixture accounts identified in the database audit dry-run manifest.
// These records are strictly excluded from all public discovery queries without executing database deletions.
const KNOWN_TEST_FIXTURE_IDS = [
  '6ae8315bafa85fc04566fa2c',
  '6ae8315bafa85fc04566fa2d',
  '6ae8325b7b6c8bf17de62f55',
  '6ae8325b7b6c8bf17de62f56',
  '6ae833cd879d0809e79b036f',
  '6ae833cd879d0809e79b0370',
  '6ae9e307c98b587e398593bd',
  '6ae9e308c98b587e398593be',
  '6aea1e45b15c91d33257f860',
  '6aea1e45b15c91d33257f861',
  '6aea1e45b15c91d33257f862',
  '6aea1e6eb15c91d33257f864',
  '6aea1e6eb15c91d33257f865',
  '6aea1e6eb15c91d33257f866',
  '6aea1e70b15c91d33257f868',
  '6aea1e8db15c91d33257f86b',
  '6aea1e8db15c91d33257f86c',
  '6aea1ebbf58deef0748c64a0',
  '6aea1ebbf58deef0748c64a1',
  '6aea1ebcf58deef0748c64a2',
  '6aea1ebef58deef0748c64a4'
];

// Haversine formula to compute great-circle distance in kilometers from real coordinates
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

/**
 * Update mechanic current GPS location
 * PATCH /api/mechanics/location
 */
export const updateLocation = async (req, res, next) => {
  try {
    const { latitude, longitude, accuracy } = req.body;

    if (latitude === undefined || latitude === null || typeof latitude !== 'number' || isNaN(latitude)) {
      return next(new AppError('Valid latitude is required (-90 to 90)', 400));
    }
    if (longitude === undefined || longitude === null || typeof longitude !== 'number' || isNaN(longitude)) {
      return next(new AppError('Valid longitude is required (-180 to 180)', 400));
    }

    if (latitude < -90 || latitude > 90) {
      return next(new AppError('Latitude must be between -90 and 90 degrees', 400));
    }
    if (longitude < -180 || longitude > 180) {
      return next(new AppError('Longitude must be between -180 and 180 degrees', 400));
    }

    const user = await User.findById(req.user._id);
    if (!user || user.role !== 'mechanic') {
      return next(new AppError('Only registered mechanics can update location', 403));
    }

    if (!user.mechanicProfile) {
      user.mechanicProfile = {};
    }

    const now = new Date();
    user.mechanicProfile.location = {
      type: 'Point',
      coordinates: [longitude, latitude] // GeoJSON format: [longitude, latitude]
    };
    user.mechanicProfile.locationUpdatedAt = now;
    if (accuracy !== undefined && typeof accuracy === 'number') {
      user.mechanicProfile.lastLocationAccuracy = accuracy;
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Mechanic location updated successfully',
      location: {
        latitude,
        longitude,
        accuracy: accuracy || null,
        updatedAt: now
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Discover nearby available mechanics using MongoDB 2dsphere $near
 * GET /api/mechanics/nearby
 */
export const getNearbyMechanics = async (req, res, next) => {
  try {
    const { latitude, longitude, radiusKm, service, limit } = req.query;

    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      return next(new AppError('Valid latitude query parameter is required (-90 to 90)', 400));
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      return next(new AppError('Valid longitude query parameter is required (-180 to 180)', 400));
    }

    const radius = radiusKm ? Math.min(Math.max(parseFloat(radiusKm) || 10, 1), 200) : 25; // default 25km, max 200km
    const maxMeters = radius * 1000;
    const maxResults = limit ? Math.min(parseInt(limit, 10) || 20, 50) : 20;

    // Filter strictly for genuine, active, available mechanics with valid coordinates
    const query = {
      _id: { $nin: KNOWN_TEST_FIXTURE_IDS },
      role: 'mechanic',
      isActive: true,
      'mechanicProfile.isAvailable': true,
      'mechanicProfile.location': {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: maxMeters
        }
      }
    };

    if (service && service !== 'all') {
      query['mechanicProfile.services'] = { $in: [service] };
    }

    const mechanics = await User.find(query)
      .select('name email phone role mechanicProfile createdAt')
      .limit(maxResults);

    // Format mechanics with calculated distance and flat coordinate structure
    const formatted = mechanics.map((m) => {
      const coords = m.mechanicProfile?.location?.coordinates;
      let distanceKm = null;
      let mLat = null;
      let mLng = null;

      if (coords && coords.length === 2) {
        mLng = coords[0];
        mLat = coords[1];
        distanceKm = calculateDistanceKm(lat, lng, mLat, mLng);
      }

      return {
        id: m._id.toString(),
        name: m.name,
        email: m.email,
        phone: m.phone,
        workshopName: m.mechanicProfile?.workshopName || '',
        experience: m.mechanicProfile?.experience || 0,
        services: m.mechanicProfile?.services || [],
        serviceArea: m.mechanicProfile?.serviceArea || '',
        isAvailable: m.mechanicProfile?.isAvailable !== false,
        latitude: mLat,
        longitude: mLng,
        distanceKm,
        locationUpdatedAt: m.mechanicProfile?.locationUpdatedAt || null
      };
    });

    res.status(200).json({
      success: true,
      count: formatted.length,
      searchCoordinates: { latitude: lat, longitude: lng },
      radiusKm: radius,
      mechanics: formatted
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all certified genuine mechanics with optional filtering
 * GET /api/mechanics
 */
export const getAllMechanics = async (req, res, next) => {
  try {
    const { service, search, area, latitude, longitude } = req.query;

    const filter = {
      _id: { $nin: KNOWN_TEST_FIXTURE_IDS },
      role: 'mechanic',
      isActive: true
    };

    if (service && service !== 'all') {
      filter['mechanicProfile.services'] = { $in: [service] };
    }

    if (area) {
      filter['mechanicProfile.serviceArea'] = { $regex: area, $options: 'i' };
    }

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      filter.$or = [
        { name: searchRegex },
        { 'mechanicProfile.workshopName': searchRegex },
        { 'mechanicProfile.serviceArea': searchRegex },
        { 'mechanicProfile.services': searchRegex }
      ];
    }

    const mechanics = await User.find(filter)
      .select('name email phone role mechanicProfile createdAt')
      .sort({ createdAt: -1 });

    const refLat = latitude ? parseFloat(latitude) : null;
    const refLng = longitude ? parseFloat(longitude) : null;
    const hasRefCoords = refLat !== null && !isNaN(refLat) && refLng !== null && !isNaN(refLng);

    const formatted = mechanics.map((m) => {
      const coords = m.mechanicProfile?.location?.coordinates;
      let distanceKm = null;
      let mLat = null;
      let mLng = null;

      if (coords && coords.length === 2) {
        mLng = coords[0];
        mLat = coords[1];
        if (hasRefCoords) {
          distanceKm = calculateDistanceKm(refLat, refLng, mLat, mLng);
        }
      }

      return {
        id: m._id.toString(),
        name: m.name,
        email: m.email,
        phone: m.phone,
        workshopName: m.mechanicProfile?.workshopName || '',
        experience: m.mechanicProfile?.experience || 0,
        services: m.mechanicProfile?.services || [],
        serviceArea: m.mechanicProfile?.serviceArea || '',
        isAvailable: m.mechanicProfile?.isAvailable !== false,
        latitude: mLat,
        longitude: mLng,
        distanceKm,
        locationUpdatedAt: m.mechanicProfile?.locationUpdatedAt || null
      };
    });

    res.status(200).json({
      success: true,
      count: formatted.length,
      mechanics: formatted
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get specific mechanic details
 * GET /api/mechanics/:id
 */
export const getMechanicById = async (req, res, next) => {
  try {
    const mechanic = await User.findOne({
      _id: req.params.id,
      _id: { $nin: KNOWN_TEST_FIXTURE_IDS, $eq: req.params.id },
      role: 'mechanic',
      isActive: true
    }).select('name email phone role mechanicProfile createdAt');

    if (!mechanic) {
      return next(new AppError('Mechanic not found', 404));
    }

    res.status(200).json({
      success: true,
      mechanic
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get real-time aggregated dashboard statistics for authenticated mechanic
 * GET /api/mechanics/dashboard/stats
 */
export const getMechanicStats = async (req, res, next) => {
  try {
    const mechanicId = req.user._id;

    const totalRequests = await ServiceRequest.countDocuments({
      mechanicId: mechanicId
    });

    const pendingRequests = await ServiceRequest.countDocuments({
      status: 'submitted',
      $or: [
        { requestedMechanicId: mechanicId },
        { requestedMechanicId: { $exists: false } },
        { requestedMechanicId: null }
      ],
      rejectedBy: { $ne: mechanicId }
    });

    const acceptedJobs = await ServiceRequest.countDocuments({
      mechanicId: mechanicId,
      status: { $in: ['accepted', 'on_the_way', 'arrived', 'repair_in_progress'] }
    });

    const completedJobs = await ServiceRequest.countDocuments({
      mechanicId: mechanicId,
      status: 'completed'
    });

    const earningsAgg = await ServiceRequest.aggregate([
      {
        $match: {
          mechanicId: mechanicId,
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: { $ifNull: ['$finalCharge', '$estimatedCharge', 0] } }
        }
      }
    ]);
    const totalEarnings = earningsAgg.length > 0 ? earningsAgg[0].total : 0;

    res.status(200).json({
      success: true,
      stats: {
        totalRequests,
        pendingRequests,
        acceptedJobs,
        completedJobs,
        totalEarnings
      }
    });
  } catch (error) {
    next(error);
  }
};
