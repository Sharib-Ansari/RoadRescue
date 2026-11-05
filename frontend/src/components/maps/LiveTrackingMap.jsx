import React, { useEffect, useMemo, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { createCustomerIcon, createMechanicIcon } from './mapUtils';
import { MapPin, Navigation, Radio, Clock, ShieldCheck, MapPinOff, AlertTriangle } from 'lucide-react';
import L from 'leaflet';

// Haversine formula to compute great-circle distance in kilometers
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

// Component to dynamically fit bounds or pan and trigger map resizing
function AutoBoundsController({ customerPos, mechanicPos }) {
  const map = useMap();
  const hasFittedRef = useRef(false);

  useEffect(() => {
    // Invalidate map size so tiles never render blank or with 0 container height
    const timer = setTimeout(() => {
      try {
        map.invalidateSize();
      } catch (e) {
        // quiet ignore
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    const validCust = Boolean(
      customerPos &&
      typeof customerPos.latitude === 'number' &&
      !isNaN(customerPos.latitude) &&
      typeof customerPos.longitude === 'number' &&
      !isNaN(customerPos.longitude)
    );

    const validMech = Boolean(
      mechanicPos &&
      typeof mechanicPos.latitude === 'number' &&
      !isNaN(mechanicPos.latitude) &&
      typeof mechanicPos.longitude === 'number' &&
      !isNaN(mechanicPos.longitude)
    );

    try {
      if (validCust && validMech) {
        const bounds = L.latLngBounds([
          [customerPos.latitude, customerPos.longitude],
          [mechanicPos.latitude, mechanicPos.longitude]
        ]);
        if (bounds.isValid()) {
          // If already fitted once, smoothly pan or adjust with padding
          map.fitBounds(bounds, { padding: [65, 65], maxZoom: 16 });
          hasFittedRef.current = true;
        }
      } else if (validCust && !hasFittedRef.current) {
        map.setView([customerPos.latitude, customerPos.longitude], 15);
        hasFittedRef.current = true;
      } else if (validMech && !hasFittedRef.current) {
        map.setView([mechanicPos.latitude, mechanicPos.longitude], 15);
        hasFittedRef.current = true;
      }
    } catch (err) {
      console.warn('Map bounds adjustment skipped:', err.message);
    }
  }, [customerPos, mechanicPos, map]);

  return null;
}

export const LiveTrackingMap = ({
  customerLocation, // { latitude, longitude }
  mechanicLocation, // { latitude, longitude, heading, speed, accuracy, mechanicName, updatedAt }
  status = 'on_the_way',
  locationAddress = 'Customer Location',
  mechanicName = 'Assigned Mechanic',
  workshopName = 'Certified Partner',
  connected = true
}) => {
  // Validate customer coordinates strictly
  const validCust = Boolean(
    customerLocation &&
    typeof customerLocation.latitude === 'number' &&
    !isNaN(customerLocation.latitude) &&
    customerLocation.latitude >= -90 &&
    customerLocation.latitude <= 90 &&
    typeof customerLocation.longitude === 'number' &&
    !isNaN(customerLocation.longitude) &&
    customerLocation.longitude >= -180 &&
    customerLocation.longitude <= 180
  );

  // Validate mechanic coordinates strictly
  const validMech = Boolean(
    mechanicLocation &&
    typeof mechanicLocation.latitude === 'number' &&
    !isNaN(mechanicLocation.latitude) &&
    mechanicLocation.latitude >= -90 &&
    mechanicLocation.latitude <= 90 &&
    typeof mechanicLocation.longitude === 'number' &&
    !isNaN(mechanicLocation.longitude) &&
    mechanicLocation.longitude >= -180 &&
    mechanicLocation.longitude <= 180
  );

  // If customer coordinates are completely missing, DO NOT fallback to New Delhi.
  // Display a clear location-unavailable notice per requirements.
  if (!validCust) {
    return (
      <div
        style={{
          background: 'var(--card-bg, #1e293b)',
          borderRadius: '16px',
          padding: '40px 24px',
          border: '1px solid var(--border-color, #334155)',
          textAlign: 'center',
          minHeight: '380px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'rgba(234, 179, 8, 0.15)',
            color: '#eab308',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}
        >
          <MapPinOff size={30} />
        </div>
        <h3 style={{ fontSize: '19px', fontWeight: 700, color: '#f8fafc', marginBottom: '8px' }}>
          Breakdown GPS Coordinates Unavailable
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '14px', maxWidth: '480px', margin: '0 auto 16px', lineHeight: 1.5 }}>
          Device GPS coordinates were not captured when this service request was created.
        </p>

        <div
          style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid #334155',
            borderRadius: '10px',
            padding: '10px 18px',
            color: '#f8fafc',
            fontWeight: 600,
            fontSize: '14px',
            marginBottom: '16px',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <MapPin size={16} style={{ color: '#3b82f6', flexShrink: 0 }} />
          <span>Recorded Destination: {locationAddress}</span>
        </div>

        <p style={{ color: '#64748b', fontSize: '12px', margin: 0, maxWidth: '420px' }}>
          To ensure driver safety and navigation precision, the live GPS radar requires authentic coordinates. Text addresses are preserved above for the technician.
        </p>
      </div>
    );
  }

  // Calculate actual direct straight-line distance if both coordinates are verified
  const distanceKm = useMemo(() => {
    if (validCust && validMech) {
      return calculateDistanceKm(
        customerLocation.latitude,
        customerLocation.longitude,
        mechanicLocation.latitude,
        mechanicLocation.longitude
      );
    }
    return null;
  }, [validCust, validMech, customerLocation, mechanicLocation]);

  // Center on customer's actual saved coordinates
  const initialCenter = [customerLocation.latitude, customerLocation.longitude];

  // Polyline coordinates for straight-line connection
  const polylinePositions = (validCust && validMech)
    ? [
        [customerLocation.latitude, customerLocation.longitude],
        [mechanicLocation.latitude, mechanicLocation.longitude]
      ]
    : [];

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '440px',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid var(--border-color, #334155)',
        background: '#0f172a'
      }}
    >
      <MapContainer
        center={initialCenter}
        zoom={14}
        scrollWheelZoom={false}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <AutoBoundsController customerPos={customerLocation} mechanicPos={mechanicLocation} />

        {/* Straight-line connection between customer breakdown location and mechanic */}
        {polylinePositions.length === 2 && (
          <Polyline
            positions={polylinePositions}
            pathOptions={{
              color: '#ef4444',
              weight: 3,
              dashArray: '6, 8',
              opacity: 0.85
            }}
          >
            <Tooltip permanent={false} direction="center" offset={[0, -10]} opacity={0.9}>
              <span style={{ fontSize: '11px', fontWeight: 600 }}>
                Direct Distance: {distanceKm} km
              </span>
            </Tooltip>
          </Polyline>
        )}

        {/* 1. Customer Breakdown Location Marker (BLUE) */}
        {validCust && (
          <Marker
            position={[customerLocation.latitude, customerLocation.longitude]}
            icon={createCustomerIcon()}
          >
            <Popup>
              <div style={{ padding: '6px', color: '#0f172a', minWidth: '180px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#2563eb' }} />
                  <strong style={{ fontSize: '13px', color: '#1e3a8a' }}>Breakdown Location</strong>
                </div>
                <div style={{ fontSize: '12px', color: '#334155', marginBottom: '4px' }}>
                  {locationAddress}
                </div>
                <div style={{ fontSize: '10px', color: '#64748b', fontFamily: 'monospace' }}>
                  {customerLocation.latitude.toFixed(5)}° N, {customerLocation.longitude.toFixed(5)}° E
                </div>
              </div>
            </Popup>
          </Marker>
        )}

        {/* 2. Assigned Mechanic Location Marker (RED) */}
        {validMech && (
          <Marker
            position={[mechanicLocation.latitude, mechanicLocation.longitude]}
            icon={createMechanicIcon(status === 'on_the_way')}
          >
            <Popup>
              <div style={{ padding: '6px', color: '#0f172a', minWidth: '190px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
                  <strong style={{ fontSize: '13px', color: '#991b1b' }}>{mechanicName}</strong>
                </div>
                <div style={{ fontSize: '12px', color: '#475569', marginBottom: '4px' }}>
                  {workshopName}
                </div>
                <div style={{ fontSize: '11px', color: '#1e293b', fontWeight: 600 }}>
                  Status: <span style={{ color: '#dc2626' }}>{status.replace(/_/g, ' ').toUpperCase()}</span>
                </div>
                {distanceKm !== null && (
                  <div style={{ fontSize: '11px', color: '#0284c7', marginTop: '2px', fontWeight: 600 }}>
                    ~{distanceKm} km from your vehicle
                  </div>
                )}
                {mechanicLocation.speed !== undefined && mechanicLocation.speed > 0 && (
                  <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                    Speed: {Math.round(mechanicLocation.speed * 3.6)} km/h
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        )}
      </MapContainer>

      {/* Top Floating Telemetry & Distance HUD */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          zIndex: 1000,
          background: 'rgba(15, 23, 42, 0.92)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(51, 65, 85, 0.8)',
          borderRadius: '10px',
          padding: '6px 12px',
          fontSize: '12px',
          color: '#f8fafc',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
        }}
      >
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            color: connected ? '#10b981' : '#eab308',
            fontWeight: 600
          }}
        >
          <Radio size={12} className={connected ? 'pulse-icon' : ''} />
          {connected ? 'GPS RADAR' : 'RECONNECTING'}
        </span>

        {distanceKm !== null && (
          <>
            <span style={{ color: '#475569' }}>|</span>
            <span style={{ color: '#f8fafc', fontWeight: 700 }}>
              {distanceKm} km away
            </span>
          </>
        )}
      </div>

      {/* Bottom Floating Visual Legend & Status */}
      <div
        style={{
          position: 'absolute',
          bottom: '14px',
          left: '14px',
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
          gap: '5px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
          pointerEvents: 'none'
        }}
      >
        <div style={{ fontWeight: 700, fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Radar Legend
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#2563eb', border: '1.5px solid #fff' }} />
          <span>Your Vehicle (Breakdown Location)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', border: '1.5px solid #fff' }} />
          <span>{validMech ? `${mechanicName} (Live GPS)` : 'Technician (Awaiting GPS Signal)'}</span>
        </div>
        {polylinePositions.length === 2 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '16px', height: '2px', background: '#ef4444', borderTop: '2px dashed #ef4444' }} />
            <span>Direct Line Connection</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveTrackingMap;
