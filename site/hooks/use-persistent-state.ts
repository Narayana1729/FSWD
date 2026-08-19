"use client";

import { useState, useEffect } from "react";

export function usePersistentState<T>(key: string, defaultValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = window.localStorage.getItem(key);
        if (saved !== null) {
          return JSON.parse(saved);
        }
      } catch (err) {
        console.error(`Error reading localStorage key "${key}":`, err);
      }
    }
    return defaultValue;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        window.localStorage.setItem(key, JSON.stringify(state));
      } catch (err) {
        console.error(`Error writing localStorage key "${key}":`, err);
      }
    }
  }, [key, state]);

  return [state, setState];
}
