import mongoose from 'mongoose';

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

const shopSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Shop owner is required'],
      unique: true
    },
    name: {
      type: String,
      required: [true, 'Shop name is required'],
      trim: true,
      minlength: [2, 'Shop name must be at least 2 characters']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    address: {
      type: String,
      required: [true, 'Shop address is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    pinCode: {
      type: String,
      required: [true, 'PIN code is required'],
      trim: true
    },
    location: {
      type: pointSchema,
      required: [true, 'Shop location is required']
    },
    acceptsHomeDelivery: {
      type: Boolean,
      default: true
    },
    acceptsShopPickup: {
      type: Boolean,
      default: true
    },
    deliveryCharge: {
      type: Number,
      default: 0,
      min: [0, 'Delivery charge cannot be negative']
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    },
    toObject: {
      transform: function (doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      }
    }
  }
);

// Indexes
shopSchema.index({ location: '2dsphere' });
shopSchema.index({ city: 1, isActive: 1 });

const Shop = mongoose.model('Shop', shopSchema);
export default Shop;
