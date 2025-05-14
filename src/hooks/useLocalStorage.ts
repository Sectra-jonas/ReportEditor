
"use client";

import { useState, useEffect } from 'react';

function useLocalStorage<T>(key: string, initialValue: T) {
  // 1. Initialize state with initialValue.
  // This ensures the first render on both server and client (before hydration/useEffect) is consistent.
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // 2. Effect to load from localStorage (Client-side, after mount)
  // This runs after the initial server-consistent render.
  useEffect(() => {
    if (typeof window === "undefined") {
      // Should not happen as useEffect runs client-side, but a safeguard.
      return;
    }
    try {
      const item = window.localStorage.getItem(key);
      // Only update state if an item was actually found in localStorage.
      if (item !== null) {
        setStoredValue(JSON.parse(item));
      }
      // If item is null, storedValue (from useState above) correctly remains initialValue.
    } catch (error) {
      console.error(`Error reading localStorage key "${key}" on mount:`, error);
      // In case of error, storedValue remains initialValue, which is desirable.
    }
  // Only re-run this effect if the storage key itself changes.
  // initialValue is for the very first setup, not for re-triggering loads from storage.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  // 3. Effect to save to localStorage when storedValue changes (Client-side)
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue] as const;
}

export default useLocalStorage;
