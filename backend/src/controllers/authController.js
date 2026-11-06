import mongoose from 'mongoose';
import User from '../models/User.js';
import Shop from '../models/Shop.js';
import { generateToken, setAuthCookie, clearAuthCookie } from '../utils/jwt.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Register a new customer or mechanic
 * POST /api/auth/register
 */
export const register = async (req, res, next) => {
  try {
    const {
      name,
      fullName,
      email,
      phone,
      password,
      role,
      accountType,
      workshopName,
      services,
      servicesOffered,
      experience,
      experienceYears,
      serviceArea,
      // Shop owner specific fields
      shopName,
      shopAddress,
      address,
      shopCity,
      city,
      shopPinCode,
      pinCode,
      shopDescription,
      description,
      shopPhone,
      latitude,
      shopLatitude,
      longitude,
      shopLongitude,
      location,
      acceptsHomeDelivery,
      acceptsShopPickup,
      deliveryCharge
    } = req.body;

    // Harmonize naming between frontend & backend conventions
    const userName = (name || fullName || '').trim();
    const userEmail = (email || '').trim().toLowerCase();
    const userRole = (role || accountType || 'customer').trim().toLowerCase();

    // 1. Basic validation
    if (!userName) {
      return next(new AppError('Full name is required', 400));
    }
    if (userName.length < 2) {
      return next(new AppError('Name must be at least 2 characters', 400));
    }

    if (!userEmail) {
      return next(new AppError('Email address is required', 400));
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userEmail)) {
      return next(new AppError('Please enter a valid email address', 400));
    }

    if (!password) {
      return next(new AppError('Password is required', 400));
    }
    if (password.length < 6) {
      return next(new AppError('Password must be at least 6 characters long', 400));
    }

    // 2. Validate role - strictly disallow administrative or unexpected roles
    if (!['customer', 'mechanic', 'shop_owner'].includes(userRole)) {
      return next(new AppError('Account role must be either customer, mechanic, or shop_owner', 400));
    }

    // 3. Mechanic profile validation if registering as mechanic
    let mechanicProfile = {};
    if (userRole === 'mechanic') {
      const wName = (workshopName || '').trim();
      const sArea = (serviceArea || '').trim();
      const sList = services || servicesOffered || [];
      const expRaw = experience !== undefined ? experience : experienceYears;
      const exp = Number(expRaw);

      if (!wName) {
        return next(new AppError('Workshop or business name is required for mechanic registration', 400));
      }
      if (expRaw === undefined || expRaw === null || expRaw === '' || Number.isNaN(exp) || exp < 0) {
        return next(new AppError('Valid years of experience (0 or more) is required for mechanics', 400));
      }
      if (!sArea) {
        return next(new AppError('Primary service area/city is required for mechanic registration', 400));
      }
      if (!Array.isArray(sList) || sList.length === 0) {
        return next(new AppError('At least one service offered must be selected for mechanics', 400));
      }

      mechanicProfile = {
        workshopName: wName,
        experience: exp,
        services: sList,
        serviceArea: sArea
      };
    }

    // 4. Shop validation if registering as shop_owner
    let shopData = null;
    if (userRole === 'shop_owner') {
      const sName = (shopName || workshopName || '').trim();
      const sAddr = (shopAddress || address || '').trim();
      const sCity = (shopCity || city || serviceArea || '').trim();
      const sPin = (shopPinCode || pinCode || '').trim();

      if (!sName) {
        return next(new AppError('Shop name is required for spare parts shop registration', 400));
      }
      if (!sAddr) {
        return next(new AppError('Shop physical address is required', 400));
      }
      if (!sCity) {
        return next(new AppError('City is required for shop registration', 400));
      }
      if (!sPin) {
        return next(new AppError('PIN code is required for shop registration', 400));
      }

      const rawLat = latitude !== undefined ? latitude : shopLatitude;
      const rawLng = longitude !== undefined ? longitude : shopLongitude;
      let geoCoordinates = [77.2090, 28.6139]; // Default Delhi coords if not provided

      if (location && Array.isArray(location.coordinates) && location.coordinates.length === 2) {
        geoCoordinates = [Number(location.coordinates[0]), Number(location.coordinates[1])];
      } else if (rawLat !== undefined && rawLng !== undefined && rawLat !== '' && rawLng !== '') {
        const latNum = Number(rawLat);
        const lngNum = Number(rawLng);
        if (Number.isNaN(latNum) || Number.isNaN(lngNum) || latNum < -90 || latNum > 90 || lngNum < -180 || lngNum > 180) {
          return next(new AppError('Invalid GPS coordinates for shop location', 400));
        }
        geoCoordinates = [lngNum, latNum];
      }

      shopData = {
        name: sName,
        description: (shopDescription || description || '').trim(),
        phone: (shopPhone || phone || '').trim(),
        address: sAddr,
        city: sCity,
        pinCode: sPin,
        location: {
          type: 'Point',
          coordinates: geoCoordinates
        },
        acceptsHomeDelivery: acceptsHomeDelivery !== undefined ? Boolean(acceptsHomeDelivery) : true,
        acceptsShopPickup: acceptsShopPickup !== undefined ? Boolean(acceptsShopPickup) : true,
        deliveryCharge: deliveryCharge !== undefined ? Math.max(0, Number(deliveryCharge)) : 0,
        isActive: true
      };
    }

    // 5. Check for duplicate email
    const existingUser = await User.findOne({ email: userEmail });
    if (existingUser) {
      return next(new AppError('An account with this email address already exists', 409));
    }

    // 6. Hash password with Argon2id
    const passwordHash = await User.hashPassword(password);

    // 7. Transactional user and shop creation
    let newUser;
    let newShop = null;

    const session = await mongoose.startSession();
    let transactionStarted = false;
    try {
      try {
        session.startTransaction();
        transactionStarted = true;
      } catch (tErr) {
        // Fallback for non-replica-set testing environments
        transactionStarted = false;
      }

      const sessionOpt = transactionStarted ? { session } : {};

      const userDocs = await User.create(
        [
          {
            name: userName,
            email: userEmail,
            phone: (phone || '').trim(),
            passwordHash,
            role: userRole,
            isActive: true,
            mechanicProfile: userRole === 'mechanic' ? mechanicProfile : undefined
          }
        ],
        sessionOpt
      );
      newUser = userDocs[0];

      if (userRole === 'shop_owner' && shopData) {
        shopData.owner = newUser._id;
        const shopDocs = await Shop.create([shopData], sessionOpt);
        newShop = shopDocs[0];
      }

      if (transactionStarted) {
        await session.commitTransaction();
      }
    } catch (saveError) {
      if (transactionStarted) {
        await session.abortTransaction();
      }
      throw saveError;
    } finally {
      session.endSession();
    }

    // 8. Generate JWT
    const token = generateToken(newUser);

    // 9. Set HttpOnly authentication cookie
    setAuthCookie(res, token);

    // 10. Return safe user object
    const userResponse = newUser.toJSON();

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      user: {
        id: userResponse.id,
        name: userResponse.name,
        email: userResponse.email,
        phone: userResponse.phone,
        role: userResponse.role,
        ...(userResponse.role === 'mechanic' && { mechanicProfile: userResponse.mechanicProfile }),
        ...(userResponse.role === 'shop_owner' && newShop && { shop: newShop })
      }
    });
  } catch (error) {
    // Handle Mongoose duplicate key error (code 11000)
    if (error.code === 11000) {
      return next(new AppError('An account with this email address already exists', 409));
    }
    next(error);
  }
};

