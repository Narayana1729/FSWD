"use client";

import { useState, useEffect, useCallback } from "react";

interface UseHmsApiOptions<T> {
  endpoint: string;
  dataKey: string;
  initialData: T[];
}

export function useHmsApi<T extends { id?: string | number }>(
  endpoint: string,
  dataKey: string,
  initialData: T[]
) {
  const [data, setData] = useState<T[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem(`dronagiri_api_cache_${dataKey}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.warn(`LocalStorage read error for ${dataKey}:`, e);
      }
    }
    return initialData;
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch live records from Prisma REST API
  const fetchApiData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/${endpoint}`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();
      const records = json[dataKey];

      if (Array.isArray(records) && records.length > 0) {
        setData(records);
        if (typeof window !== "undefined") {
          localStorage.setItem(`dronagiri_api_cache_${dataKey}`, JSON.stringify(records));
        }
      }
      setError(null);
    } catch (err: any) {
      console.warn(`[useHmsApi] GET /api/${endpoint} failed, keeping fallback state:`, err.message);
      setError(err.message || "Failed to fetch from server");
    } finally {
      setLoading(false);
    }
  }, [endpoint, dataKey]);

  useEffect(() => {
    fetchApiData();
  }, [fetchApiData]);

  // Sync to localStorage on data changes
  useEffect(() => {
    if (typeof window !== "undefined" && data && data.length > 0) {
      try {
        localStorage.setItem(`dronagiri_api_cache_${dataKey}`, JSON.stringify(data));
      } catch (e) {
        console.warn(`LocalStorage write error for ${dataKey}:`, e);
      }
    }
  }, [dataKey, data]);

  // Create new record via POST /api/{endpoint}
  const createItem = useCallback(
    async (newItem: T, postBody?: Record<string, any>) => {
      // Optimistic update
      const updated = [newItem, ...data];
      setData(updated);

      try {
        const res = await fetch(`/api/${endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(postBody || newItem),
        });

        if (res.ok) {
          const json = await res.json();
          // If server returns created record with generated DB ID, sync it
          const createdRecord = json.patient || json.appointment || json.bed || json.item || json[dataKey.slice(0, -1)];
          if (createdRecord) {
            setData((prev) => prev.map((item) => (item.id === newItem.id ? { ...newItem, ...createdRecord } : item)));
          }
        }
      } catch (err: any) {
        console.warn(`[useHmsApi] POST /api/${endpoint} failed (persisted to local cache):`, err.message);
      }
    },
    [endpoint, dataKey, data]
  );

  // Update existing record via PATCH /api/{endpoint}
  const updateItem = useCallback(
    async (id: string | number, updatedFields: Partial<T>, patchBody?: Record<string, any>) => {
      // Optimistic update
      const updated = data.map((item) => (item.id === id ? { ...item, ...updatedFields } : item));
      setData(updated);

      try {
        await fetch(`/api/${endpoint}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patchBody || { id, ...updatedFields }),
        });
      } catch (err: any) {
        console.warn(`[useHmsApi] PATCH /api/${endpoint} failed (persisted to local cache):`, err.message);
      }
    },
    [endpoint, data]
  );

  return {
    data,
    setData,
    loading,
    error,
    refetch: fetchApiData,
    createItem,
    updateItem,
  };
}
