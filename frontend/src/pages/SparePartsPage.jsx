import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Search,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Check,
  X,
  Package,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Store,
  Truck,
  Filter,
  RefreshCw
} from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../utils/api';
import StarRating from '../components/common/StarRating';
import EmptyState from '../components/common/EmptyState';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { formatCurrency } from '../utils/helpers';
import './SparePartsPage.css';

const CATEGORIES = [
  'All',
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

export default function SparePartsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [addedItemNotice, setAddedItemNotice] = useState(null);

  const {
    cart,
    cartItems,
    currentShop,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    subtotal,
    deliveryFee,
    total
  } = useCart();

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (selectedCategory && selectedCategory !== 'All') {
        params.category = selectedCategory;
      }
      if (searchQuery.trim()) {
        params.search = searchQuery.trim();
      }
      if (sortBy) {
        params.sortBy = sortBy;
      }

      const res = await authApi.getProducts(params);
      if (res?.success) {
        setProducts(res.products || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load spare parts marketplace');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, [selectedCategory, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchCatalog();
  };

  const handleAddToCart = (product) => {
    if (product.stockQuantity <= 0) return;
    const res = addToCart(product, 1);
    if (res?.success) {
      setAddedItemNotice(product.name);
      setTimeout(() => setAddedItemNotice(null), 2500);
    }
  };

  const handleProceedToCheckout = () => {
    setIsCartOpen(false);
    navigate('/checkout');
  };

  return (
    <DashboardLayout title="Spare Parts Marketplace">
      <div style={{ maxWidth: '1300px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Marketplace Banner */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#F3F4F6', margin: 0 }}>
              Vehicle Spare Parts Marketplace
            </h1>
            <p style={{ color: '#9CA3AF', fontSize: '0.925rem', marginTop: '0.25rem', margin: 0 }}>
              Genuine OEM & aftermarket parts from verified local auto shops. Delivered to your doorstep or ready for pickup.
            </p>
          </div>

          {/* Floating Cart Trigger */}
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setIsCartOpen(true)}
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#EF4444',
              color: '#FFFFFF',
              border: 'none',
              padding: '0.65rem 1.25rem',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.875rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(239, 68, 68, 0.35)'
            }}
          >
            <ShoppingCart size={18} />
            <span>Cart ({totalItems})</span>
            {totalItems > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-7px',
                  right: '-7px',
                  backgroundColor: '#FFFFFF',
                  color: '#EF4444',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.3)'
                }}
              >
                {totalItems}
              </span>
            )}
          </button>
        </div>

        {/* Added Item Notification */}
        {addedItemNotice && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', color: '#6EE7B7', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <CheckCircle2 size={18} />
            <span>Added &quot;{addedItemNotice}&quot; to your cart</span>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', color: '#FCA5A5', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Search, Filter & Sort Controls */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.85rem', backgroundColor: '#181B22', padding: '1rem', borderRadius: '12px', border: '1px solid #2B313E', alignItems: 'center', justifyContent: 'space-between' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 300px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
              <input
                type="text"
                placeholder="Search spare parts by name, brand, part #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem 0.6rem 2.4rem',
                  backgroundColor: '#111318',
                  border: '1px solid #303641',
                  borderRadius: '8px',
                  color: '#E5E7EB',
                  fontSize: '0.875rem'
                }}
              />
            </div>
            <button
              type="submit"
              style={{
                padding: '0.6rem 1rem',
                backgroundColor: '#374151',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Search
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{
                padding: '0.6rem 0.85rem',
                backgroundColor: '#111318',
                border: '1px solid #303641',
                borderRadius: '8px',
                color: '#E5E7EB',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              <option value="createdAt">Newest First</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name">Alphabetical</option>
            </select>

            <button
              type="button"
              onClick={fetchCatalog}
              style={{
                padding: '0.6rem',
                backgroundColor: '#111318',
                border: '1px solid #303641',
                borderRadius: '8px',
                color: '#9CA3AF',
                cursor: 'pointer'
              }}
              title="Refresh Products"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: '20px',
                  border: `1px solid ${isSelected ? '#EF4444' : '#303641'}`,
                  backgroundColor: isSelected ? 'rgba(239, 68, 68, 0.15)' : '#181B22',
                  color: isSelected ? '#FFFFFF' : '#9CA3AF',
                  fontSize: '0.82rem',
                  fontWeight: isSelected ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Current Active Shop Banner if cart has items */}
        {currentShop && totalItems > 0 && (
          <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: '10px', padding: '0.75rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#93C5FD' }}>
              <Store size={16} />
              <span>
                Current Cart Store: <strong>{currentShop.name}</strong> ({currentShop.city || 'Local Store'})
              </span>
            </div>
            <div style={{ fontSize: '0.8rem', color: '#60A5FA' }}>
              Delivery Fee: ₹{currentShop.deliveryCharge} • {currentShop.acceptsHomeDelivery ? 'Delivery' : ''} {currentShop.acceptsShopPickup ? '• Pickup' : ''}
            </div>
          </div>
        )}

        {/* Product Catalog Grid */}
        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center' }}>
            <LoadingSpinner size="lg" message="Loading spare parts catalog..." />
          </div>
        ) : products.length === 0 ? (
          <div style={{ backgroundColor: '#181B22', borderRadius: '12px', padding: '4rem', border: '1px solid #2B313E' }}>
            <EmptyState
              icon={Package}
              title="No Products Found"
              description="No spare parts match your current category or search criteria."
              actionText="Reset Filters"
              onAction={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
            />
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '1.25rem'
            }}
          >
            {products.map((product) => {
              const isOutOfStock = product.stockQuantity <= 0;
              const isLowStock = product.stockQuantity > 0 && product.stockQuantity <= 5;
              const shopInfo = product.shopId || {};

              return (
                <div
                  key={product._id || product.id}
                  style={{
                    backgroundColor: '#181B22',
                    border: '1px solid #2B313E',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s ease, border-color 0.2s ease'
                  }}
                >
                  {/* Product Image */}
                  <div
                    style={{
                      height: '160px',
                      backgroundColor: '#111318',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                      borderBottom: '1px solid #2B313E'
                    }}
                  >
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <Package size={48} color="#4B5563" />
                    )}

                    {/* Category Tag */}
                    <span
                      style={{
                        position: 'absolute',
                        top: '10px',
                        left: '10px',
                        backgroundColor: 'rgba(17, 19, 24, 0.85)',
                        backdropFilter: 'blur(4px)',
                        color: '#9CA3AF',
                        fontSize: '0.72rem',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        border: '1px solid #303641',
                        fontWeight: 600
                      }}
                    >
                      {product.category}
                    </span>

                    {/* Stock Badge */}
                    <span
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        backgroundColor: isOutOfStock
                          ? 'rgba(239, 68, 68, 0.9)'
                          : isLowStock
                          ? 'rgba(245, 158, 11, 0.9)'
                          : 'rgba(16, 185, 129, 0.85)',
                        color: '#FFFFFF',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px'
                      }}
                    >
                      {isOutOfStock ? 'Out of Stock' : isLowStock ? `Only ${product.stockQuantity} left` : 'In Stock'}
                    </span>
                  </div>

                  {/* Body Content */}
                  <div style={{ padding: '1.15rem', display: 'flex', flexDirection: 'column', flex: 1, gap: '0.65rem' }}>
                    {/* Shop details */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: '#60A5FA' }}>
                      <Store size={13} />
                      <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {shopInfo.name || 'Verified Shop'}
                      </span>
                      {shopInfo.city && <span style={{ color: '#6B7280' }}>• {shopInfo.city}</span>}
                    </div>

                    {/* Name */}
                    <h3 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700, color: '#F3F4F6', lineHeight: 1.35, minHeight: '2.7em' }}>
                      {product.name}
                    </h3>

                    {/* Brand & SKU */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: '#9CA3AF' }}>
                      <span>Brand: <strong>{product.brand || 'OEM'}</strong></span>
                      <span style={{ fontFamily: 'monospace' }}>SKU: {product.SKU}</span>
                    </div>

                    {/* Price & Add to Cart Action */}
                    <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid #232731', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <div style={{ fontSize: '0.7rem', color: '#9CA3AF', textTransform: 'uppercase' }}>Price</div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#10B981' }}>
                          ₹{Number(product.price).toLocaleString('en-IN')}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleAddToCart(product)}
                        disabled={isOutOfStock}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          backgroundColor: isOutOfStock ? '#374151' : '#2563EB',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '0.55rem 0.9rem',
                          borderRadius: '8px',
                          fontWeight: 600,
                          fontSize: '0.82rem',
                          cursor: isOutOfStock ? 'not-allowed' : 'pointer',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        <Plus size={15} />
                        <span>{isOutOfStock ? 'Sold Out' : 'Add'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Slide-out Cart Drawer */}
        {isCartOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(3px)',
              zIndex: 999,
              display: 'flex',
              justifyContent: 'flex-end'
            }}
            onClick={() => setIsCartOpen(false)}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '440px',
                height: '100%',
                backgroundColor: '#181B22',
                borderLeft: '1px solid #2B313E',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.5)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Drawer Header */}
              <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #2B313E', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <ShoppingCart size={20} color="#EF4444" />
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: '#F3F4F6' }}>
                    Your Cart ({totalItems})
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCartOpen(false)}
                  style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Shop Badge */}
              {currentShop && (
                <div style={{ padding: '0.75rem 1.5rem', backgroundColor: '#111318', borderBottom: '1px solid #232731', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: '#93C5FD' }}>
                  <Store size={15} />
                  <span>Fulfilling Shop: <strong>{currentShop.name}</strong></span>
                </div>
              )}

              {/* Cart Items List */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {cartItems.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#9CA3AF' }}>
                    <ShoppingCart size={40} style={{ margin: '0 auto 1rem', opacity: 0.4 }} />
                    <p style={{ margin: 0, fontWeight: 600 }}>Your cart is empty</p>
                    <p style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>Browse spare parts above and add items to your cart.</p>
                  </div>
                ) : (
                  cartItems.map((item) => {
                    const itemId = item._id || item.id;
                    return (
                      <div
                        key={itemId}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.85rem',
                          backgroundColor: '#111318',
                          padding: '0.85rem',
                          borderRadius: '8px',
                          border: '1px solid #2B313E'
                        }}
                      >
                        <div
                          style={{
                            width: '46px',
                            height: '46px',
                            borderRadius: '6px',
                            backgroundColor: '#1F2430',
                            overflow: 'hidden',
                            flexShrink: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                        >
                          {item.imageUrl ? (
                            <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <Package size={20} color="#6B7280" />
                          )}
                        </div>

                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 600, color: '#F3F4F6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {item.name}
                          </h4>
                          <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                            ₹{Number(item.price).toLocaleString('en-IN')} each
                          </div>

                          {/* Quantity Controls */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.4rem' }}>
                            <button
                              type="button"
                              onClick={() => updateQuantity(itemId, item.quantity - 1)}
                              style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '4px',
                                backgroundColor: '#2B313E',
                                border: 'none',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                              }}
                            >
                              <Minus size={12} />
                            </button>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff', minWidth: '18px', textAlign: 'center' }}>
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(itemId, item.quantity + 1)}
                              style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '4px',
                                backgroundColor: '#2B313E',
                                border: 'none',
                                color: '#fff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer'
                              }}
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Line Total & Remove */}
                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.4rem' }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#10B981' }}>
                            ₹{(Number(item.price) * item.quantity).toLocaleString('en-IN')}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFromCart(itemId)}
                            style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '0.2rem' }}
                            title="Remove item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Drawer Footer with Totals & Checkout Button */}
              {cartItems.length > 0 && (
                <div style={{ padding: '1.25rem 1.5rem', borderTop: '1px solid #2B313E', backgroundColor: '#111318', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#9CA3AF' }}>
                    <span>Parts Subtotal</span>
                    <span style={{ color: '#E5E7EB', fontWeight: 600 }}>₹{subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#9CA3AF' }}>
                    <span>Estimated Delivery Fee</span>
                    <span style={{ color: '#E5E7EB', fontWeight: 600 }}>₹{deliveryFee}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.05rem', fontWeight: 800, color: '#FFFFFF', paddingTop: '0.5rem', borderTop: '1px solid #232731' }}>
                    <span>Total Amount</span>
                    <span style={{ color: '#10B981' }}>₹{total.toLocaleString('en-IN')}</span>
                  </div>

                  <button
                    type="button"
                    onClick={handleProceedToCheckout}
                    style={{
                      marginTop: '0.5rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      backgroundColor: '#EF4444',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '0.85rem',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(239, 68, 68, 0.4)'
                    }}
                  >
                    <span>Proceed to Checkout</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
