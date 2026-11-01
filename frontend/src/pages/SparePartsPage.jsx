import React, { useState, useMemo } from 'react';
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
  CheckCircle2
} from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { spareParts } from '../data/spareParts';
import { useCart } from '../context/CartContext';
import StarRating from '../components/common/StarRating';
import EmptyState from '../components/common/EmptyState';
import { formatCurrency } from '../utils/helpers';

const CATEGORIES = [
  'All',
  'Batteries',
  'Tyres',
  'Brake Parts',
  'Engine Parts',
  'Filters',
  'Accessories',
  'Other Parts'
];

const SparePartsPage = () => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    totalItems,
    subtotal,
    deliveryFee,
    total
  } = useCart();

  const filteredParts = useMemo(() => {
    return spareParts.filter((item) => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  const handleCheckout = () => {
    setOrderPlaced(true);
    setTimeout(() => {
      clearCart();
      setOrderPlaced(false);
      setIsCartOpen(false);
    }, 2500);
  };

  return (
    <DashboardLayout title="Spare Parts Store">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>Genuine Auto Parts & Accessories</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
            Direct manufacturer OEM replacement parts delivered directly to your breakdown spot
          </p>
        </div>

        {/* Floating Cart Trigger */}
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setIsCartOpen(true)}
          style={{ position: 'relative' }}
        >
          <ShoppingCart size={18} />
          <span>Cart ({totalItems})</span>
          {totalItems > 0 && (
            <span
              style={{
                backgroundColor: '#ffffff',
                color: 'var(--accent-primary)',
                fontWeight: 800,
                fontSize: '0.75rem',
                padding: '2px 6px',
                borderRadius: '10px'
              }}
            >
              {formatCurrency(total)}
            </span>
          )}
        </button>
      </div>

      {/* Category Pills & Search */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <Search
            size={18}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)'
            }}
          />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '2.5rem' }}
            placeholder="Search spare parts by name (e.g. Bosch Battery, Castrol Oil, Brembo Brake Pads)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: selectedCategory === cat ? 'var(--accent-primary)' : 'var(--bg-card)',
                color: selectedCategory === cat ? '#ffffff' : 'var(--text-secondary)',
                border: `1px solid ${selectedCategory === cat ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                fontSize: '0.875rem',
                fontWeight: 500,
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Parts Grid */}
      {filteredParts.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No spare parts found"
          description="Try selecting a different category or refining your search term."
          actionLabel="View All Products"
          onAction={() => {
            setSelectedCategory('All');
            setSearchQuery('');
          }}
        />
      ) : (
        <div className="grid grid-cols-3 gap-6">
          {filteredParts.map((item) => {
            const inCart = cart.find((c) => c.id === item.id);

            return (
              <div
                key={item.id}
                className="card card-hover"
                style={{ display: 'flex', flexDirection: 'column', padding: '1.25rem' }}
              >
                {/* Brand & Category */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: 'var(--accent-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em'
                    }}
                  >
                    {item.brand}
                  </span>
                  <span
                    className="badge badge-secondary"
                    style={{ fontSize: '0.7rem' }}
                  >
                    {item.category}
                  </span>
                </div>

                {/* Product Name */}
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.5rem', minHeight: '2.5rem' }}>
                  {item.name}
                </h3>

                {/* Description */}
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: '1rem', flex: 1, lineHeight: 1.5 }}>
                  {item.description}
                </p>

                {/* Compatibility Tags */}
                <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
                  {item.compatibleWith.map((comp) => (
                    <span
                      key={comp}
                      style={{
                        fontSize: '0.7rem',
                        padding: '0.15rem 0.5rem',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-muted)'
                      }}
                    >
                      Fits: {comp}
                    </span>
                  ))}
                </div>

                {/* Rating & Stock */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <StarRating rating={item.rating} reviewCount={item.reviewCount} size={14} />
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: item.availability === 'In Stock' ? 'var(--success)' : 'var(--warning)',
                      fontWeight: 600
                    }}
                  >
                    ● {item.availability}
                  </span>
                </div>

                {/* Price and Cart Button */}
                <div
                  style={{
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {formatCurrency(item.price)}
                    </div>
                    {item.originalPrice && (
                      <span
                        style={{
                          fontSize: '0.75rem',
                          textDecoration: 'line-through',
                          color: 'var(--text-muted)'
                        }}
                      >
                        {formatCurrency(item.originalPrice)}
                      </span>
                    )}
                  </div>

                  {inCart ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => updateQuantity(item.id, inCart.quantity - 1)}
                      >
                        <Minus size={14} />
                      </button>
                      <span style={{ fontWeight: 700, minWidth: '18px', textAlign: 'center' }}>
                        {inCart.quantity}
                      </span>
                      <button
                        type="button"
                        className="btn btn-sm btn-secondary"
                        onClick={() => updateQuantity(item.id, inCart.quantity + 1)}
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => addToCart(item, 1)}
                    >
                      <Plus size={14} /> Add to Cart
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cart Drawer Slide-Over */}
      {isCartOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 300,
            display: 'flex',
            justifyContent: 'flex-end',
            backdropFilter: 'blur(3px)'
          }}
          onClick={() => setIsCartOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '420px',
              backgroundColor: 'var(--bg-secondary)',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-lg)',
              borderLeft: '1px solid var(--border-color)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Cart Header */}
            <div
              style={{
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShoppingCart size={20} color="var(--accent-primary)" />
                <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Your Cart ({totalItems})</h2>
              </div>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setIsCartOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            {/* Cart Items List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
              {orderPlaced ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                  <div
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      backgroundColor: 'rgba(34, 197, 94, 0.2)',
                      color: 'var(--success)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginBottom: '1rem'
                    }}
                  >
                    <CheckCircle2 size={32} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                    Order Dispatched!
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                    A courier van is carrying your selected spares to your GPS location.
                  </p>
                </div>
              ) : cart.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                  <Package size={44} color="var(--text-muted)" style={{ margin: '0 auto 1rem' }} />
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.5rem' }}>
                    Your cart is empty
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    Explore our catalog of genuine spare parts and add required items.
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {cart.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        padding: '1rem',
                        backgroundColor: 'var(--bg-card)',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border-color)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h4 style={{ fontSize: '0.9rem', fontWeight: 600 }}>{item.name}</h4>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.brand}</span>
                        </div>
                        <button
                          type="button"
                          className="btn-ghost"
                          style={{ padding: '2px', color: 'var(--text-muted)' }}
                          onClick={() => removeFromCart(item.id)}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700 }}>
                          {formatCurrency(item.price * item.quantity)}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            style={{ padding: '0.2rem 0.5rem' }}
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          >
                            <Minus size={12} />
                          </button>
                          <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.quantity}</span>
                          <button
                            type="button"
                            className="btn btn-sm btn-secondary"
                            style={{ padding: '0.2rem 0.5rem' }}
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          >
                            <Plus size={12} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cart Footer Summary */}
            {cart.length > 0 && !orderPlaced && (
              <div
                style={{
                  padding: '1.25rem 1.5rem',
                  borderTop: '1px solid var(--border-color)',
                  backgroundColor: 'var(--bg-card)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.75rem'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Express Breakdown Courier</span>
                  <span>{deliveryFee === 0 ? 'FREE' : formatCurrency(deliveryFee)}</span>
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    paddingTop: '0.5rem',
                    borderTop: '1px solid var(--border-color)'
                  }}
                >
                  <span>Total Amount</span>
                  <span style={{ color: 'var(--accent-primary)' }}>{formatCurrency(total)}</span>
                </div>

                <button
                  type="button"
                  className="btn btn-primary btn-block btn-lg"
                  style={{ marginTop: '0.5rem' }}
                  onClick={handleCheckout}
                >
                  Proceed to Instant Delivery
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default SparePartsPage;
