import L from 'leaflet';

/**
 * Creates custom SVG DivIcons for Leaflet maps to avoid broken asset URL issues in bundlers
 */

export const createCustomerIcon = () => {
  return L.divIcon({
    className: 'custom-leaflet-marker customer-marker',
    html: `
      <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: rgba(59, 130, 246, 0.25); animation: rr-pulse 2s infinite;"></div>
        <div style="width: 24px; height: 24px; border-radius: 50%; background: #2563eb; border: 3px solid #ffffff; box-shadow: 0 0 10px rgba(37, 99, 235, 0.8); display: flex; align-items: center; justify-content: center;">
          <div style="width: 8px; height: 8px; border-radius: 50%; background: #ffffff;"></div>
        </div>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18]
  });
};

export const createMechanicIcon = (isMoving = false) => {
  return L.divIcon({
    className: 'custom-leaflet-marker mechanic-marker',
    html: `
      <div style="position: relative; width: 42px; height: 42px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 42px; height: 42px; border-radius: 50%; background: rgba(234, 179, 8, 0.25); ${isMoving ? 'animation: rr-pulse 1.5s infinite;' : ''}"></div>
        <div style="width: 32px; height: 32px; border-radius: 50%; background: #eab308; border: 3px solid #0f172a; box-shadow: 0 4px 12px rgba(234, 179, 8, 0.6); display: flex; align-items: center; justify-content: center; color: #0f172a;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -21]
  });
};

export const createAvailableMechanicIcon = () => {
  return L.divIcon({
    className: 'custom-leaflet-marker available-mechanic-marker',
    html: `
      <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
        <div style="width: 30px; height: 30px; border-radius: 50%; background: #ef4444; border: 2.5px solid #ffffff; box-shadow: 0 2px 10px rgba(239, 68, 68, 0.6); display: flex; align-items: center; justify-content: center; color: #ffffff;">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17]
  });
};

export const createSelectedMechanicIcon = () => {
  return L.divIcon({
    className: 'custom-leaflet-marker selected-mechanic-marker',
    html: `
      <div style="position: relative; width: 46px; height: 46px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 46px; height: 46px; border-radius: 50%; background: rgba(239, 68, 68, 0.35); animation: rr-pulse 1.2s infinite;"></div>
        <div style="width: 34px; height: 34px; border-radius: 50%; background: #dc2626; border: 3px solid #facc15; box-shadow: 0 0 14px rgba(239, 68, 68, 0.9); display: flex; align-items: center; justify-content: center; color: #ffffff;">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
        </div>
      </div>
    `,
    iconSize: [46, 46],
    iconAnchor: [23, 23],
    popupAnchor: [0, -23]
  });
};