import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Tag,
  DollarSign,
  Layers,
  ArrowUpDown,
  RefreshCw,
  X,
  Image as ImageIcon
} from 'lucide-react';
import ShopDashboardLayout from '../layouts/ShopDashboardLayout';
import { authApi } from '../utils/api';
import { formatCurrency } from '../utils/helpers';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmptyState from '../components/common/EmptyState';

const CATEGORIES = [
  'All Categories',
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

export default function ShopProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [lowStockFilter, setLowStockFilter] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    category: 'Brakes',
    brand: '',
    partNumber: '',
    SKU: '',
    price: '',
    stockQuantity: '',
    imageUrl: '',
    description: '',
    isAvailable: true
  });

  // Open Add modal if query parameter ?new=1 is present
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      handleOpenAddModal();
      searchParams.delete('new');
      setSearchParams(searchParams);
    }
  }, [searchParams]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (selectedCategory && selectedCategory !== 'All Categories') {
        params.category = selectedCategory;
      }
      if (searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      if (lowStockFilter) {
        params.lowStock = '1';
      }

      const res = await authApi.getMyProducts(params);
      if (res?.success) {
        setProducts(res.products || []);
      }
    } catch (err) {
      setError(err.message || 'Failed to load shop products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, lowStockFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: 'Brakes',
      brand: 'OEM',
      partNumber: '',
      SKU: `SKU-${Date.now().toString().slice(-6)}`,
      price: '',
      stockQuantity: '10',
      imageUrl: '',
      description: '',
      isAvailable: true
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name || '',
      category: product.category || 'Other',
      brand: product.brand || '',
      partNumber: product.partNumber || '',
      SKU: product.SKU || '',
      price: product.price !== undefined ? String(product.price) : '',
      stockQuantity: product.stockQuantity !== undefined ? String(product.stockQuantity) : '',
      imageUrl: product.imageUrl || '',
      description: product.description || '',
      isAvailable: Boolean(product.isAvailable)
    });
    setModalError('');
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setModalError('');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    if (!formData.name.trim()) {
      setModalError('Product name is required');
      return;
    }
    if (!formData.SKU.trim()) {
      setModalError('Product SKU is required');
      return;
    }
    if (formData.price === '' || Number(formData.price) < 0) {
      setModalError('Valid price is required');
      return;
    }
    if (formData.stockQuantity === '' || Number(formData.stockQuantity) < 0) {
      setModalError('Valid stock quantity is required');
      return;
    }

    setModalSubmitting(true);
    try {
      const payload = {
        name: formData.name.trim(),
        category: formData.category,
        brand: formData.brand.trim() || 'OEM',
        partNumber: formData.partNumber.trim(),
        SKU: formData.SKU.trim().toUpperCase(),
        price: Number(formData.price),
        stockQuantity: Math.floor(Number(formData.stockQuantity)),
        imageUrl: formData.imageUrl.trim(),
        description: formData.description.trim(),
        isAvailable: formData.isAvailable
      };

      if (editingProduct) {
        await authApi.updateProduct(editingProduct._id || editingProduct.id, payload);
        setSuccessMsg(`Product "${payload.name}" updated successfully`);
      } else {
        await authApi.createProduct(payload);
        setSuccessMsg(`Product "${payload.name}" added to inventory`);
      }

      handleModalClose();
      fetchProducts();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setModalError(err.message || 'Failed to save product');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleToggleAvailability = async (product) => {
    try {
      const newStatus = !product.isAvailable;
      await authApi.updateProduct(product._id || product.id, { isAvailable: newStatus });
      setProducts((prev) =>
        prev.map((p) =>
          (p._id === product._id || p.id === product.id ? { ...p, isAvailable: newStatus } : p)
        )
      );
    } catch (err) {
      setError(err.message || 'Failed to toggle availability');
    }
  };

  const handleDeleteProduct = async (product) => {
    const confirmMsg = `Are you sure you want to remove "${product.name}"? If it is attached to past orders, it will be safely archived.`;
    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await authApi.deleteProduct(product._id || product.id);
      if (res?.archived) {
        setSuccessMsg(`Product "${product.name}" is linked to orders and has been safely archived.`);
      } else {
        setSuccessMsg(`Product "${product.name}" deleted successfully.`);
      }
      fetchProducts();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setError(err.message || 'Failed to delete product');
    }
  };

  return (
    <ShopDashboardLayout title="Products & Inventory">
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#F3F4F6', margin: 0 }}>
              Inventory Management
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#9CA3AF', marginTop: '0.25rem', margin: 0 }}>
              Manage spare parts catalog, pricing, and stock availability for customers.
            </p>
          </div>
          <button
            onClick={handleOpenAddModal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              border: 'none',
              padding: '0.65rem 1.25rem',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.3)',
              transition: 'background 0.2s ease'
            }}
          >
            <Plus size={18} />
            <span>Add New Product</span>
          </button>
        </div>

        {/* Alerts */}
        {error && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', color: '#FCA5A5', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
        )}
        {successMsg && (
          <div style={{ padding: '0.75rem 1rem', borderRadius: '8px', backgroundColor: 'rgba(16, 185, 129, 0.15)', border: '1px solid #10B981', color: '#6EE7B7', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
            <CheckCircle2 size={18} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Filter & Search Bar */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', backgroundColor: '#181B22', padding: '1rem', borderRadius: '12px', border: '1px solid #2B313E', alignItems: 'center', justifyContent: 'space-between' }}>
          <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: '1 1 280px' }}>
            <div style={{ position: 'relative', width: '100%' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#6B7280' }} />
              <input
                type="text"
                placeholder="Search products by name, brand, SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
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
            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
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
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            {/* Low Stock Toggle */}
            <button
              type="button"
              onClick={() => setLowStockFilter(!lowStockFilter)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.6rem 0.85rem',
                borderRadius: '8px',
                border: `1px solid ${lowStockFilter ? '#F59E0B' : '#303641'}`,
                backgroundColor: lowStockFilter ? 'rgba(245, 158, 11, 0.15)' : '#111318',
                color: lowStockFilter ? '#FBBF24' : '#9CA3AF',
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              <AlertTriangle size={15} />
              <span>Low Stock (&le; 5)</span>
            </button>

            <button
              type="button"
              onClick={fetchProducts}
              style={{
                padding: '0.6rem',
                backgroundColor: '#111318',
                border: '1px solid #303641',
                borderRadius: '8px',
                color: '#9CA3AF',
                cursor: 'pointer'
              }}
              title="Refresh Catalog"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Products Table */}
        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center' }}>
            <LoadingSpinner size="lg" message="Loading your inventory..." />
          </div>
        ) : products.length === 0 ? (
          <div style={{ backgroundColor: '#181B22', borderRadius: '12px', padding: '3rem', border: '1px solid #2B313E' }}>
            <EmptyState
              icon={Package}
              title="No Products Found"
              description="You have not added any spare parts yet or no products matched your filter."
              actionText="Add First Product"
              onAction={handleOpenAddModal}
            />
          </div>
        ) : (
          <div style={{ backgroundColor: '#181B22', borderRadius: '12px', border: '1px solid #2B313E', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #2B313E', color: '#9CA3AF', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '0.85rem 1rem' }}>Product</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Category</th>
                    <th style={{ padding: '0.85rem 1rem' }}>SKU</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Price</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Stock</th>
                    <th style={{ padding: '0.85rem 1rem' }}>Status</th>
                    <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const isOutOfStock = p.stockQuantity === 0;
                    const isLowStock = p.stockQuantity > 0 && p.stockQuantity <= 5;
                    return (
                      <tr key={p._id || p.id} style={{ borderBottom: '1px solid #232731', transition: 'background 0.15s ease' }}>
                        {/* Product Info */}
                        <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <div
                            style={{
                              width: '42px',
                              height: '42px',
                              borderRadius: '8px',
                              backgroundColor: '#111318',
                              border: '1px solid #303641',
                              overflow: 'hidden',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0
                            }}
                          >
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
                            ) : (
                              <Package size={20} color="#6B7280" />
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: '#F3F4F6' }}>{p.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                              {p.brand} {p.partNumber && `• Part #${p.partNumber}`}
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td style={{ padding: '1rem', color: '#D1D5DB' }}>
                          <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', backgroundColor: '#232731', fontSize: '0.75rem', color: '#9CA3AF' }}>
                            {p.category}
                          </span>
                        </td>

                        {/* SKU */}
                        <td style={{ padding: '1rem', fontFamily: 'monospace', color: '#93C5FD', fontWeight: 600 }}>
                          {p.SKU}
                        </td>

                        {/* Price */}
                        <td style={{ padding: '1rem', fontWeight: 700, color: '#10B981' }}>
                          ₹{Number(p.price).toLocaleString('en-IN')}
                        </td>

                        {/* Stock */}
                        <td style={{ padding: '1rem' }}>
                          {isOutOfStock ? (
                            <span style={{ padding: '0.25rem 0.6rem', borderRadius: '20px', backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', fontSize: '0.75rem', fontWeight: 700 }}>
                              Out of Stock (0)
                            </span>
                          ) : isLowStock ? (
                            <span style={{ padding: '0.25rem 0.6rem', borderRadius: '20px', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#F59E0B', fontSize: '0.75rem', fontWeight: 700 }}>
                              Low Stock ({p.stockQuantity})
                            </span>
                          ) : (
                            <span style={{ padding: '0.25rem 0.6rem', borderRadius: '20px', backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#10B981', fontSize: '0.75rem', fontWeight: 700 }}>
                              {p.stockQuantity} in stock
                            </span>
                          )}
                        </td>

                        {/* Availability */}
                        <td style={{ padding: '1rem' }}>
                          <button
                            type="button"
                            onClick={() => handleToggleAvailability(p)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.25rem 0.6rem',
                              borderRadius: '6px',
                              border: `1px solid ${p.isAvailable ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                              backgroundColor: p.isAvailable ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                              color: p.isAvailable ? '#34D399' : '#F87171',
                              fontSize: '0.75rem',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            {p.isAvailable ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                            <span>{p.isAvailable ? 'Active' : 'Hidden'}</span>
                          </button>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '1rem', textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(p)}
                              style={{
                                padding: '0.4rem',
                                borderRadius: '6px',
                                backgroundColor: '#232731',
                                border: '1px solid #303641',
                                color: '#60A5FA',
                                cursor: 'pointer'
                              }}
                              title="Edit Product"
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(p)}
                              style={{
                                padding: '0.4rem',
                                borderRadius: '6px',
                                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                color: '#EF4444',
                                cursor: 'pointer'
                              }}
                              title="Delete or Archive Product"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Add/Edit Product Modal */}
        {isModalOpen && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(4px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1rem'
            }}
          >
            <div
              style={{
                backgroundColor: '#181B22',
                border: '1px solid #2B313E',
                borderRadius: '14px',
                width: '100%',
                maxWidth: '580px',
                maxHeight: '90vh',
                overflowY: 'auto',
                padding: '1.75rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.25rem',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#F3F4F6' }}>
                  {editingProduct ? 'Edit Spare Part Product' : 'Add New Spare Part Product'}
                </h3>
                <button
                  type="button"
                  onClick={handleModalClose}
                  style={{ background: 'transparent', border: 'none', color: '#9CA3AF', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              {modalError && (
                <div style={{ padding: '0.65rem 0.85rem', borderRadius: '8px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', color: '#FCA5A5', fontSize: '0.85rem' }}>
                  {modalError}
                </div>
              )}

              <form onSubmit={handleModalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Product Name */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#D1D5DB', marginBottom: '0.35rem' }}>
                    Product Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Front Ceramic Brake Pads (Set of 4)"
                    required
                    style={{ width: '100%', padding: '0.65rem', backgroundColor: '#111318', border: '1px solid #303641', borderRadius: '8px', color: '#fff', fontSize: '0.875rem' }}
                  />
                </div>

                {/* Category & Brand */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#D1D5DB', marginBottom: '0.35rem' }}>
                      Category *
                    </label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      style={{ width: '100%', padding: '0.65rem', backgroundColor: '#111318', border: '1px solid #303641', borderRadius: '8px', color: '#fff', fontSize: '0.875rem' }}
                    >
                      {CATEGORIES.filter((c) => c !== 'All Categories').map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#D1D5DB', marginBottom: '0.35rem' }}>
                      Brand / Manufacturer
                    </label>
                    <input
                      type="text"
                      name="brand"
                      value={formData.brand}
                      onChange={handleInputChange}
                      placeholder="e.g. Bosch / Brembo / OEM"
                      style={{ width: '100%', padding: '0.65rem', backgroundColor: '#111318', border: '1px solid #303641', borderRadius: '8px', color: '#fff', fontSize: '0.875rem' }}
                    />
                  </div>
                </div>

                {/* SKU & Part Number */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#D1D5DB', marginBottom: '0.35rem' }}>
                      SKU (Unique Identifier) *
                    </label>
                    <input
                      type="text"
                      name="SKU"
                      value={formData.SKU}
                      onChange={handleInputChange}
                      placeholder="e.g. BRK-PAD-001"
                      required
                      style={{ width: '100%', padding: '0.65rem', backgroundColor: '#111318', border: '1px solid #303641', borderRadius: '8px', color: '#93C5FD', fontFamily: 'monospace', fontWeight: 600, fontSize: '0.875rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#D1D5DB', marginBottom: '0.35rem' }}>
                      Part Number (Optional)
                    </label>
                    <input
                      type="text"
                      name="partNumber"
                      value={formData.partNumber}
                      onChange={handleInputChange}
                      placeholder="e.g. 0986AB234"
                      style={{ width: '100%', padding: '0.65rem', backgroundColor: '#111318', border: '1px solid #303641', borderRadius: '8px', color: '#fff', fontSize: '0.875rem' }}
                    />
                  </div>
                </div>

                {/* Price & Stock Quantity */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#D1D5DB', marginBottom: '0.35rem' }}>
                      Price (₹) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      name="price"
                      value={formData.price}
                      onChange={handleInputChange}
                      placeholder="1850"
                      required
                      style={{ width: '100%', padding: '0.65rem', backgroundColor: '#111318', border: '1px solid #303641', borderRadius: '8px', color: '#10B981', fontWeight: 700, fontSize: '0.875rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#D1D5DB', marginBottom: '0.35rem' }}>
                      Stock Quantity *
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      name="stockQuantity"
                      value={formData.stockQuantity}
                      onChange={handleInputChange}
                      placeholder="15"
                      required
                      style={{ width: '100%', padding: '0.65rem', backgroundColor: '#111318', border: '1px solid #303641', borderRadius: '8px', color: '#fff', fontSize: '0.875rem' }}
                    />
                  </div>
                </div>

                {/* Image URL */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#D1D5DB', marginBottom: '0.35rem' }}>
                    Product Image URL (Optional)
                  </label>
                  <input
                    type="url"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                    placeholder="https://images.unsplash.com/photo-..."
                    style={{ width: '100%', padding: '0.65rem', backgroundColor: '#111318', border: '1px solid #303641', borderRadius: '8px', color: '#fff', fontSize: '0.875rem' }}
                  />
                </div>

                {/* Description */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#D1D5DB', marginBottom: '0.35rem' }}>
                    Description & Specifications
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Provide part compatibility, material, warranty or installation advice..."
                    style={{ width: '100%', padding: '0.65rem', backgroundColor: '#111318', border: '1px solid #303641', borderRadius: '8px', color: '#fff', fontSize: '0.875rem', resize: 'vertical' }}
                  />
                </div>

                {/* Is Available Toggle */}
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer', fontSize: '0.875rem', color: '#D1D5DB' }}>
                  <input
                    type="checkbox"
                    name="isAvailable"
                    checked={formData.isAvailable}
                    onChange={handleInputChange}
                    style={{ accentColor: '#2563EB', width: '16px', height: '16px' }}
                  />
                  <span>Make this product active and visible on the marketplace</span>
                </label>

                {/* Form Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={handleModalClose}
                    disabled={modalSubmitting}
                    style={{ padding: '0.65rem 1.25rem', backgroundColor: '#374151', border: 'none', borderRadius: '8px', color: '#D1D5DB', fontWeight: 600, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={modalSubmitting}
                    style={{ padding: '0.65rem 1.5rem', backgroundColor: '#2563EB', border: 'none', borderRadius: '8px', color: '#FFFFFF', fontWeight: 600, cursor: 'pointer' }}
                  >
                    {modalSubmitting ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ShopDashboardLayout>
  );
}
