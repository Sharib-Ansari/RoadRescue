import mongoose from 'mongoose';
import argon2 from 'argon2';

const pointSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['Point'],
      required: true,
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true,
      validate: {
        validator: function (val) {
          return (
            Array.isArray(val) &&
            val.length === 2 &&
            typeof val[0] === 'number' &&
            val[0] >= -180 &&
            val[0] <= 180 &&
            typeof val[1] === 'number' &&
            val[1] >= -90 &&
            val[1] <= 90
          );
        },
        message: 'Coordinates must be [longitude (-180 to 180), latitude (-90 to 90)]'
      }
    }
  },
  { _id: false }
);

const mechanicProfileSchema = new mongoose.Schema(
  {
    workshopName: {
      type: String,
      trim: true,
      default: ''
    },
    experience: {
      type: Number,
      min: [0, 'Experience cannot be negative'],
      default: 0
    },
    services: {
      type: [String],
      default: []
    },
    serviceArea: {
      type: String,
      trim: true,
      default: ''
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    location: {
      type: pointSchema,
      default: undefined
    },
    locationUpdatedAt: {
      type: Date
    },
    lastLocationAccuracy: {
      type: Number
    }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address'
      ]
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      select: false // Never included in normal queries
    },
    role: {
      type: String,
      enum: {
        values: ['customer', 'mechanic'],
        message: 'Role must be either customer or mechanic'
      },
      default: 'customer'
    },
    isActive: {
      type: Boolean,
      default: true
    },
    emergencyContactName: {
      type: String,
      trim: true,
      default: ''
    },
    emergencyContactPhone: {
      type: String,
      trim: true,
      default: ''
    },
    smsAlerts: {
      type: Boolean,
      default: true
    },
    emailInvoices: {
      type: Boolean,
      default: true
    },
    mechanicProfile: {
      type: mechanicProfileSchema,
      default: () => ({})
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      }
    },
    toObject: {
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.passwordHash;
        return ret;
      }
    }
  }
);

// 2dsphere index for geospatial mechanic discovery
userSchema.index({ 'mechanicProfile.location': '2dsphere' }, { sparse: true });

// Validate mechanic profile fields if role is mechanic
userSchema.pre('validate', function (next) {
  if (this.role === 'mechanic') {
    if (!this.mechanicProfile?.workshopName?.trim()) {
      this.invalidate('mechanicProfile.workshopName', 'Workshop name is required for mechanics');
    }
    if (this.mechanicProfile?.experience === undefined || this.mechanicProfile?.experience === null || Number.isNaN(this.mechanicProfile?.experience)) {
      this.invalidate('mechanicProfile.experience', 'Valid experience is required for mechanics');
    }
    if (!this.mechanicProfile?.serviceArea?.trim()) {
      this.invalidate('mechanicProfile.serviceArea', 'Service area is required for mechanics');
    }
    if (!this.mechanicProfile?.services || this.mechanicProfile.services.length === 0) {
      this.invalidate('mechanicProfile.services', 'At least one service must be selected for mechanics');
    }
  }
  if (typeof next === 'function') {
    next();
  }
});

// Static method: Hash password with Argon2id
userSchema.statics.hashPassword = async function (plainPassword) {
  if (!plainPassword || typeof plainPassword !== 'string' || plainPassword.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }
  return await argon2.hash(plainPassword, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 64 MB
    timeCost: 3,
    parallelism: 1
  });
};

// Instance method: Verify password with Argon2id
userSchema.methods.verifyPassword = async function (plainPassword) {
  if (!plainPassword || !this.passwordHash) return false;
  try {
    return await argon2.verify(this.passwordHash, plainPassword);
  } catch (err) {
    return false;
  }
};

const User = mongoose.model('User', userSchema);

export default User;
