import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true
    },
    productName: {
      type: String,
      required: true,
      trim: true
    },
    brand: {
      type: String,
      trim: true,
      default: 'OEM'
    },
    SKU: {
      type: String,
      required: true,
      trim: true
    },
    unitPrice: {
      type: Number,
      required: true,
      min: 0
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    lineTotal: {
      type: Number,
      required: true,
      min: 0
    }
  },
  { _id: false }
);

const deliveryAddressSchema = new mongoose.Schema(
  {
    street: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    pinCode: { type: String, trim: true, default: '' },
    contactPhone: { type: String, trim: true, default: '' },
    notes: { type: String, trim: true, default: '' }
  },
  { _id: false }
);

const pickupDetailsSchema = new mongoose.Schema(
  {
    shopAddress: { type: String, trim: true, default: '' },
    shopCity: { type: String, trim: true, default: '' },
    shopPinCode: { type: String, trim: true, default: '' },
    shopPhone: { type: String, trim: true, default: '' },
    instructions: { type: String, trim: true, default: 'Please show your Order Number at the shop counter for pickup.' }
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    note: { type: String, default: '' }
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: true,
      index: true
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: function (v) {
          return Array.isArray(v) && v.length > 0;
        },
        message: 'Order must contain at least one product item'
      }
    },
    subtotal: {
      type: Number,
      required: true,
      min: 0
    },
    deliveryCharge: {
      type: Number,
      required: true,
      min: 0,
      default: 0
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0
    },
    fulfillmentMethod: {
      type: String,
      enum: ['home_delivery', 'shop_pickup'],
      required: true
    },
    deliveryAddress: {
      type: deliveryAddressSchema,
      default: undefined
    },
    pickupDetails: {
      type: pickupDetailsSchema,
      default: undefined
    },
    orderStatus: {
      type: String,
      enum: [
        'placed',
        'confirmed',
        'preparing',
        'out_for_delivery',
        'ready_for_pickup',
        'completed',
        'cancelled'
      ],
      default: 'placed',
      index: true
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending' // As approved: pending until real verified payment exists
    },
    paymentMethod: {
      type: String,
      enum: ['cash_on_delivery', 'pay_at_shop', 'online_pending'],
      default: 'cash_on_delivery'
    },
    inventoryRestored: {
      type: Boolean,
      default: false
    },
    cancellationReason: {
      type: String,
      trim: true,
      default: ''
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: () => [
        { status: 'placed', timestamp: new Date(), note: 'Order placed by customer' }
      ]
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
orderSchema.index({ customerId: 1, createdAt: -1 });
orderSchema.index({ shopId: 1, orderStatus: 1, createdAt: -1 });

const Order = mongoose.model('Order', orderSchema);
export default Order;
