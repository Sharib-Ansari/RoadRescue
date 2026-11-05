import dotenv from 'dotenv';
dotenv.config();

import connectDB from '../config/db.js';
import User from '../models/User.js';

const seedDemoAccounts = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB Atlas for seeding...');

    // 1. Seed Demo Customer
    const customerEmail = 'demo@roadrescue.in';
    let customer = await User.findOne({ email: customerEmail });
    if (!customer) {
      const passwordHash = await User.hashPassword('demo123');
      customer = await User.create({
        name: 'Arjun Sharma',
        email: customerEmail,
        phone: '+91 98765 43210',
        passwordHash,
        role: 'customer',
        isActive: true
      });
      console.log('✅ Demo customer created: demo@roadrescue.in');
    } else {
      console.log('ℹ️ Demo customer already exists');
    }

    // 2. Seed Demo Mechanic
    const mechanicEmail = 'mechanic@roadrescue.in';
    let mechanic = await User.findOne({ email: mechanicEmail });
    if (!mechanic) {
      const passwordHash = await User.hashPassword('mechanic123');
      mechanic = await User.create({
        name: 'Rajesh Kumar (Partner)',
        email: mechanicEmail,
        phone: '+91 98765 12345',
        passwordHash,
        role: 'mechanic',
        isActive: true,
        mechanicProfile: {
          workshopName: 'Kumar Auto Care & Recovery',
          experience: 12,
          services: [
            'Engine Repair',
            'Tyre Service',
            'Battery Jumpstart',
            'Brake Service',
            'Vehicle Towing'
          ],
          serviceArea: 'Sector 14, Gurgaon / Delhi NCR',
          isAvailable: true,
          location: {
            type: 'Point',
            coordinates: [77.2167, 28.6328] // [lng, lat] Delhi NCR
          },
          locationUpdatedAt: new Date()
        }
      });
      console.log('✅ Demo mechanic created: mechanic@roadrescue.in');
    } else {
      // Ensure existing demo mechanic has location
      if (!mechanic.mechanicProfile?.location?.coordinates?.length) {
        mechanic.mechanicProfile = {
          ...mechanic.mechanicProfile,
          location: {
            type: 'Point',
            coordinates: [77.2167, 28.6328]
          },
          locationUpdatedAt: new Date(),
          isAvailable: true
        };
        await mechanic.save();
        console.log('ℹ️ Updated existing demo mechanic with coordinates');
      } else {
        console.log('ℹ️ Demo mechanic already exists with coordinates');
      }
    }

    console.log('🎉 Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    process.exit(1);
  }
};

seedDemoAccounts();
