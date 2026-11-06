import Product, { PRODUCT_CATEGORIES } from '../models/Product.js';
import Shop from '../models/Shop.js';
import { AppError } from '../middleware/errorHandler.js';
import mongoose from 'mongoose';

/**
 * Helper to get the shop owned by the authenticated user
 */
const getShopForOwner = async (userId) => {
  const shop = await Shop.findOne({ owner: userId });
  if (!shop) {
    throw new AppError('No registered shop found for this account. Please register your shop first.', 404);
  }
  return shop;
};

/**
 * Create a new product for authenticated shop owner
 * POST /api/products
 */
export const createProduct = async (req, res, next) => {
  try {
    const shop = await getShopForOwner(req.user._id);

    const {
      name,
      description,
      category,
      brand,
      partNumber,
      SKU,
      price,
      stockQuantity,
      imageUrl,
      isAvailable
    } = req.body;

    if (!name || !name.trim()) throw new AppError('Product name is required', 400);
    if (!SKU || !SKU.trim()) throw new AppError('Product SKU is required', 400);
    if (price === undefined || price === null || Number.isNaN(Number(price)) || Number(price) < 0) {
      throw new AppError('Valid product price (0 or greater) is required', 400);
    }
    if (stockQuantity === undefined || stockQuantity === null || Number.isNaN(Number(stockQuantity)) || Number(stockQuantity) < 0) {
      throw new AppError('Valid stock quantity (0 or greater) is required', 400);
    }

    const trimmedSKU = SKU.trim().toUpperCase();

    // Check SKU duplicate within this shop
    const existing = await Product.findOne({ shopId: shop._id, SKU: trimmedSKU });
    if (existing) {
      throw new AppError(`A product with SKU "${trimmedSKU}" already exists in your shop`, 409);
    }

    let finalCategory = category;
    if (category && !PRODUCT_CATEGORIES.includes(category)) {
      finalCategory = 'Other';
    }

    const product = await Product.create({
      shopId: shop._id,
      name: name.trim(),
      description: (description || '').trim(),
      category: finalCategory || 'Other',
      brand: (brand || 'OEM').trim(),
      partNumber: (partNumber || '').trim(),
      SKU: trimmedSKU,
      price: Number(price),
      stockQuantity: Math.floor(Number(stockQuantity)),
      imageUrl: (imageUrl || '').trim(),
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
      isArchived: false
    });

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      product
    });
  } catch (err) {
    if (err.code === 11000) {
      return next(new AppError('A product with this SKU already exists in your shop', 409));
    }
    next(err);
  }
};

/**
 * Get all products for the authenticated shop owner
 * GET /api/products/my-products
 */
export const getMyProducts = async (req, res, next) => {
  try {
    const shop = await getShopForOwner(req.user._id);

    const { search, category, lowStock, includeArchived } = req.query;
    const filter = { shopId: shop._id };

    if (!includeArchived || includeArchived === 'false') {
      filter.isArchived = false;
    }

    if (category && category !== 'all') {
      filter.category = category;
    }

    if (lowStock === '1' || lowStock === 'true') {
      filter.stockQuantity = { $lte: 5 };
    }

    if (search) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: regex },
        { brand: regex },
        { SKU: regex },
        { partNumber: regex }
      ];
    }

    const products = await Product.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: products.length,
      products
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update an existing product
 * PUT /api/products/:id
 */
