import Shop from '../models/Shop.js';
import User from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';
import mongoose from 'mongoose';

/**
 * Helper to normalize GeoJSON location from various input shapes
 */
export const normalizeLocation = (loc) => {
  if (!loc) return null;
  // If format is { type: 'Point', coordinates: [lng, lat] }
  if (loc.type === 'Point' && Array.isArray(loc.coordinates) && loc.coordinates.length === 2) {
    return {
      type: 'Point',
      coordinates: [Number(loc.coordinates[0]), Number(loc.coordinates[1])]
    };
  }
  // If format is [lng, lat]
  if (Array.isArray(loc) && loc.length === 2) {
    return {
      type: 'Point',
      coordinates: [Number(loc[0]), Number(loc[1])]
    };
  }
  // If format is { latitude, longitude } or { lat, lng }
  const lat = loc.latitude !== undefined ? loc.latitude : loc.lat;
  const lng = loc.longitude !== undefined ? loc.longitude : loc.lng;
  if (lat !== undefined && lng !== undefined) {
    return {
      type: 'Point',
      coordinates: [Number(lng), Number(lat)]
    };
  }
  return null;
};

/**
 * Create a shop for a shop_owner user
 * POST /api/shops
 */
export const createShop = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      name,
      shopName,
      description,
      phone,
      address,
      shopAddress,
      city,
      shopCity,
      pinCode,
      shopPinCode,
      location,
      latitude,
      longitude,
      acceptsHomeDelivery,
      acceptsShopPickup,
      deliveryCharge
    } = req.body;

    const finalName = (name || shopName || '').trim();
    const finalAddress = (address || shopAddress || '').trim();
    const finalCity = (city || shopCity || '').trim();
    const finalPin = (pinCode || shopPinCode || '').trim();

    if (!finalName) throw new AppError('Shop name is required', 400);
    if (!finalAddress) throw new AppError('Shop address is required', 400);
    if (!finalCity) throw new AppError('City is required', 400);
    if (!finalPin) throw new AppError('PIN code is required', 400);

    const geoLoc = normalizeLocation(location || (latitude !== undefined && longitude !== undefined ? { latitude, longitude } : { latitude: 28.6139, longitude: 77.2090 }));
    if (!geoLoc) {
      throw new AppError('Valid location coordinates [longitude, latitude] are required', 400);
    }

    // Ensure user exists and is shop_owner
    const user = await User.findById(req.user._id).session(session);
    if (!user) throw new AppError('User not found', 404);
    if (user.role !== 'shop_owner') {
      throw new AppError('Only shop owners can create a shop profile', 403);
    }

    const existingShop = await Shop.findOne({ owner: user._id }).session(session);
    if (existingShop) {
      throw new AppError('You already have a registered shop', 409);
    }

    const [shop] = await Shop.create(
      [
        {
          owner: user._id,
          name: finalName,
          description: (description || '').trim(),
          phone: (phone || user.phone || '').trim(),
          address: finalAddress,
          city: finalCity,
          pinCode: finalPin,
          location: geoLoc,
          acceptsHomeDelivery: acceptsHomeDelivery !== undefined ? Boolean(acceptsHomeDelivery) : true,
          acceptsShopPickup: acceptsShopPickup !== undefined ? Boolean(acceptsShopPickup) : true,
          deliveryCharge: deliveryCharge !== undefined ? Math.max(0, Number(deliveryCharge)) : 0,
          isActive: true
        }
      ],
      { session }
    );

    await session.commitTransaction();
    res.status(201).json({
      success: true,
      message: 'Shop created successfully',
      shop
    });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

/**
 * Get current authenticated user's shop
 * GET /api/shops/me
 */
export const getMyShop = async (req, res, next) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id }).populate('owner', 'name email phone');
    if (!shop) {
      return next(new AppError('No shop profile found for this account', 404));
    }
    res.status(200).json({
      success: true,
      shop
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update current authenticated user's shop
 * PATCH /api/shops/me
 */
export const updateMyShop = async (req, res, next) => {
  try {
    const shop = await Shop.findOne({ owner: req.user._id });
    if (!shop) {
      return next(new AppError('No shop profile found for this account', 404));
    }

    const {
      name,
      description,
      phone,
      address,
      city,
      pinCode,
      location,
      latitude,
      longitude,
      acceptsHomeDelivery,
      acceptsShopPickup,
      deliveryCharge,
      isActive
    } = req.body;

    if (name) shop.name = name.trim();
    if (description !== undefined) shop.description = description.trim();
    if (phone !== undefined) shop.phone = phone.trim();
    if (address) shop.address = address.trim();
    if (city) shop.city = city.trim();
    if (pinCode) shop.pinCode = pinCode.trim();

    if (location || (latitude !== undefined && longitude !== undefined)) {
      const geoLoc = normalizeLocation(location || { latitude, longitude });
      if (geoLoc) shop.location = geoLoc;
    }

    if (acceptsHomeDelivery !== undefined) shop.acceptsHomeDelivery = Boolean(acceptsHomeDelivery);
    if (acceptsShopPickup !== undefined) shop.acceptsShopPickup = Boolean(acceptsShopPickup);
    if (deliveryCharge !== undefined) shop.deliveryCharge = Math.max(0, Number(deliveryCharge));
    if (isActive !== undefined) shop.isActive = Boolean(isActive);

    await shop.save();

    res.status(200).json({
      success: true,
      message: 'Shop updated successfully',
      shop
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get public shop by ID
 * GET /api/shops/:id
 */
export const getShopById = async (req, res, next) => {
  try {
    const shop = await Shop.findById(req.params.id).populate('owner', 'name email phone');
    if (!shop) {
      return next(new AppError('Shop not found', 404));
    }
    res.status(200).json({
      success: true,
      shop
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get all active shops (public)
 * GET /api/shops
 */
export const getAllShops = async (req, res, next) => {
  try {
    const { city, search } = req.query;
    const filter = { isActive: true };

    if (city) {
      filter.city = new RegExp(city.trim(), 'i');
    }
    if (search) {
      filter.name = new RegExp(search.trim(), 'i');
    }

    const shops = await Shop.find(filter).sort({ name: 1 });
    res.status(200).json({
      success: true,
      count: shops.length,
      shops
    });
  } catch (err) {
    next(err);
  }
};
