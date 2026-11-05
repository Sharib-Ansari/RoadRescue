import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { createCustomerIcon, createMechanicIcon } from './mapUtils';
import L from 'leaflet';

// Component to dynamically fit bounds to both points as mechanic moves
function AutoBoundsController({ customerPos, mechanicPos }) {
  const map = useMap();

  useEffect(() => {
    if (customerPos && mechanicPos) {
      const bounds = L.latLngBounds([
        [customerPos.latitude, customerPos.longitude],
        [mechanicPos.latitude, mechanicPos.longitude]
      ]);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 });
    } else if (mechanicPos) {
      map.panTo([mechanicPos.latitude, mechanicPos.longitude]);
    } else if (customerPos) {
      map.panTo([customerPos.latitude, customerPos.longitude]);
    }
  }, [customerPos, mechanicPos, map]);

  return null;
}

export const LiveTrackingMap = ({
  customerLocation, // { latitude, longitude }
  mechanicLocation, // { latitude, longitude, heading, speed, accuracy, mechanicName }
  status = 'on_the_way'
}) => {
  const defaultCenter = mechanicLocation?.latitude && mechanicLocation?.longitude
    ? [mechanicLocation.latitude, mechanicLocation.longitude]
    : customerLocation?.latitude && customerLocation?.longitude
    ? [customerLocation.latitude, customerLocation.longitude]
    : [28.6139, 77.2090];

  const hasCustomer = Boolean(customerLocation?.latitude && customerLocation?.longitude);
  const hasMechanic = Boolean(mechanicLocation?.latitude && mechanicLocation?.longitude);

  const polylinePositions = (hasCustomer && hasMechanic)
    ? [
        [customerLocation.latitude, customerLocation.longitude],
        [mechanicLocation.latitude, mechanicLocation.longitude]
      ]
    : [];

  return (
    <div style={{ position: 'relative', width: '100%', height: '420px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color, #334155)' }}>
      <MapContainer
        center={defaultCenter}
        zoom={14}
        scrollWheelZoom={false}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <AutoBoundsController customerPos={customerLocation} mechanicPos={mechanicLocation} />

        {/* Connecting route polyline between customer and mechanic */}
        {polylinePositions.length === 2 && (
          <Polyline
            positions={polylinePositions}
            pathOptions={{
              color: '#eab308',
              weight: 3.5,
              dashArray: '6, 10',
              opacity: 0.8
            }}
          />
        )}

        {/* Customer Breakdown Marker */}
        {hasCustomer && (
          <Marker
            position={[customerLocation.latitude, customerLocation.longitude]}
            icon={createCustomerIcon()}
          >
            <Popup>
              <div style={{ padding: '4px', color: '#0f172a' }}>
                <strong style={{ display: 'block', fontSize: '13px' }}>Your Breakdown Location</strong>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Assistance requested here</span>
              </div>
            </Popup>
          </Marker>
        )}

        {/* Live Mechanic Moving Marker */}
        {hasMechanic && (
          <Marker
            position={[mechanicLocation.latitude, mechanicLocation.longitude]}
            icon={createMechanicIcon(status === 'on_the_way')}
          >
            <Popup>
              <div style={{ padding: '6px', color: '#0f172a', minWidth: '160px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></span>
                  <strong style={{ fontSize: '14px' }}>{mechanicLocation.mechanicName || 'Assigned Mechanic'}</strong>
                </div>
                <div style={{ fontSize: '12px', color: '#475569' }}>
                  Status: <strong style={{ color: '#2563eb' }}>{status.replace(/_/g, ' ').toUpperCase()}</strong>
                </div>
                {mechanicLocation.speed !== undefined && mechanicLocation.speed > 0 && (
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                    Speed: {Math.round(mechanicLocation.speed * 3.6)} km/h
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default LiveTrackingMap;