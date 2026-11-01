import React, { createContext, useContext, useState, useEffect } from 'react';
import { storage, STORAGE_KEYS } from '../utils/storage';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const stored = storage.get(STORAGE_KEYS.CART);
    return Array.isArray(stored) ? stored : [];
  });

  useEffect(() => {
    storage.set(STORAGE_KEYS.CART, cartItems);
  }, [cartItems]);

  const cartCount = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);

  const cartTotal = cartItems.reduce(
    (acc, item) => acc + (Number(item.price) || 0) * (item.quantity || 1),
    0
  );

  const addToCart = (product, quantity = 1) => {
    setCartItems(prev => {
      const existingIndex = prev.findIndex(item => item.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: (updated[existingIndex].quantity || 1) + quantity
        };
        return updated;
      }
      return [...prev, { ...product, quantity }];
    });
  };

  const removeFromCart = (productId) => {
    setCartItems(prev => prev.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCartItems(prev =>
      prev.map(item => (item.id === productId ? { ...item, quantity } : item))
    );
  };

  const clearCart = () => {
    setCartItems([]);
    storage.remove(STORAGE_KEYS.CART);
  };

  const deliveryFee = cartItems.length > 0 ? 99 : 0;
  const total = cartTotal + deliveryFee;

  const value = {
    cartItems,
    cart: cartItems,
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
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    const stored = storage.get(STORAGE_KEYS.CART) || [];
    const count = stored.reduce((acc, item) => acc + (item.quantity || 1), 0);
    const subtotal = stored.reduce((acc, item) => acc + (Number(item.price) || 0) * (item.quantity || 1), 0);
    const fee = count > 0 ? 99 : 0;
    return {
      cartItems: stored,
      cart: stored,
      cartCount: count,
      totalItems: count,
      cartTotal: subtotal,
      subtotal: subtotal,
      deliveryFee: fee,
      total: subtotal + fee,
      addToCart: () => {},
      removeFromCart: () => {},
      updateQuantity: () => {},
      clearCart: () => {}
    };
  }
  return context;
};

export default CartContext;
