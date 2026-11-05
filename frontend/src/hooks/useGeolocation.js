import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * useGeolocation Hook
 * Handles browser Geolocation API with permission state tracking,
 * high-accuracy readings, watchPosition capabilities, and manual overrides.
 */
export const useGeolocation = (autoFetch = false) => {
  const [coordinates, setCoordinates] = useState(null); // { latitude, longitude }
  const [accuracy, setAccuracy] = useState(null);
  const [heading, setHeading] = useState(null);
  const [speed, setSpeed] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('prompt'); // 'prompt', 'granted', 'denied', 'unsupported'

  const watchIdRef = useRef(null);

  // Check browser permission status if supported
  useEffect(() => {
    if (!navigator.geolocation) {
      setPermissionStatus('unsupported');
      setError('Geolocation is not supported by your browser');
      return;
    }

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((result) => {
          setPermissionStatus(result.state);
          result.onchange = () => {
            setPermissionStatus(result.state);
          };
        })
        .catch(() => {
          // Fallback if permissions query fails
        });
    }
  }, []);

  // Request current one-time position
  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      setPermissionStatus('unsupported');
      return Promise.reject(new Error('Geolocation unsupported'));
    }

    setLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          };
          setCoordinates(coords);
          setAccuracy(position.coords.accuracy);
          setHeading(position.coords.heading);
          setSpeed(position.coords.speed);
          setLoading(false);
          setPermissionStatus('granted');
          resolve(coords);
        },
        (err) => {
          let errorMsg = 'Failed to retrieve location';
          if (err.code === 1) {
            errorMsg = 'Location permission denied by user. Please allow location access in your browser.';
            setPermissionStatus('denied');
          } else if (err.code === 2) {
            errorMsg = 'Location position is currently unavailable.';
          } else if (err.code === 3) {
            errorMsg = 'Location request timed out. Please try again.';
          }
          setError(errorMsg);
          setLoading(false);
          reject(new Error(errorMsg));
        },
        {
          enableHighAccuracy: true,
          timeout: 12000,
          maximumAge: 5000
        }
      );
    });
  }, []);

  // Watch position continuously (e.g. for mechanics driving to rescue)
  const startWatching = useCallback((onUpdate) => {
    if (!navigator.geolocation) return;

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    setLoading(true);

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const coords = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        };
        setCoordinates(coords);
        setAccuracy(position.coords.accuracy);
        setHeading(position.coords.heading);
        setSpeed(position.coords.speed);
        setLoading(false);
        setPermissionStatus('granted');
        if (typeof onUpdate === 'function') {
          onUpdate({
            ...coords,
            accuracy: position.coords.accuracy,
            heading: position.coords.heading,
            speed: position.coords.speed
          });
        }
      },
      (err) => {
        setLoading(false);
        if (err.code === 1) setPermissionStatus('denied');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 2000
      }
    );
  }, []);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  // Manual fallback override if user types or selects custom coordinates
  const setManualCoordinates = useCallback((lat, lng) => {
    setCoordinates({ latitude: lat, longitude: lng });
    setError(null);
  }, []);

  // Auto-fetch if requested
  useEffect(() => {
    if (autoFetch) {
      requestLocation().catch(() => {});
    }
    return () => {
      stopWatching();
    };
  }, [autoFetch, requestLocation, stopWatching]);

  return {
    coordinates,
    accuracy,
    heading,
    speed,
    loading,
    error,
    permissionStatus,
    requestLocation,
    startWatching,
    stopWatching,
    setManualCoordinates
  };
};

export default useGeolocation;