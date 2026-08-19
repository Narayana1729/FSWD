"use client";

import React, { useState } from "react";
import {
  Activity,
  ZoomIn,
  ZoomOut,
  Sun,
  Sliders,
  Maximize2,
  RotateCw,
  FileText,
  CheckCircle,
  Eye,
  Layers,
  Plus,
} from "lucide-react";
import { RadiologyScan } from "@/lib/hms-data";

interface RadiologyPACSViewProps {
  scans: RadiologyScan[];
  onUpdateScans?: (scans: RadiologyScan[]) => void;
}

export function RadiologyPACSView({ scans, onUpdateScans }: RadiologyPACSViewProps) {
  const [scanList, setScanList] = useState<RadiologyScan[]>(scans);
  const [selectedScan, setSelectedScan] = useState<RadiologyScan>(scanList[0] || scans[0]);
  const [showNewScanModal, setShowNewScanModal] = useState(false);

  React.useEffect(() => {
    setScanList(scans);
  }, [scans]);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [inverted, setInverted] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [scanSuccess, setScanSuccess] = useState<string | null>(null);
  const [reportText, setReportText] = useState<string>("Normal study. Recommended routine clinical follow-up.");

  const handleAuthorizeReport = async () => {
    setScanError(null);
    setScanSuccess(null);

    if (!selectedScan) return;

    if (selectedScan.status === "Completed") {
      setScanError(`Radiology scan #${selectedScan.id} has already been reported and finalized.`);
      return;
    }

    try {
      const res = await fetch("/api/radiology/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          radiologyOrderId: selectedScan.id,
          reportText: reportText || "Diagnostic Impression: Unremarkable imaging scan.",
          findings: "No focal consolidation, acute fracture, or structural abnormality identified.",
          impression: "Normal study. Recommended routine clinical follow-up.",
          reportedBy: "Dr. Jivaka",
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setScanError(json.error || "Failed to authorize radiology report.");
        return;
      }

      const updatedScan = { ...selectedScan, status: "Completed", reportText };
      const updatedList = scanList.map((s) => (s.id === selectedScan.id ? updatedScan : s));
      setScanList(updatedList);
      if (onUpdateScans) onUpdateScans(updatedList);
      setSelectedScan(updatedScan);
      setScanSuccess(json.message || `Radiology report for #${selectedScan.id} authorized & billed!`);
    } catch (e: any) {
      setScanError(e.message || "Network error while authorizing report");
    }
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Radiology &amp; DICOM PACS Viewer UI</h2>
          <p className="text-xs text-slate-500">Multi-modality imaging requests (X-Ray, CT, MRI, Ultrasound) and diagnostic DICOM workstation</p>
        </div>

        <button
          onClick={() => setShowNewScanModal(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Imaging Scan</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Worklist Queue */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Radiology Worklist</h3>
          <div className="space-y-2">
            {scanList.map((s) => (
              <div
                key={s.id}
                onClick={() => {
                  setSelectedScan(s);
                  if (s.reportText) setReportText(s.reportText);
                }}
                className={`p-3 rounded-xl border cursor-pointer transition-all text-xs ${
                  selectedScan.id === s.id
                    ? "bg-blue-50 border-blue-300 ring-2 ring-blue-500/20 font-bold"
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">{s.scanType} — {s.bodyPart}</span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {s.scanDate ? String(s.scanDate).slice(0, 10) : new Date().toISOString().slice(0, 10)}
                  </span>
                </div>
                <div className="text-slate-600 mt-1">{s.patientName}</div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2">
                  <span>Rad: {s.radiologist}</span>
                  <span className="text-blue-600 font-semibold">{s.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center/Right: Interactive Simulated DICOM Viewer Workstation */}
        <div className="lg:col-span-8 bg-slate-950 text-white rounded-3xl p-6 shadow-2xl space-y-4 border border-slate-800">
          {/* DICOM Control Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-blue-600/30 border border-blue-500/40 text-blue-400 font-mono font-bold rounded-lg uppercase">
                {selectedScan.scanType}
              </span>
              <span className="font-bold text-slate-200">{selectedScan.patientName}</span>
              <span className="text-slate-500 font-mono">({selectedScan.patientId})</span>
            </div>

            {/* Viewer Controls */}
            <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
              <button
                onClick={() => setZoomLevel((z) => Math.min(200, z + 25))}
                className="p-1.5 hover:bg-slate-800 rounded text-slate-300"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.max(50, z - 25))}
                className="p-1.5 hover:bg-slate-800 rounded text-slate-300"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setInverted(!inverted)}
                className={`p-1.5 rounded ${inverted ? "bg-blue-600 text-white" : "hover:bg-slate-800 text-slate-300"}`}
                title="Invert Colors"
              >
                <Sun className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setZoomLevel(100);
                  setBrightness(100);
                  setContrast(100);
                  setInverted(false);
                }}
                className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] rounded font-mono"
              >
                Reset
              </button>
            </div>
          </div>

          {/* Canvas Image Frame with DICOM HUD Metadata Overlays */}
          <div className="relative h-96 bg-black rounded-2xl border border-slate-800 overflow-hidden flex items-center justify-center">
            {/* DICOM HUD Metadata Overlays (Top Left & Top Right) */}
            <div className="absolute top-3 left-3 text-[10px] font-mono text-emerald-400 space-y-0.5 pointer-events-none z-10 bg-black/60 p-2 rounded-lg backdrop-blur-xs">
              <div>PATIENT: {(selectedScan.patientName || (selectedScan.patient as any)?.name || "UNKNOWN PATIENT").toUpperCase()}</div>
              <div>ID: {selectedScan.patientId}</div>
              <div>SERIES: #1 (128 SLICES)</div>
            </div>

            <div className="absolute top-3 right-3 text-[10px] font-mono text-emerald-400 space-y-0.5 pointer-events-none z-10 text-right bg-black/60 p-2 rounded-lg backdrop-blur-xs">
              <div>MODALITY: {selectedScan.scanType}</div>
              <div>MATRIX: 512 x 512 x 16 bit</div>
              <div>ZOOM: {zoomLevel}%</div>
            </div>

            {/* Simulated Scan Image */}
            <img
              src={selectedScan.dcmImage}
              alt="DICOM Scan"
              className="max-h-full object-contain transition-all duration-200"
              style={{
                transform: `scale(${zoomLevel / 100})`,
                filter: `${inverted ? "invert(1)" : ""} brightness(${brightness}%) contrast(${contrast}%)`,
              }}
            />
          </div>

          {/* Radiologist Diagnosis Writer */}
          <div className="space-y-2 pt-2">
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
              Radiologist Diagnostic Impression Report
            </label>
            <textarea
              value={reportText}
              onChange={(e) => setReportText(e.target.value)}
              className="w-full p-3 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl text-xs outline-none focus:border-blue-500 h-24 leading-relaxed font-mono"
            />
            
            <div className="flex items-center justify-between pt-2">
              <span className="text-[10px] text-slate-400 font-mono">AUTHORIZED RADIOLOGIST: Dr. Jivaka</span>
              <button
                onClick={handleAuthorizeReport}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                <CheckCircle className="w-4 h-4" /> Authorize & Sign Off Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Schedule Imaging Scan Modal */}
      {showNewScanModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4 text-xs font-sans">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">Schedule Radiology Imaging Order</h3>
              <button onClick={() => setShowNewScanModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-sm">
                ✕
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const patientName = (formData.get("patientName") as string) || "Koushik";
                const scanType = (formData.get("scanType") as any) || "X-RAY";
                const bodyPart = (formData.get("bodyPart") as string) || "Chest PA View";
                const radiologist = (formData.get("radiologist") as string) || "Dr. Vikram Nair";

                const newScan: RadiologyScan = {
                  id: `RAD-${Math.floor(700 + Math.random() * 90)}`,
                  patientId: `P-${Math.floor(1000 + Math.random() * 900)}`,
                  patientName,
                  scanType,
                  bodyPart,
                  scanDate: new Date().toISOString(),
                  radiologist,
                  status: "Scheduled",
                  dcmImage: "/images/consult-order.png",
                  reportText: `Radiology Impression for ${bodyPart}: Normal bone structure and soft tissue density.`,
                };

                try {
                  fetch("/api/radiology", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      patientId: "cmsvcbdc80011j1bwjcniweo4",
                      doctorId: "DOC-101",
                      scanType,
                      bodyPart,
                      dcmImage: "/images/consult-order.png",
                    }),
                  });
                } catch (e) {
                  console.warn("Failed to persist radiology order to DB:", e);
                }

                const updated = [newScan, ...scanList];
                setScanList(updated);
                if (onUpdateScans) onUpdateScans(updated);
                setSelectedScan(newScan);
                setReportText(newScan.reportText || "");
                setShowNewScanModal(false);
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Patient Name</label>
                  <input required name="patientName" placeholder="e.g. Sundar" className="w-full p-2.5 border border-slate-200 rounded-xl outline-none font-bold" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Radiologist</label>
                  <input name="radiologist" defaultValue="Dr. Vikram Nair" className="w-full p-2.5 border border-slate-200 rounded-xl outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Scan Modality</label>
                  <select name="scanType" className="w-full p-2.5 border border-slate-200 rounded-xl outline-none bg-white font-bold text-blue-600">
                    <option value="X-RAY">X-RAY (Digital Radiography)</option>
                    <option value="CT">CT (Computed Tomography 64-Slice)</option>
                    <option value="MRI">MRI (3.0 Tesla Cardiac/Brain)</option>
                    <option value="ULTRASOUND">ULTRASOUND (Color Doppler)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Anatomical Region / View</label>
                  <input name="bodyPart" defaultValue="Chest PA View" className="w-full p-2.5 border border-slate-200 rounded-xl outline-none font-semibold" />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowNewScanModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-semibold text-slate-700">
                  Cancel
                </button>
                <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md">
                  Confirm Imaging Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
