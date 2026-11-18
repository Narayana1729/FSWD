"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("hms_auth_token");
    if (token) headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export interface MutationResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export function useHmsApi<T extends Record<string, any>>(
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

  // Keep a reference to latest data for stable reading without breaking functional updaters
  const dataRef = useRef<T[]>(data);
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Fetch live records from Prisma REST API
  const fetchApiData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/${endpoint}`, {
        headers: getAuthHeaders(),
        credentials: "same-origin",
      });
      if (!res.ok) {
        let msg = `HTTP error! status: ${res.status}`;
        try {
          const errData = await res.json();
          if (errData.message) msg = errData.message;
          else if (errData.error) msg = errData.error;
        } catch {}
        throw new Error(msg);
      }
      const json = await res.json();
      const records = json[dataKey];

      if (Array.isArray(records)) {
        setData(records);
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(`dronagiri_api_cache_${dataKey}`, JSON.stringify(records));
          } catch (e) {
            console.warn(`LocalStorage write error for ${dataKey}:`, e);
          }
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

  // Create new record via POST /api/{endpoint} with robust optimistic rollback
  const createItem = useCallback(
    async (newItem: T, postBody?: Record<string, any>): Promise<MutationResult<T>> => {
      // 1 & 2: Apply optimistic update using functional updater to avoid race conditions
      setData((prev) => [newItem, ...prev]);

      try {
        // 3: Send API request
        const res = await fetch(`/api/${endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          credentials: "same-origin",
          body: JSON.stringify(postBody || newItem),
        });

        if (!res.ok) {
          let errMsg = `Failed to create record (HTTP ${res.status})`;
          try {
            const errJson = await res.json();
            if (errJson.message) errMsg = errJson.message;
            else if (errJson.error) errMsg = errJson.error;
          } catch {}
          throw new Error(errMsg);
        }

        // 4: On success, reconcile state with authoritative server response where available
        const json = await res.json();
        const createdRecord =
          json.patient ||
          json.appointment ||
          json.bed ||
          json.item ||
          json[dataKey.slice(0, -1)];

        setData((prev) => {
          const next = prev.map((item) =>
            item.id === newItem.id ? { ...newItem, ...(createdRecord || {}) } : item
          );
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem(`dronagiri_api_cache_${dataKey}`, JSON.stringify(next));
            } catch (e) {
              console.warn(`LocalStorage write error for ${dataKey}:`, e);
            }
          }
          return next;
        });

        setError(null);
        return { success: true, data: (createdRecord || newItem) as T };
      } catch (err: any) {
        const errorMessage = err.message || "Failed to create item on server";
        console.warn(`[useHmsApi] POST /api/${endpoint} failed, rolling back:`, errorMessage);

        // 5 & 7 & 8: Rollback - surgically remove ONLY the optimistically added item
        // This preserves any other items added or updated concurrently!
        setData((prev) => {
          const rolledBack = prev.filter((item) => item.id !== newItem.id);
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem(`dronagiri_api_cache_${dataKey}`, JSON.stringify(rolledBack));
            } catch (e) {
              console.warn(`LocalStorage write error during rollback for ${dataKey}:`, e);
            }
          }
          return rolledBack;
        });

        // 6: Propagate and display error
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [endpoint, dataKey]
  );

  // Update existing record via PATCH /api/{endpoint} with surgical rollback
  const updateItem = useCallback(
    async (
      id: string | number,
      updatedFields: Partial<T>,
      patchBody?: Record<string, any>
    ): Promise<MutationResult<T>> => {
      // 1 & 2: Capture previous state of this specific item and apply optimistic update
      let previousItem: T | undefined;

      setData((prev) => {
        previousItem = prev.find(
          (item) =>
            item.id === id ||
            (item as any).tokenNo === id ||
            (item as any).bedNo === id
        );
        return prev.map((item) =>
          item.id === id ||
          (item as any).tokenNo === id ||
          (item as any).bedNo === id
            ? { ...item, ...updatedFields }
            : item
        );
      });

      try {
        // 3: Send API request
        const res = await fetch(`/api/${endpoint}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          credentials: "same-origin",
          body: JSON.stringify(patchBody || { id, ...updatedFields }),
        });

        if (!res.ok) {
          let errMsg = `Failed to update record (HTTP ${res.status})`;
          try {
            const errJson = await res.json();
            if (errJson.message) errMsg = errJson.message;
            else if (errJson.error) errMsg = errJson.error;
          } catch {}
          throw new Error(errMsg);
        }

        // 4: Reconcile with server response if provided
        try {
          const json = await res.json();
          const serverRecord =
            json.patient ||
            json.appointment ||
            json.bed ||
            json.item ||
            json[dataKey.slice(0, -1)];

          setData((prev) => {
            const next = prev.map((item) =>
              item.id === id ||
              (item as any).tokenNo === id ||
              (item as any).bedNo === id
                ? { ...item, ...(serverRecord || {}) }
                : item
            );
            if (typeof window !== "undefined") {
              try {
                localStorage.setItem(`dronagiri_api_cache_${dataKey}`, JSON.stringify(next));
              } catch (e) {
                console.warn(`LocalStorage write error for ${dataKey}:`, e);
              }
            }
            return next;
          });
        } catch {
          // If no JSON response, preserve the optimistic update in localStorage
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem(
                `dronagiri_api_cache_${dataKey}`,
                JSON.stringify(dataRef.current)
              );
            } catch (e) {
              console.warn(`LocalStorage write error for ${dataKey}:`, e);
            }
          }
        }

        setError(null);
        return { success: true };
      } catch (err: any) {
        const errorMessage = err.message || "Failed to update item on server";
        console.warn(`[useHmsApi] PATCH /api/${endpoint} failed, rolling back:`, errorMessage);

        // 5 & 7 & 8: Rollback ONLY this specific item to its previous state
        if (previousItem) {
          const orig = previousItem;
          setData((prev) => {
            const rolledBack = prev.map((item) =>
              item.id === id ||
              (item as any).tokenNo === id ||
              (item as any).bedNo === id
                ? orig
                : item
            );
            if (typeof window !== "undefined") {
              try {
                localStorage.setItem(`dronagiri_api_cache_${dataKey}`, JSON.stringify(rolledBack));
              } catch (e) {
                console.warn(`LocalStorage write error during rollback for ${dataKey}:`, e);
              }
            }
            return rolledBack;
          });
        }

        // 6: Propagate and display error
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [endpoint, dataKey]
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
