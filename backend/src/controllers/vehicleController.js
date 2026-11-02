import Vehicle from '../models/Vehicle.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Get all vehicles for the authenticated user
 * GET /api/vehicles
 */
export const getMyVehicles = async (req, res, next) => {
  try {
    const vehicles = await Vehicle.find({ userId: req.user._id }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: vehicles.length,
      vehicles
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Add a new vehicle
 * POST /api/vehicles
 */
export const addVehicle = async (req, res, next) => {
  try {
    const { brand, make, model, type, registrationNumber, fuelType, year, isDefault } = req.body;

    const brandName = (brand || make || '').trim();
    const modelName = (model || '').trim();
    const regNo = (registrationNumber || '').trim().toUpperCase();

    if (!brandName) {
      return next(new AppError('Vehicle brand/make is required', 400));
    }
    if (!modelName) {
      return next(new AppError('Vehicle model is required', 400));
    }
    if (!regNo) {
      return next(new AppError('Vehicle registration number is required', 400));
    }

    // If marked default, unset any previous default
    if (isDefault) {
      await Vehicle.updateMany({ userId: req.user._id }, { isDefault: false });
    }

    const vehicle = await Vehicle.create({
      userId: req.user._id,
      brand: brandName,
      model: modelName,
      type: type || 'Car',
      registrationNumber: regNo,
      fuelType: fuelType || 'Petrol',
      year: year ? Number(year) : undefined,
      isDefault: Boolean(isDefault)
    });

    res.status(201).json({
      success: true,
      message: 'Vehicle registered successfully',
      vehicle
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a vehicle
 * PUT /api/vehicles/:id
 */
export const updateVehicle = async (req, res, next) => {
  try {
    const { brand, make, model, type, registrationNumber, fuelType, year, isDefault } = req.body;

    const vehicle = await Vehicle.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!vehicle) {
      return next(new AppError('Vehicle not found or unauthorized', 404));
    }

    if (brand || make) vehicle.brand = (brand || make).trim();
    if (model) vehicle.model = model.trim();
    if (type) vehicle.type = type;
    if (registrationNumber) vehicle.registrationNumber = registrationNumber.trim().toUpperCase();
    if (fuelType) vehicle.fuelType = fuelType;
    if (year !== undefined) vehicle.year = Number(year);
    if (isDefault !== undefined) {
      if (isDefault) {
        await Vehicle.updateMany({ userId: req.user._id }, { isDefault: false });
      }
      vehicle.isDefault = Boolean(isDefault);
    }

    await vehicle.save();

    res.status(200).json({
      success: true,
      message: 'Vehicle updated successfully',
      vehicle
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a vehicle
 * DELETE /api/vehicles/:id
 */
export const deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!vehicle) {
      return next(new AppError('Vehicle not found or unauthorized', 404));
    }

    res.status(200).json({
      success: true,
      message: 'Vehicle deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
