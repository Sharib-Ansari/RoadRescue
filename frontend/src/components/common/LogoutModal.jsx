import React from 'react';
import { LogOut, X, Loader2 } from 'lucide-react';
import './LogoutModal.css';

/**
 * Custom React Logout Confirmation Modal
 * Matches RoadRescue dark automotive premium theme.
 */
export default function LogoutModal({ isOpen, onClose, onConfirm, isLoggingOut }) {
  if (!isOpen) return null;

  return (
    <div
      className="logout-modal-backdrop"
      onClick={!isLoggingOut ? onClose : undefined}
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-modal-title"
    >
      <div
        className="logout-modal-card"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Close Button */}
        <button
          type="button"
          className="logout-modal-close-btn"
          onClick={onClose}
          disabled={isLoggingOut}
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        {/* Modal Header & Content */}
        <div className="logout-modal-body">
          <div className="logout-badge-wrapper">
            <div className="logout-icon-badge">
              <LogOut size={26} />
            </div>
          </div>

          <div className="logout-text-content">
            <h3 id="logout-modal-title" className="logout-modal-title">
              Are you sure you want to sign out?
            </h3>
            <p className="logout-modal-description">
              You will need to log in again to access your RoadRescue account.
            </p>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="logout-modal-actions">
          <button
            type="button"
            className="btn-modal-cancel"
            onClick={onClose}
            disabled={isLoggingOut}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-modal-confirm-logout"
            onClick={onConfirm}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <>
                <Loader2 size={16} className="logout-spin" />
                <span>Signing Out...</span>
              </>
            ) : (
              <>
                <LogOut size={16} />
                <span>Yes, Sign Out</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
