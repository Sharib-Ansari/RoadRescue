import User from '../models/User.js';
import { AppError } from '../middleware/errorHandler.js';

/**
 * Get all certified mechanics with optional filtering
 * GET /api/mechanics
 */
export const getAllMechanics = async (req, res, next) => {
  try {
    const { service, search, area } = req.query;

    const filter = {
      role: 'mechanic',
      isActive: true
    };

    if (service) {
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

    res.status(200).json({
      success: true,
      count: mechanics.length,
      mechanics
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