/**
 * Log in an existing user
 * POST /api/auth/login
 */
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // 1. Validate inputs
    if (!email || !password) {
      return next(new AppError('Please provide both email and password', 400));
    }

    const trimmedEmail = email.trim().toLowerCase();

    // 2. Find user by email, explicitly including passwordHash for verification
    const user = await User.findOne({ email: trimmedEmail }).select('+passwordHash');

    // Generic error message to prevent account enumeration
    const genericAuthError = new AppError('Invalid email or password', 401);

    if (!user) {
      return next(genericAuthError);
    }

    // 3. Verify password with Argon2id
    const isPasswordValid = await user.verifyPassword(password);
    if (!isPasswordValid) {
      return next(genericAuthError);
    }

    // 4. Check if account is active
    if (!user.isActive) {
      return next(new AppError('Your account has been deactivated. Please contact support.', 403));
    }

    // 5. Generate JWT
    const token = generateToken(user);

    // 6. Set HttpOnly authentication cookie
    setAuthCookie(res, token);

    // 7. Return safe user details
    const userResponse = user.toJSON();
    let shop = null;
    if (user.role === 'shop_owner') {
      shop = await Shop.findOne({ owner: user._id });
    }

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: {
        id: userResponse.id,
        name: userResponse.name,
        email: userResponse.email,
        phone: userResponse.phone,
        role: userResponse.role,
        ...(userResponse.role === 'mechanic' && { mechanicProfile: userResponse.mechanicProfile }),
        ...(userResponse.role === 'shop_owner' && shop && { shop })
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current authenticated user profile
 * GET /api/auth/me
 */
export const getMe = async (req, res, next) => {
  try {
    // req.user was populated by requireAuth middleware
    res.status(200).json({
      success: true,
      user: req.user
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update authenticated user profile
 * PATCH /api/auth/profile
 */
export const updateMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    const {
      name,
      phone,
      workshopName,
      serviceArea,
      experienceYears,
      emergencyContactName,
      emergencyContactPhone,
      smsAlerts,
      emailInvoices,
      isAvailable
    } = req.body;

    if (name) user.name = name.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (emergencyContactName !== undefined) user.emergencyContactName = emergencyContactName.trim();
    if (emergencyContactPhone !== undefined) user.emergencyContactPhone = emergencyContactPhone.trim();
    if (smsAlerts !== undefined) user.smsAlerts = Boolean(smsAlerts);
    if (emailInvoices !== undefined) user.emailInvoices = Boolean(emailInvoices);

    if (user.role === 'mechanic') {
      if (!user.mechanicProfile) user.mechanicProfile = {};
      if (workshopName) user.mechanicProfile.workshopName = workshopName.trim();
      if (serviceArea) user.mechanicProfile.serviceArea = serviceArea.trim();
      if (experienceYears !== undefined) user.mechanicProfile.experience = Number(experienceYears);
      if (isAvailable !== undefined) user.mechanicProfile.isAvailable = Boolean(isAvailable);
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: user.toJSON()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update mechanic availability status
 * PATCH /api/auth/availability
 */
export const updateAvailability = async (req, res, next) => {
  try {
    if (req.user.role !== 'mechanic') {
      return next(new AppError('Only mechanics can set availability status', 403));
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    const { isOnline, isAvailable } = req.body;
    const availableState = isOnline !== undefined ? Boolean(isOnline) : Boolean(isAvailable);

    if (!user.mechanicProfile) user.mechanicProfile = {};
    user.mechanicProfile.isAvailable = availableState;

    await user.save();

    res.status(200).json({
      success: true,
      message: `Availability updated to ${availableState ? 'online' : 'offline'}`,
      isAvailable: user.mechanicProfile.isAvailable
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Log out user and clear auth cookie
 * POST /api/auth/logout
 */
export const logout = async (req, res, next) => {
  try {
    clearAuthCookie(res);
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};
