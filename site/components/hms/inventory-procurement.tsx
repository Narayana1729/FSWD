"use client";

import React, { useState } from "react";
import {
  Boxes,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
  Search,
  ShoppingCart,
  Building2,
} from "lucide-react";
import { InventoryConsumable } from "@/lib/hms-data";

interface InventoryProcurementViewProps {
  inventory?: InventoryConsumable[];
  onUpdateInventory?: (items: InventoryConsumable[]) => void;
}

export function InventoryProcurementView({ inventory, onUpdateInventory }: InventoryProcurementViewProps = {}) {
  const [items, setItems] = useState<InventoryConsumable[]>(inventory || [
    { id: "CON-01", itemName: "Disposable Syringes 5ml", category: "IV & Syringes", stockQty: 12500, unit: "Pcs", minLevel: 2000, supplier: "MedTech Supplies Inc", unitCost: 0.25 },
    { id: "CON-02", itemName: "Latex Surgical Gloves (Size M)", category: "PPE", stockQty: 850, unit: "Boxes", minLevel: 1000, supplier: "SafeCare PPE Ltd", unitCost: 14.0 },
    { id: "CON-03", itemName: "N95 Respirator Masks", category: "PPE", stockQty: 3200, unit: "Pcs", minLevel: 500, supplier: "3M Healthcare", unitCost: 1.8 },
    { id: "CON-04", itemName: "IV Infusion Sets 20G", category: "IV & Syringes", stockQty: 480, unit: "Pcs", minLevel: 500, supplier: "Becton Dickinson", unitCost: 2.1 },
    { id: "CON-05", itemName: "Sterile Gauze Bandages 4x4", category: "Surgical Tools", stockQty: 6400, unit: "Pcs", minLevel: 1500, supplier: "MedTech Supplies Inc", unitCost: 0.45 },
  ]);

  React.useEffect(() => {
    if (inventory) setItems(inventory);
  }, [inventory]);

  const [searchTerm, setSearchTerm] = useState("");
  const [showRequisitionModal, setShowRequisitionModal] = useState(false);

  const filtered = items.filter((i) =>
    (i.itemName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (i.category || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Consumables Inventory &amp; Procurement</h2>
          <p className="text-xs text-slate-500">Hospital stock monitoring, low-stock detection, purchase requisitions, and vendor orders</p>
        </div>

        <button
          onClick={() => setShowRequisitionModal(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Purchase Order Requisition</span>
        </button>
      </div>

      {/* Inventory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search Consumable Item, Category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl outline-none focus:border-blue-600 bg-slate-50/50"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3.5 px-4">Item Name</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Current Stock</th>
                <th className="py-3.5 px-4">Min Reorder Level</th>
                <th className="py-3.5 px-4">Supplier Vendor</th>
                <th className="py-3.5 px-4">Unit Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{item.itemName}</td>
                  <td className="py-3.5 px-4 text-slate-600">{item.category}</td>
                  <td className="py-3.5 px-4 font-bold">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] ${
                        item.stockQty <= item.minLevel
                          ? "bg-rose-100 text-rose-700 font-extrabold"
                          : "bg-emerald-100 text-emerald-700 font-bold"
                      }`}
                    >
                      {item.stockQty} {item.unit}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono">{item.minLevel} {item.unit}</td>
                  <td className="py-3.5 px-4 text-slate-700">{item.supplier}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">₹{item.unitCost.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Purchase Order Requisition Modal */}
      {showRequisitionModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">New Purchase Order Requisition</h3>
              <button onClick={() => setShowRequisitionModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const itemName = (formData.get("itemName") as string) || "IV Sets";
                const category = (formData.get("category") as string) || "General Consumable";
                const stockQty = parseInt(formData.get("stockQty") as string) || 1000;
                const unit = (formData.get("unit") as string) || "Pcs";
                const supplier = (formData.get("supplier") as string) || "MedTech Supplies Inc";
                const unitCost = parseFloat(formData.get("unitCost") as string) || 1.5;

                const newItem: InventoryConsumable = {
                  id: `CON-${Math.floor(10 + Math.random() * 90)}`,
                  itemName,
                  category,
                  stockQty,
                  unit,
                  minLevel: 500,
                  supplier,
                  unitCost,
                };

                const updated = [newItem, ...items];
                setItems(updated);
                if (onUpdateInventory) onUpdateInventory(updated);
                setShowRequisitionModal(false);
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Item Name</label>
                  <input required name="itemName" placeholder="e.g. Sterile Surgical Drapes" className="w-full p-2.5 border border-slate-200 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Category</label>
                  <select name="category" className="w-full p-2.5 border border-slate-200 rounded-xl outline-none bg-white">
                    <option value="PPE">PPE Equipment</option>
                    <option value="IV & Syringes">IV &amp; Syringes</option>
                    <option value="Surgical Tools">Surgical Tools</option>
                    <option value="General Consumable">General Consumable</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quantity</label>
                  <input type="number" name="stockQty" defaultValue="2000" className="w-full p-2.5 border border-slate-200 rounded-xl outline-none font-bold" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit Type</label>
                  <input name="unit" defaultValue="Pcs" className="w-full p-2.5 border border-slate-200 rounded-xl outline-none" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unit Cost (₹)</label>
                  <input type="number" step="0.01" name="unitCost" defaultValue="2.50" className="w-full p-2.5 border border-slate-200 rounded-xl outline-none font-bold" />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Approved Supplier Vendor</label>
                <input name="supplier" defaultValue="3M Healthcare Global" className="w-full p-2.5 border border-slate-200 rounded-xl outline-none" />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowRequisitionModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-semibold text-slate-700">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md">
                  Submit Purchase Requisition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
