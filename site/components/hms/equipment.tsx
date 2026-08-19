"use client";

import React, { useState } from "react";
import {
  Boxes,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wrench,
  Search,
  Plus,
} from "lucide-react";
import { MedicalEquipmentItem } from "@/lib/hms-data";

interface EquipmentViewProps {
  equipment: MedicalEquipmentItem[];
  onUpdateEquipment?: (equipment: MedicalEquipmentItem[]) => void;
}

export function EquipmentView({ equipment, onUpdateEquipment }: EquipmentViewProps) {
  const [eqList, setEqList] = useState<MedicalEquipmentItem[]>(equipment);
  const [showAddModal, setShowAddModal] = useState(false);

  React.useEffect(() => {
    setEqList(equipment);
  }, [equipment]);

  const handleMarkCalibrated = (id: string) => {
    const today = new Date().toISOString().slice(0, 10);
    const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const updated = eqList.map((e) => (e.id === id ? { ...e, status: "Operational" as const, lastCalibrated: today, nextCalibration: nextYear } : e));
    setEqList(updated);
    if (onUpdateEquipment) onUpdateEquipment(updated);
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Medical Equipment Inventory &amp; Calibration</h2>
          <p className="text-xs text-slate-500">MRI, CT Scanners, Ventilators, Defibrillators, maintenance logs, and calibration schedules</p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-[#111] hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Medical Asset</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {eqList.map((item) => (
          <div key={item.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-900 text-sm">{item.name}</span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                    item.status === "Operational"
                      ? "bg-emerald-100 text-emerald-700"
                      : item.status === "In Use"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {item.status}
                </span>
              </div>

              <div className="text-xs text-slate-500 font-mono">Serial: {item.serialNo} • {item.location}</div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">Last Calibrated</span>
                  <div className="font-mono text-slate-800">{item.lastCalibrated}</div>
                </div>
                <div>
                  <span className="text-slate-400 text-[10px] uppercase font-semibold">Next Calibration</span>
                  <div className="font-mono text-slate-800">{item.nextCalibration}</div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <button
                onClick={() => handleMarkCalibrated(item.id)}
                className="w-full py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-bold rounded-lg text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Log Calibration Maintenance</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Register New Asset Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Register New Medical Equipment Asset</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const name = (formData.get("name") as string) || "Medical Asset";
                const serialNo = (formData.get("serialNo") as string) || `SN-${Math.floor(100000 + Math.random() * 900000)}`;
                const location = (formData.get("location") as string) || "ICU Complex";

                const newItem: MedicalEquipmentItem = {
                  id: `EQ-${Math.floor(50 + Math.random() * 50)}`,
                  name,
                  serialNo,
                  location,
                  status: "Operational",
                  lastCalibrated: new Date().toISOString().slice(0, 10),
                  nextCalibration: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
                };

                const updated = [newItem, ...eqList];
                setEqList(updated);
                if (onUpdateEquipment) onUpdateEquipment(updated);
                setShowAddModal(false);
              }}
              className="space-y-3"
            >
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Equipment Name</label>
                <input required name="name" placeholder="e.g. Philips IntelliVue Cardiac Monitor" className="w-full p-2.5 border border-slate-200 rounded-xl outline-none font-bold" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Serial Number</label>
                  <input name="serialNo" placeholder="SN-998822" className="w-full p-2.5 border border-slate-200 rounded-xl outline-none font-mono" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Hospital Location / Ward</label>
                  <input name="location" defaultValue="ICU Ward Bay-2" className="w-full p-2.5 border border-slate-200 rounded-xl outline-none" />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-semibold text-slate-700">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-[#111] hover:bg-slate-800 text-white font-bold rounded-xl shadow-md">
                  Register Asset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
