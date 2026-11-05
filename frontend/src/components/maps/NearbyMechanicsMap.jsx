import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { createCustomerIcon, createAvailableMechanicIcon, createSelectedMechanicIcon } from './mapUtils';
import { MapPin, Phone, Wrench, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Component to dynamically fit bounds or recenter when center changes
function MapController({ center }) {
  const map = useMap();

  useEffect(() => {
    if (
      center &&
      typeof center.latitude === 'number' &&
      !isNaN(center.latitude) &&
      typeof center.longitude === 'number' &&
      !isNaN(center.longitude)
    ) {
      try {
        map.setView([center.latitude, center.longitude], 13);
      } catch (e) {
        // quiet ignore
      }
    }
  }, [center, map]);

  return null;
}

export const NearbyMechanicsMap = ({
  customerLocation, // { latitude, longitude }
  mechanics = [],
  radiusKm = 25,
  selectedMechanicId = null,
  onSelectMechanic
}) => {
  const navigate = useNavigate();

  const hasCustomerLocation = Boolean(
    customerLocation &&
    typeof customerLocation.latitude === 'number' &&
    !isNaN(customerLocation.latitude) &&
    typeof customerLocation.longitude === 'number' &&
    !isNaN(customerLocation.longitude)
  );

  // Default fallback center: Delhi NCR
  const defaultCenter = hasCustomerLocation
    ? [customerLocation.latitude, customerLocation.longitude]
    : [28.6139, 77.2090];

  return (
    <div className="nearby-map-wrapper" style={{ position: 'relative', width: '100%', height: '480px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color, #334155)', background: '#1e293b' }}>
      <MapContainer
        center={defaultCenter}
        zoom={13}
        scrollWheelZoom={false}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapController center={customerLocation} />

        {/* Customer Location Marker */}
        {hasCustomerLocation && (
          <>
            <Marker
              position={[customerLocation.latitude, customerLocation.longitude]}
              icon={createCustomerIcon()}
            >
              <Popup>
                <div style={{ padding: '4px', color: '#0f172a' }}>
                  <strong style={{ display: 'block', fontSize: '14px', marginBottom: '4px' }}>Your Breakdown Location</strong>
                  <span style={{ fontSize: '12px', color: '#475569' }}>
                    {customerLocation.latitude.toFixed(5)}, {customerLocation.longitude.toFixed(5)}
                  </span>
                </div>
              </Popup>
            </Marker>

            {/* Discovery Radius Circle */}
            <Circle
              center={[customerLocation.latitude, customerLocation.longitude]}
              radius={(radiusKm || 25) * 1000}
              pathOptions={{
                color: '#3b82f6',
                fillColor: '#3b82f6',
                fillOpacity: 0.08,
                weight: 1.5,
                dashArray: '4, 8'
              }}
            />
          </>
        )}

        {/* Nearby Mechanics Markers */}
        {mechanics.map((mech) => {
          if (
            typeof mech.latitude !== 'number' ||
            isNaN(mech.latitude) ||
            typeof mech.longitude !== 'number' ||
            isNaN(mech.longitude)
          ) {
            return null;
          }

          const mechId = mech.id || mech._id;
          const isSelected = selectedMechanicId && (mechId === selectedMechanicId);

          return (
            <Marker
              key={mechId}
              position={[mech.latitude, mech.longitude]}
              icon={isSelected ? createSelectedMechanicIcon() : createAvailableMechanicIcon()}
              eventHandlers={{
                click: () => {
                  if (onSelectMechanic) onSelectMechanic(mech);
                }
              }}
            >
              <Popup>
                <div style={{ minWidth: '220px', padding: '6px', color: '#0f172a' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#0f172a' }}>{mech.workshopName || mech.name}</h4>
                      <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#64748b' }}>{mech.name}</p>
                    </div>
                    {mech.distanceKm !== null && mech.distanceKm !== undefined && (
                      <span style={{ background: '#fee2e2', color: '#991b1b', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', fontWeight: 600 }}>
                        {mech.distanceKm} km
                      </span>
                    )}
                  </div>

                  {mech.serviceArea && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: '#475569', marginBottom: '6px' }}>
                      <MapPin size={13} /> {mech.serviceArea}
                    </div>
                  )}

                  {mech.services && mech.services.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
                      {mech.services.slice(0, 3).map((s, idx) => (
                        <span key={idx} style={{ background: '#f1f5f9', color: '#334155', fontSize: '10px', padding: '2px 5px', borderRadius: '4px' }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (onSelectMechanic) onSelectMechanic(mech);
                        navigate(`/request-mechanic/${mechId}`, {
                          state: {
                            coordinates: customerLocation,
                            mechanic: mech
                          }
                        });
                      }}
                      style={{
                        flex: 1,
                        padding: '8px 12px',
                        background: '#dc2626',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        fontWeight: 600,
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Request This Mechanic
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* On-Map Visual Legend */}
      <div style={{
        position: 'absolute',
        bottom: '16px',
        left: '16px',
        zIndex: 1000,
        background: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(51, 65, 85, 0.8)',
        borderRadius: '10px',
        padding: '8px 12px',
        fontSize: '11px',
        color: '#f8fafc',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
        pointerEvents: 'none'
      }}>
        <div style={{ fontWeight: 600, fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Map Legend
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#2563eb', border: '1.5px solid #fff' }} />
          <span>Your Location (Blue)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', border: '1.5px solid #fff' }} />
          <span>Available Mechanic (Red)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#dc2626', border: '2px solid #facc15', boxShadow: '0 0 6px #ef4444' }} />
          <span>Selected Mechanic (Pulsing Red)</span>
        </div>
      </div>
    </div>
  );
};

export default NearbyMechanicsMap;
