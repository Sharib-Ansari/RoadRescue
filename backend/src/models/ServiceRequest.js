import mongoose from 'mongoose';

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    note: {
      type: String,
      default: ''
    }
  },
  { _id: false }
);

const serviceRequestSchema = new mongoose.Schema(
  {
    requestId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Customer is required'],
      index: true
    },
    mechanicId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    mechanicName: {
      type: String,
      default: ''
    },
    workshopName: {
      type: String,
      default: ''
    },
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle'
    },
    vehicleName: {
      type: String,
      required: true
    },
    vehicleReg: {
      type: String,
      default: ''
    },
    problemCategory: {
      type: String,
      required: [true, 'Problem category is required'],
      enum: [
        'Engine Problem',
        'Flat Tyre / Puncture',
        'Battery Failure',
        'Brake Problem',
        'Chain / Clutch Problem',
        'Fuel Problem',
        'Overheating',
        'Electrical Problem',
        'Other Problem'
      ]
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    location: {
      type: String,
      required: [true, 'Service location is required'],
      trim: true
    },
    estimatedCharge: {
      type: Number,
      default: 250
    },
    finalCharge: {
      type: Number
    },
    status: {
      type: String,
      enum: ['submitted', 'accepted', 'on_the_way', 'arrived', 'completed', 'cancelled'],
      default: 'submitted',
      index: true
    },
    statusHistory: [statusHistorySchema],
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    review: {
      type: String,
      trim: true
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
    }
  }
);

const ServiceRequest = mongoose.model('ServiceRequest', serviceRequestSchema);

export default ServiceRequest;
