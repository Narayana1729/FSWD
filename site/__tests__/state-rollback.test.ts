import { describe, it, expect, vi, beforeEach } from "vitest";

describe("Optimistic State Rollback & Concurrency (Unit Tests)", () => {
  interface Item {
    id: string;
    name: string;
    status: string;
  }

  // Simulated state container emulating React useState + useHmsApi behavior
  class MockStateStore<T extends { id: string }> {
    public data: T[];
    public error: string | null = null;
    public storage: Map<string, string> = new Map();
    private storageKey: string;

    constructor(initialData: T[], storageKey: string) {
      this.data = [...initialData];
      this.storageKey = storageKey;
      this.storage.set(storageKey, JSON.stringify(this.data));
    }

    public setData(updater: (prev: T[]) => T[]) {
      this.data = updater(this.data);
    }

    public async createItem(
      newItem: T,
      mockApiCall: () => Promise<{ ok: boolean; status: number; json: () => Promise<any> }>
    ) {
      // 1. Optimistic insert
      this.setData((prev) => [newItem, ...prev]);

      try {
        const res = await mockApiCall();
        if (!res.ok) {
          throw new Error(`Failed to create record (HTTP ${res.status})`);
        }
        const json = await res.json();
        // Reconcile
        this.setData((prev) =>
          prev.map((item) => (item.id === newItem.id ? { ...newItem, ...(json.item || {}) } : item))
        );
        this.error = null;
        this.storage.set(this.storageKey, JSON.stringify(this.data));
        return { success: true };
      } catch (err: any) {
        // Rollback: surgically remove the optimistically added item
        this.setData((prev) => {
          const rolledBack = prev.filter((item) => item.id !== newItem.id);
          this.storage.set(this.storageKey, JSON.stringify(rolledBack));
          return rolledBack;
        });
        this.error = err.message;
        return { success: false, error: err.message };
      }
    }

    public async updateItem(
      id: string,
      updates: Partial<T>,
      mockApiCall: () => Promise<{ ok: boolean; status: number; json?: () => Promise<any> }>
    ) {
      let previousItem: T | undefined;
      this.setData((prev) => {
        previousItem = prev.find((item) => item.id === id);
        return prev.map((item) => (item.id === id ? { ...item, ...updates } : item));
      });

      try {
        const res = await mockApiCall();
        if (!res.ok) {
          throw new Error(`Failed to update record (HTTP ${res.status})`);
        }
        this.error = null;
        this.storage.set(this.storageKey, JSON.stringify(this.data));
        return { success: true };
      } catch (err: any) {
        // Rollback: revert ONLY this item
        if (previousItem) {
          const orig = previousItem;
          this.setData((prev) => {
            const rolledBack = prev.map((item) => (item.id === id ? orig : item));
            this.storage.set(this.storageKey, JSON.stringify(rolledBack));
            return rolledBack;
          });
        }
        this.error = err.message;
        return { success: false, error: err.message };
      }
    }
  }

  it("retains created item in state and updates local storage on successful 201 response", async () => {
    const store = new MockStateStore<Item>([{ id: "item-1", name: "Alpha", status: "Active" }], "test_cache");
    const newItem = { id: "item-2", name: "Beta", status: "Pending" };

    const result = await store.createItem(newItem, async () => ({
      ok: true,
      status: 201,
      json: async () => ({ item: { id: "item-2", name: "Beta", status: "Active" } }),
    }));

    expect(result.success).toBe(true);
    expect(store.data).toHaveLength(2);
    expect(store.data.find((i) => i.id === "item-2")?.status).toBe("Active");
    expect(store.error).toBeNull();
    expect(JSON.parse(store.storage.get("test_cache")!)).toHaveLength(2);
  });

  it("surgically rolls back optimistic item upon receiving HTTP 403 Forbidden", async () => {
    const store = new MockStateStore<Item>([{ id: "item-1", name: "Alpha", status: "Active" }], "test_cache");
    const newItem = { id: "item-unauthorized", name: "Forbidden Item", status: "Pending" };

    const result = await store.createItem(newItem, async () => ({
      ok: false,
      status: 403,
      json: async () => ({ error: "Forbidden" }),
    }));

    expect(result.success).toBe(false);
    expect(store.error).toContain("HTTP 403");
    // State must NOT retain the unauthorized item
    expect(store.data).toHaveLength(1);
    expect(store.data[0].id).toBe("item-1");
    // Local storage must be synchronized to avoid masking the server failure
    expect(JSON.parse(store.storage.get("test_cache")!)).toHaveLength(1);
  });

  it("rolls back state upon receiving HTTP 500 Internal Server Error", async () => {
    const store = new MockStateStore<Item>([{ id: "item-1", name: "Alpha", status: "Active" }], "test_cache");
    const newItem = { id: "item-crash", name: "Crashing Item", status: "Pending" };

    const result = await store.createItem(newItem, async () => ({
      ok: false,
      status: 500,
      json: async () => ({ error: "Internal Server Error" }),
    }));

    expect(result.success).toBe(false);
    expect(store.error).toContain("HTTP 500");
    expect(store.data).toHaveLength(1);
    expect(store.data.find((i) => i.id === "item-crash")).toBeUndefined();
  });

  it("handles overlapping concurrent mutations safely without dropping newer changes", async () => {
    const store = new MockStateStore<Item>(
      [
        { id: "item-1", name: "Alpha", status: "Active" },
        { id: "item-2", name: "Beta", status: "Active" },
      ],
      "test_cache"
    );

    // Mutation A: Update item-1 (which will fail with 500)
    // Mutation B: Update item-2 (which will succeed with 200)
    // Both are dispatched concurrently
    const promiseA = store.updateItem("item-1", { status: "Archived" }, async () => {
      await new Promise((r) => setTimeout(r, 20)); // simulated latency
      return { ok: false, status: 500 };
    });

    const promiseB = store.updateItem("item-2", { status: "Serving" }, async () => {
      return { ok: true, status: 200 };
    });

    const [resA, resB] = await Promise.all([promiseA, promiseB]);

    expect(resA.success).toBe(false);
    expect(resB.success).toBe(true);

    // Item-1 must have rolled back to "Active"
    expect(store.data.find((i) => i.id === "item-1")?.status).toBe("Active");
    // Item-2 must preserve its successful update to "Serving"
    expect(store.data.find((i) => i.id === "item-2")?.status).toBe("Serving");
  });
});
