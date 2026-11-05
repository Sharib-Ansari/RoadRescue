import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';

/**
 * useLiveTracking Hook
 * Subscribes to real-time mechanic location and status updates for an active request.
 * Automatically halts telemetry and leaves room when request reaches terminal status (completed, cancelled, rejected).
 */
export const useLiveTracking = (requestId) => {
  const { socket, connected } = useSocket();
  const [mechanicLocation, setMechanicLocation] = useState(null);
  const [requestStatus, setRequestStatus] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);
  const [isJoined, setIsJoined] = useState(false);

  // Keep track of joined state for cleanup
  const activeRoomRef = useRef(null);

  useEffect(() => {
    if (!socket || !connected || !requestId) return;

    activeRoomRef.current = requestId;

    // Join tracking room
    socket.emit('join:request', { requestId }, (response) => {
      if (response?.error) {
        setError(response.error);
        setIsJoined(false);
      } else {
        setIsJoined(true);
        setError(null);
        if (response?.status) {
          setRequestStatus(response.status);
        }
        if (response?.mechanicLastLocation) {
          setMechanicLocation(response.mechanicLastLocation);
          setLastUpdated(response.mechanicLastLocation.updatedAt || new Date());
        }
      }
    });

    // Listen for live location updates
    const handleLocationUpdate = (data) => {
      if (data) {
        setMechanicLocation({
          latitude: data.latitude,
          longitude: data.longitude,
          heading: data.heading || 0,
          speed: data.speed || 0,
          accuracy: data.accuracy || null,
          mechanicName: data.mechanicName || '',
          timestamp: data.timestamp
        });
        setLastUpdated(new Date(data.timestamp || Date.now()));
      }
    };

    // Listen for status changes
    const handleStatusUpdate = (data) => {
      if (data?.status) {
        setRequestStatus(data.status);
      }
    };

    // Listen for errors
    const handleError = (data) => {
      if (data?.message) {
        setError(data.message);
      }
    };

    socket.on('mechanic:location', handleLocationUpdate);
    socket.on('request:status_updated', handleStatusUpdate);
    socket.on('error', handleError);

    return () => {
      if (activeRoomRef.current) {
        socket.emit('leave:request', { requestId: activeRoomRef.current });
      }
      socket.off('mechanic:location', handleLocationUpdate);
      socket.off('request:status_updated', handleStatusUpdate);
      socket.off('error', handleError);
      setIsJoined(false);
      activeRoomRef.current = null;
    };
  }, [socket, connected, requestId]);

  // Terminal status guard: when completed, cancelled, or rejected, disconnect from room
  useEffect(() => {
    if (['completed', 'cancelled', 'rejected'].includes(requestStatus) && socket && activeRoomRef.current) {
      socket.emit('leave:request', { requestId: activeRoomRef.current });
      setIsJoined(false);
    }
  }, [requestStatus, socket]);

  return {
    mechanicLocation,
    requestStatus,
    lastUpdated,
    error,
    isJoined,
    connected,
    setMechanicLocation,
    setRequestStatus
  };
};

export default useLiveTracking;