export const updateProduct = async (req, res, next) => {
  try {
    const shop = await getShopForOwner(req.user._id);

    const product = await Product.findOne({ _id: req.params.id, shopId: shop._id });
    if (!product) {
      return next(new AppError('Product not found in your shop', 404));
    }

    const {
      name,
      description,
      category,
      brand,
      partNumber,
      SKU,
      price,
      stockQuantity,
      imageUrl,
      isAvailable,
      isArchived
    } = req.body;

    if (name) product.name = name.trim();
    if (description !== undefined) product.description = description.trim();
    if (category) {
      product.category = PRODUCT_CATEGORIES.includes(category) ? category : 'Other';
    }
    if (brand !== undefined) product.brand = brand.trim();
    if (partNumber !== undefined) product.partNumber = partNumber.trim();

    if (SKU && SKU.trim().toUpperCase() !== product.SKU) {
      const newSKU = SKU.trim().toUpperCase();
      const duplicate = await Product.findOne({ shopId: shop._id, SKU: newSKU, _id: { $ne: product._id } });
      if (duplicate) {
        throw new AppError(`A product with SKU "${newSKU}" already exists in your shop`, 409);
      }
      product.SKU = newSKU;
    }

    if (price !== undefined) {
      const numPrice = Number(price);
      if (Number.isNaN(numPrice) || numPrice < 0) {
        throw new AppError('Price cannot be negative', 400);
      }
      product.price = numPrice;
    }

    if (stockQuantity !== undefined) {
      const numStock = Math.floor(Number(stockQuantity));
      if (Number.isNaN(numStock) || numStock < 0) {
        throw new AppError('Stock cannot be negative', 400);
      }
      product.stockQuantity = numStock;
    }

    if (imageUrl !== undefined) product.imageUrl = imageUrl.trim();
    if (isAvailable !== undefined) product.isAvailable = Boolean(isAvailable);
    if (isArchived !== undefined) product.isArchived = Boolean(isArchived);

    await product.save();

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      product
    });
  } catch (err) {
    if (err.code === 11000) {
      return next(new AppError('A product with this SKU already exists in your shop', 409));
    }
    next(err);
  }
};

/**
 * Delete or archive a product
 * DELETE /api/products/:id
 */
export const deleteProduct = async (req, res, next) => {
  try {
    const shop = await getShopForOwner(req.user._id);

    const product = await Product.findOne({ _id: req.params.id, shopId: shop._id });
    if (!product) {
      return next(new AppError('Product not found in your shop', 404));
    }

    // Check if referenced in historical orders
    let isReferenced = false;
    if (mongoose.models.Order) {
      const count = await mongoose.models.Order.countDocuments({
        'items.productId': product._id
      });
      if (count > 0) isReferenced = true;
    }

    if (isReferenced) {
      // Archive instead of destroying order history integrity
      product.isArchived = true;
      product.isAvailable = false;
      await product.save();

      return res.status(200).json({
        success: true,
        message: 'Product is referenced in existing orders and has been safely archived instead of deleted.',
        archived: true,
        product
      });
    }

    await Product.deleteOne({ _id: product._id });

    res.status(200).json({
      success: true,
      message: 'Product deleted permanently',
      archived: false,
      deletedId: req.params.id
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Public Product Catalog with search, filters, pagination, active shop check
 * GET /api/products
 */
export const getPublicProducts = async (req, res, next) => {
  try {
    const {
      search,
      category,
      shopId,
      minPrice,
      maxPrice,
      inStockOnly,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    // First find all active shops
    const activeShops = await Shop.find({ isActive: true }).select('_id');
    const activeShopIds = activeShops.map((s) => s._id);

    const filter = {
      isArchived: false,
      isAvailable: true,
      shopId: { $in: activeShopIds }
    };

    if (shopId) {
      filter.shopId = shopId;
    }

    if (category && category !== 'all' && category !== 'All Categories') {
      filter.category = category;
    }

    if (inStockOnly === 'true' || inStockOnly === '1') {
      filter.stockQuantity = { $gt: 0 };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined && !Number.isNaN(Number(minPrice))) {
        filter.price.$gte = Number(minPrice);
      }
      if (maxPrice !== undefined && !Number.isNaN(Number(maxPrice))) {
        filter.price.$lte = Number(maxPrice);
      }
    }

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [
        { name: regex },
        { brand: regex },
        { SKU: regex },
        { partNumber: regex },
        { description: regex }
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const sortOptions = {};
    if (sortBy === 'price_asc') sortOptions.price = 1;
    else if (sortBy === 'price_desc') sortOptions.price = -1;
    else if (sortBy === 'name') sortOptions.name = 1;
    else sortOptions.createdAt = sortOrder === 'asc' ? 1 : -1;

    const [products, total] = await Promise.all([
      Product.find(filter)
        .populate('shopId', 'name city pinCode location acceptsHomeDelivery acceptsShopPickup deliveryCharge')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      Product.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      count: products.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      products
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Public details of a single product
 * GET /api/products/:id
 */
export const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, isArchived: false })
      .populate('shopId', 'name address city pinCode phone location acceptsHomeDelivery acceptsShopPickup deliveryCharge isActive');

    if (!product) {
      return next(new AppError('Product not found', 404));
    }

    res.status(200).json({
      success: true,
      product
    });
  } catch (err) {
    next(err);
  }
};
