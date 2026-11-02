import mongoose from 'mongoose';

const vehicleSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Vehicle owner is required'],
      index: true
    },
    brand: {
      type: String,
      required: [true, 'Vehicle brand/make is required'],
      trim: true
    },
    model: {
      type: String,
      required: [true, 'Vehicle model is required'],
      trim: true
    },
    type: {
      type: String,
      enum: ['Car', 'Motorcycle/Bike', 'SUV', 'Truck', 'Scooter', 'Other'],
      default: 'Car'
    },
    registrationNumber: {
      type: String,
      required: [true, 'Registration number is required'],
      uppercase: true,
      trim: true
    },
    fuelType: {
      type: String,
      enum: ['Petrol', 'Diesel', 'CNG', 'Electric', 'Hybrid'],
      default: 'Petrol'
    },
    year: {
      type: Number,
      min: [1950, 'Year must be after 1950'],
      max: [new Date().getFullYear() + 1, 'Year cannot be in the future']
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        ret.make = ret.brand; // For frontend compatibility
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

const Vehicle = mongoose.model('Vehicle', vehicleSchema);

export default Vehicle;
