import { useState, useCallback } from 'react';

/* ─── Reverse geocode: coords → readable address ────── */
const reverseGeocode = async (lat, lon) => {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}`);
    if (!res.ok) throw new Error('geocode failed');
    const data = await res.json();
    const a = data.address || {};
    const parts = [
      a.house_number,
      a.road,
      a.neighbourhood || a.suburb,
      a.city || a.town || a.village,
      a.state,
      a.postcode,
    ].filter(Boolean);
    if (parts.length) return parts.join(', ');
    return data.display_name || '';
  } catch {
    return '';
  }
};

/* ─── Hook: getCurrent → { address, coords, error } ─── */
export const useGeolocation = () => {
  const [state, setState] = useState({ address: '', coords: null, error: '', loading: false });

  const getCurrent = useCallback(async () => {
    if (!('geolocation' in navigator)) {
      setState({ address: '', coords: null, error: 'Geolocation is not supported by your browser.', loading: false });
      return null;
    }

    setState(s => ({ ...s, loading: true, error: '' }));

    const getPosition = (opts) =>
      new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, opts);
      });

    try {
      // Fast attempt with high accuracy; fall back to cached/low-accuracy fix
      let position;
      try {
        position = await getPosition({ enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
      } catch (err) {
        if (err && (err.code === 1 || err.name === 'NotAllowedError')) throw err;
        position = await getPosition({ enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 });
      }

      const { latitude, longitude } = position.coords;
      const address = await reverseGeocode(latitude, longitude);

      const fallback = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
      const result = { address: address || fallback, coords: { latitude, longitude }, error: '', loading: false };
      setState(result);
      return result;
    } catch (err) {
      let msg = 'Could not get your location.';
      if (err && (err.code === 1 || err.name === 'NotAllowedError')) msg = 'Location permission denied. Please allow location access.';
      else if (err && (err.code === 3 || err.name === 'TimeoutError')) msg = 'Getting location timed out. Try again.';
      else if (err && err.code === 2) msg = 'Location unavailable. Please try again.';
      setState({ address: '', coords: null, error: msg, loading: false });
      return null;
    }
  }, []);

  return { ...state, getCurrent };
};
