import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage, STORAGE_KEYS } from '../utils/storage';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const stored = storage.get(STORAGE_KEYS.CART);
    return Array.isArray(stored) ? stored : [];
  });

  const [currentShop, setCurrentShop] = useState(() => {
    const stored = storage.get('roadrescue_cart_shop');
    return stored || null;
  });

  const [shopConflictWarning, setShopConflictWarning] = useState(null);

  useEffect(() => {
    storage.set(STORAGE_KEYS.CART, cartItems);
    if (cartItems.length === 0) {
      setCurrentShop(null);
      storage.remove('roadrescue_cart_shop');
    } else if (currentShop) {
      storage.set('roadrescue_cart_shop', currentShop);
    }
  }, [cartItems, currentShop]);

  const cartCount = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);

  const cartTotal = cartItems.reduce(
    (acc, item) => acc + (Number(item.price) || 0) * (item.quantity || 1),
    0
  );

  /**
   * Add to cart with Single-Shop rule enforcement
   */
  const addToCart = (product, quantity = 1, forceReplace = false) => {
    const prodId = product._id || product.id;
    const prodShop = product.shopId?._id ? product.shopId : product.shop || { _id: product.shopId, name: 'Spare Parts Store' };
    const prodShopId = (typeof prodShop === 'object' ? prodShop._id || prodShop.id : prodShop) || 'default_shop';

    // Check Single Shop constraint
    if (cartItems.length > 0 && currentShop && currentShop.id !== prodShopId && !forceReplace) {
      setShopConflictWarning({
        existingShopName: currentShop.name || 'another shop',
        newShopName: prodShop.name || 'this shop',
        pendingProduct: product,
        pendingQuantity: quantity
      });
      return {
        success: false,
        conflict: true,
        message: `Your cart contains items from "${currentShop.name}". An order can only be fulfilled by one shop at a time.`
      };
    }

    // Set or preserve current shop
    const shopMeta = {
      id: prodShopId,
      name: prodShop.name || 'Spare Parts Store',
      deliveryCharge: prodShop.deliveryCharge !== undefined ? prodShop.deliveryCharge : 50,
      acceptsHomeDelivery: prodShop.acceptsHomeDelivery !== undefined ? prodShop.acceptsHomeDelivery : true,
      acceptsShopPickup: prodShop.acceptsShopPickup !== undefined ? prodShop.acceptsShopPickup : true,
      address: prodShop.address || '',
      city: prodShop.city || '',
      pinCode: prodShop.pinCode || '',
      phone: prodShop.phone || ''
    };
    setCurrentShop(shopMeta);

    setCartItems((prev) => {
      const itemsToSearch = forceReplace ? [] : prev;
      const existingIndex = itemsToSearch.findIndex((item) => (item._id || item.id) === prodId);

      if (existingIndex > -1) {
        const updated = [...itemsToSearch];
        const newQty = (updated[existingIndex].quantity || 1) + quantity;
        const maxStock = product.stockQuantity !== undefined ? product.stockQuantity : 999;
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: Math.min(newQty, maxStock)
        };
        return updated;
      }

      return [
        ...itemsToSearch,
        {
          _id: prodId,
          id: prodId,
          productId: prodId,
          name: product.name,
          brand: product.brand || 'OEM',
          SKU: product.SKU,
          partNumber: product.partNumber || '',
          price: Number(product.price),
          stockQuantity: product.stockQuantity,
          imageUrl: product.imageUrl || '',
          shopId: prodShopId,
          quantity: Math.min(quantity, product.stockQuantity || quantity)
        }
      ];
    });

    setShopConflictWarning(null);
    return { success: true };
  };

  const resolveConflict = (proceedWithNewShop) => {
    if (!shopConflictWarning) return;
    if (proceedWithNewShop) {
      clearCart();
      addToCart(shopConflictWarning.pendingProduct, shopConflictWarning.pendingQuantity, true);
    }
    setShopConflictWarning(null);
  };

  const removeFromCart = (productId) => {
    setCartItems((prev) => prev.filter((item) => (item._id || item.id) !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) => {
        if ((item._id || item.id) === productId) {
          const maxStock = item.stockQuantity !== undefined ? item.stockQuantity : 999;
          return { ...item, quantity: Math.min(quantity, maxStock) };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setCartItems([]);
    setCurrentShop(null);
    setShopConflictWarning(null);
    storage.remove(STORAGE_KEYS.CART);
    storage.remove('roadrescue_cart_shop');
  };

  const deliveryFee = cartItems.length > 0 && currentShop ? currentShop.deliveryCharge : 0;
  const total = cartTotal + deliveryFee;

  const value = {
    cartItems,
    cart: cartItems,
    currentShop,
    shopConflictWarning,
    resolveConflict,
    cartCount,
    totalItems: cartCount,
    cartTotal,
    subtotal: cartTotal,
    deliveryFee,
    total,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
      {/* Global Conflict Modal if triggered */}
      {shopConflictWarning && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
        >
          <div
            style={{
              backgroundColor: '#181B22',
              border: '1px solid #303641',
              borderRadius: '12px',
              padding: '1.75rem',
              maxWidth: '460px',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
              boxShadow: '0 20px 40px rgba(0,0,0,0.6)'
            }}
          >
            <h3 style={{ margin: 0, color: '#F3F4F6', fontSize: '1.2rem', fontWeight: 700 }}>
              Different Shop Detected
            </h3>
            <p style={{ margin: 0, color: '#9CA3AF', fontSize: '0.875rem', lineHeight: 1.5 }}>
              Your cart currently contains spare parts from <strong>{shopConflictWarning.existingShopName}</strong>. An order can only be placed from one shop at a time.
            </p>
            <p style={{ margin: 0, color: '#E5E7EB', fontSize: '0.875rem' }}>
              Would you like to clear your current cart and add this item from <strong>{shopConflictWarning.newShopName}</strong> instead?
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={() => resolveConflict(false)}
                style={{
                  padding: '0.6rem 1.2rem',
                  backgroundColor: '#374151',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#E5E7EB',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Keep Existing Cart
              </button>
              <button
                type="button"
                onClick={() => resolveConflict(true)}
                style={{
                  padding: '0.6rem 1.2rem',
                  backgroundColor: '#EF4444',
                  border: 'none',
                  borderRadius: '8px',
                  color: '#FFFFFF',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer'
                }}
              >
                Clear Cart & Add
              </button>
            </div>
          </div>
        </div>
      )}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export default CartContext;
