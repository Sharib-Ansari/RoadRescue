import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../context/SocketContext';
import authApi from '../utils/api';

/**
 * useMechanicLocation Hook
 * Handles watching mechanic GPS position and broadcasting updates via Socket.IO
 * and persisting to backend location endpoint.
 */
export const useMechanicLocation = (activeRequestId = null) => {
  const { socket, connected } = useSocket();
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [broadcastError, setBroadcastError] = useState(null);

  const watchIdRef = useRef(null);
  const lastEmitTimeRef = useRef(0);

  const emitLocation = useCallback(
    (coords) => {
      const now = Date.now();
      // Throttle to at most once every 2.5 seconds
      if (now - lastEmitTimeRef.current < 2500) {
        return;
      }
      lastEmitTimeRef.current = now;

      setCurrentLocation(coords);

      const payload = {
        requestId: activeRequestId,
        latitude: coords.latitude,
        longitude: coords.longitude,
        heading: coords.heading || 0,
        speed: coords.speed || 0,
        accuracy: coords.accuracy || null
      };

      // 1. Emit via real-time WebSocket if connected
      if (socket && connected) {
        socket.emit('mechanic:location:update', payload);
      }

      // 2. Also sync to REST endpoint periodically
      authApi.updateMechanicLocation({
        latitude: coords.latitude,
        longitude: coords.longitude,
        accuracy: coords.accuracy
      }).catch((err) => {
        console.warn('REST location sync skipped:', err.message);
      });
    },
    [socket, connected, activeRequestId]
  );

  const startBroadcasting = useCallback(() => {
    if (!navigator.geolocation) {
      setBroadcastError('Geolocation not supported on this device');
      return;
    }

    setBroadcastError(null);
    setIsBroadcasting(true);

    // Initial immediate reading
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        emitLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          accuracy: pos.coords.accuracy
        });
      },
      (err) => {
        setBroadcastError(`GPS reading failed: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );

    // Continuous watch
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        emitLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          heading: pos.coords.heading,
          speed: pos.coords.speed,
          accuracy: pos.coords.accuracy
        });
      },
      (err) => {
        setBroadcastError(err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 2000
      }
    );
  }, [emitLocation]);

  const stopBroadcasting = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsBroadcasting(false);
  }, []);

  // Automatically stop broadcasting if the active job was completed or unassigned
  useEffect(() => {
    if (!activeRequestId && isBroadcasting) {
      stopBroadcasting();
    }
  }, [activeRequestId, isBroadcasting, stopBroadcasting]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return {
    isBroadcasting,
    currentLocation,
    broadcastError,
    startBroadcasting,
    stopBroadcasting
  };
};

export default useMechanicLocation;