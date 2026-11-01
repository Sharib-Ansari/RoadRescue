import React, { useState } from 'react';
import {
  Car,
  Bike,
  Truck,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Fuel,
  Calendar,
  ShieldCheck,
  Check
} from 'lucide-react';
import DashboardLayout from '../layouts/DashboardLayout';
import { useVehicles } from '../context/VehicleContext';
import './VehiclesPage.css';

// Helper to render vehicle icon based on type
const getVehicleIcon = (type) => {
  const normalized = (type || '').toLowerCase();
  if (normalized.includes('bike') || normalized.includes('motorcycle') || normalized.includes('scooter')) {
    return <Bike size={28} />;
  }
  if (normalized.includes('truck')) {
    return <Truck size={28} />;
  }
  return <Car size={28} />;
};

const VEHICLE_TYPES = [
  'Car',
  'Motorcycle/Bike',
  'Scooter',
  'SUV',
  'Truck',
  'Other'
];

const FUEL_TYPES = [
  'Petrol',
  'Diesel',
  'CNG',
  'Electric',
  'Hybrid'
];

const INITIAL_FORM = {
  type: 'Car',
  brand: '',
  model: '',
  registrationNumber: '',
  fuelType: 'Petrol',
  year: new Date().getFullYear()
};

const VehiclesPage = () => {
  const {
    vehicles,
    selectedVehicle,
    selectVehicle,
    addVehicle,
    editVehicle,
    deleteVehicle
  } = useVehicles();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehicleId, setEditingVehicleId] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const openAddModal = () => {
    setEditingVehicleId(null);
    setFormData(INITIAL_FORM);
    setFormErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (vehicle) => {
    setEditingVehicleId(vehicle.id);
    setFormData({
      type: vehicle.type || 'Car',
      brand: vehicle.brand || '',
      model: vehicle.model || '',
      registrationNumber: vehicle.registrationNumber || '',
      fuelType: vehicle.fuelType || 'Petrol',
      year: vehicle.year || ''
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingVehicleId(null);
    setFormData(INITIAL_FORM);
    setFormErrors({});
  };

  const validate = () => {
    const errors = {};
    if (!formData.type.trim()) {
      errors.type = 'Vehicle type is required';
    }
    if (!formData.brand.trim()) {
      errors.brand = 'Brand is required (e.g., Honda, Maruti, Tata)';
    }
    if (!formData.model.trim()) {
      errors.model = 'Model is required (e.g., City, Swift, Nexon)';
    }
    if (!formData.registrationNumber.trim()) {
      errors.registrationNumber = 'Registration number is required (e.g., MH 01 AB 1234)';
    } else if (formData.registrationNumber.trim().length < 5) {
      errors.registrationNumber = 'Please enter a valid vehicle registration number';
    }

    if (formData.year) {
      const yearNum = Number(formData.year);
      const currentYear = new Date().getFullYear();
      if (isNaN(yearNum) || yearNum < 1980 || yearNum > currentYear + 1) {
        errors.year = `Year must be between 1980 and ${currentYear + 1}`;
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      type: formData.type.trim(),
      brand: formData.brand.trim(),
      model: formData.model.trim(),
      registrationNumber: formData.registrationNumber.trim().toUpperCase(),
      fuelType: formData.fuelType,
      year: formData.year ? Number(formData.year) : null
    };

    if (editingVehicleId) {
      editVehicle(editingVehicleId, payload);
      setFeedbackMsg('Vehicle details updated successfully!');
    } else {
      addVehicle(payload);
      setFeedbackMsg('Vehicle added to your RoadRescue garage!');
    }

    closeModal();
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleDelete = (vehicle) => {
    const confirmText = `Are you sure you want to remove ${vehicle.brand} ${vehicle.model} (${vehicle.registrationNumber}) from your garage?`;
    if (window.confirm(confirmText)) {
      deleteVehicle(vehicle.id);
      setFeedbackMsg(`Removed ${vehicle.brand} ${vehicle.model}`);
      setTimeout(() => setFeedbackMsg(null), 3500);
    }
  };

  const handleSelect = (vehicle) => {
    selectVehicle(vehicle);
    setFeedbackMsg(`${vehicle.brand} ${vehicle.model} set as primary vehicle for dispatch.`);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  return (
    <DashboardLayout title="My Vehicles">
      <div className="vehicles-page">
        {/* Feedback Alert Toast */}
        {feedbackMsg && (
          <div className="feedback-banner">
            <CheckCircle2 size={18} className="feedback-icon" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Page Top Header Bar */}
        <div className="vehicles-header-bar">
          <div className="header-text-group">
            <h2 className="vehicles-page-title">My Registered Vehicles</h2>
            <p className="vehicles-page-sub">
              Manage your personal vehicles for one-tap roadside assistance & towing dispatch.
            </p>
          </div>

          <button className="btn-add-vehicle" onClick={openAddModal}>
            <Plus size={18} />
            <span>Add Vehicle</span>
          </button>
        </div>

        {/* Empty State */}
        {(!vehicles || vehicles.length === 0) ? (
          <div className="vehicles-empty-state">
            <div className="empty-car-icon-wrap">
              <Car size={64} className="empty-car-icon" />
            </div>
            <h3 className="empty-title">No vehicles registered yet</h3>
            <p className="empty-description">
              Add your vehicle to get started with RoadRescue instant breakdown assistance,
              live mechanic tracking, and spare parts compatibility.
            </p>
            <button className="btn-empty-add" onClick={openAddModal}>
              <Plus size={18} />
              <span>Add Your First Vehicle</span>
            </button>
          </div>
        ) : (
          /* Vehicle Cards Grid */
          <div className="vehicles-grid">
            {vehicles.map((veh) => {
              const isSelected = selectedVehicle && selectedVehicle.id === veh.id;
              return (
                <div
                  key={veh.id}
                  className={`vehicle-card ${isSelected ? 'vehicle-card-selected' : ''}`}
                >
                  {/* Selected Badge */}
                  {isSelected && (
                    <div className="selected-ribbon">
                      <CheckCircle2 size={13} />
                      <span>CURRENTLY SELECTED</span>
                    </div>
                  )}

                  <div className="vehicle-card-main">
                    {/* Vehicle Type Icon */}
                    <div className={`vehicle-type-icon-box ${isSelected ? 'icon-box-active' : ''}`}>
                      {getVehicleIcon(veh.type)}
                    </div>

                    <div className="vehicle-info-block">
                      <div className="vehicle-title-row">
                        <h3 className="vehicle-name">
                          {veh.brand} {veh.model}
                        </h3>
                        <span className="vehicle-type-tag">{veh.type}</span>
                      </div>

                      <div className="vehicle-reg-number">
                        {veh.registrationNumber}
                      </div>

                      <div className="vehicle-specs-row">
                        <span className="spec-badge">
                          <Fuel size={13} />
                          <span>{veh.fuelType || 'Petrol'}</span>
                        </span>
                        {veh.year && (
                          <span className="spec-badge">
                            <Calendar size={13} />
                            <span>{veh.year}</span>
                          </span>
                        )}
                        <span className="spec-badge badge-active-shield">
                          <ShieldCheck size={13} />
                          <span>RoadAssisted</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Buttons */}
                  <div className="vehicle-card-actions">
                    {isSelected ? (
                      <div className="selected-status-label">
                        <Check size={16} />
                        <span>Default Active Vehicle</span>
                      </div>
                    ) : (
                      <button
                        className="btn-select-vehicle"
                        onClick={() => handleSelect(veh)}
                        title="Set as active vehicle for emergencies"
                      >
                        Select Vehicle
                      </button>
                    )}

                    <div className="icon-actions-group">
                      <button
                        className="btn-icon-edit"
                        onClick={() => openEditModal(veh)}
                        title="Edit Vehicle Details"
                        aria-label="Edit vehicle"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        className="btn-icon-delete"
                        onClick={() => handleDelete(veh)}
                        title="Delete Vehicle"
                        aria-label="Delete vehicle"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* =========================================================
            Add / Edit Vehicle Modal
           ========================================================= */}
        {isModalOpen && (
          <div className="modal-backdrop" onClick={closeModal}>
            <div
              className="modal-container"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-labelledby="modal-title"
              aria-modal="true"
            >
              <div className="modal-header">
                <div className="modal-title-wrap">
                  <div className="modal-icon-badge">
                    <Car size={20} />
                  </div>
                  <div>
                    <h3 id="modal-title" className="modal-title">
                      {editingVehicleId ? 'Edit Vehicle Details' : 'Add New Vehicle'}
                    </h3>
                    <p className="modal-sub">
                      {editingVehicleId
                        ? 'Update your vehicle information'
                        : 'Register a vehicle to your RoadRescue garage'}
                    </p>
                  </div>
                </div>
                <button
                  className="modal-close-btn"
                  onClick={closeModal}
                  aria-label="Close dialog"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="modal-form" noValidate>
                <div className="form-grid">
                  {/* Vehicle Type */}
                  <div className="form-group">
                    <label htmlFor="veh-type" className="form-label">
                      Vehicle Type <span className="required-star">*</span>
                    </label>
                    <select
                      id="veh-type"
                      className={`form-input form-select ${formErrors.type ? 'input-error' : ''}`}
                      value={formData.type}
                      onChange={(e) =>
                        setFormData({ ...formData, type: e.target.value })
                      }
                    >
                      {VEHICLE_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                    {formErrors.type && (
                      <span className="field-error-msg">{formErrors.type}</span>
                    )}
                  </div>

                  {/* Fuel Type */}
                  <div className="form-group">
                    <label htmlFor="veh-fuel" className="form-label">
                      Fuel Type <span className="required-star">*</span>
                    </label>
                    <select
                      id="veh-fuel"
                      className="form-input form-select"
                      value={formData.fuelType}
                      onChange={(e) =>
                        setFormData({ ...formData, fuelType: e.target.value })
                      }
                    >
                      {FUEL_TYPES.map((f) => (
                        <option key={f} value={f}>
                          {f}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Brand */}
                  <div className="form-group">
                    <label htmlFor="veh-brand" className="form-label">
                      Brand / Manufacturer <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      id="veh-brand"
                      className={`form-input ${formErrors.brand ? 'input-error' : ''}`}
                      placeholder="e.g. Honda, Maruti, Tata, Hyundai"
                      value={formData.brand}
                      onChange={(e) =>
                        setFormData({ ...formData, brand: e.target.value })
                      }
                    />
                    {formErrors.brand && (
                      <span className="field-error-msg">{formErrors.brand}</span>
                    )}
                  </div>

                  {/* Model */}
                  <div className="form-group">
                    <label htmlFor="veh-model" className="form-label">
                      Model <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      id="veh-model"
                      className={`form-input ${formErrors.model ? 'input-error' : ''}`}
                      placeholder="e.g. City, Swift, Nexon, Creta"
                      value={formData.model}
                      onChange={(e) =>
                        setFormData({ ...formData, model: e.target.value })
                      }
                    />
                    {formErrors.model && (
                      <span className="field-error-msg">{formErrors.model}</span>
                    )}
                  </div>

                  {/* Registration Number */}
                  <div className="form-group">
                    <label htmlFor="veh-reg" className="form-label">
                      Registration Number <span className="required-star">*</span>
                    </label>
                    <input
                      type="text"
                      id="veh-reg"
                      className={`form-input ${
                        formErrors.registrationNumber ? 'input-error' : ''
                      }`}
                      placeholder="MH 01 AB 1234"
                      value={formData.registrationNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          registrationNumber: e.target.value.toUpperCase()
                        })
                      }
                    />
                    {formErrors.registrationNumber && (
                      <span className="field-error-msg">
                        {formErrors.registrationNumber}
                      </span>
                    )}
                  </div>

                  {/* Year */}
                  <div className="form-group">
                    <label htmlFor="veh-year" className="form-label">
                      Manufacturing Year
                    </label>
                    <input
                      type="number"
                      id="veh-year"
                      className={`form-input ${formErrors.year ? 'input-error' : ''}`}
                      placeholder="e.g. 2022"
                      min="1980"
                      max={new Date().getFullYear() + 1}
                      value={formData.year}
                      onChange={(e) =>
                        setFormData({ ...formData, year: e.target.value })
                      }
                    />
                    {formErrors.year && (
                      <span className="field-error-msg">{formErrors.year}</span>
                    )}
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-modal-cancel"
                    onClick={closeModal}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-modal-save">
                    {editingVehicleId ? 'Save Changes' : 'Register Vehicle'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default VehiclesPage;
