import mongoose from 'mongoose';

export const PRODUCT_CATEGORIES = [
  'Brakes',
  'Batteries',
  'Tyres',
  'Engine',
  'Electrical',
  'Fluids & Oils',
  'Suspension',
  'Transmission',
  'Accessories',
  'Other'
];

const productSchema = new mongoose.Schema(
  {
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Shop',
      required: [true, 'Shop reference is required'],
      index: true
    },
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [2, 'Product name must be at least 2 characters'],
      maxlength: [150, 'Product name cannot exceed 150 characters']
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    category: {
      type: String,
      enum: {
        values: PRODUCT_CATEGORIES,
        message: 'Invalid product category'
      },
      default: 'Other'
    },
    brand: {
      type: String,
      trim: true,
      default: 'OEM'
    },
    partNumber: {
      type: String,
      trim: true,
      default: ''
    },
    SKU: {
      type: String,
      required: [true, 'SKU is required'],
      trim: true,
      uppercase: true
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price cannot be negative']
    },
    stockQuantity: {
      type: Number,
      required: [true, 'Stock quantity is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0
    },
    imageUrl: {
      type: String,
      trim: true,
      default: ''
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    isArchived: {
      type: Boolean,
      default: false,
      index: true
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

// Compound unique index: SKU must be unique within each shop
productSchema.index({ shopId: 1, SKU: 1 }, { unique: true });

// Catalog filter indexes
productSchema.index({ category: 1, isAvailable: 1, isArchived: 1 });
productSchema.index({ price: 1, isAvailable: 1, isArchived: 1 });
productSchema.index({ shopId: 1, isArchived: 1, isAvailable: 1 });

const Product = mongoose.model('Product', productSchema);
export default Product;
