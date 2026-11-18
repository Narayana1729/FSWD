"use client";

import React, { useState } from "react";
import {
  Users,
  Clock,
  Building2,
  DollarSign,
  UserCheck,
  Calendar,
  CheckCircle,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  X,
  Shield,
  Briefcase,
} from "lucide-react";

import { StaffMember } from "@/lib/hms-data";
import { getAuthHeaders } from "@/hooks/use-hms-api";

interface StaffHRViewProps {
  staff?: StaffMember[];
  onUpdateStaff?: (staff: StaffMember[]) => void;
}

export function StaffHRView({ staff, onUpdateStaff }: StaffHRViewProps = {}) {
  const [staffList, setStaffList] = useState<StaffMember[]>(staff || [
    { id: "STF-101", name: "Nurse Priya Nair", role: "Nurse", dept: "ICU Ward", shift: "Morning (7AM-3PM)", status: "Present", salary: 5800 },
    { id: "STF-102", name: "Tech Alok Verma", role: "Lab Technician", dept: "Central Laboratory", shift: "Morning (7AM-3PM)", status: "Present", salary: 5200 },
    { id: "STF-103", name: "Pharmacist Ananya Rao", role: "Pharmacist", dept: "Main Pharmacy", shift: "Evening (3PM-11PM)", status: "Clocked Out", salary: 6100 },
    { id: "STF-104", name: "Driver Maruti Rescue", role: "Driver", dept: "Ambulance Fleet", shift: "Night (11PM-7AM)", status: "On Leave", salary: 4200 },
  ]);

  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("All");
  const [hrSuccess, setHrSuccess] = useState<string | null>(null);

  React.useEffect(() => {
    if (staff && staff.length > 0) setStaffList(staff);
  }, [staff]);

  const getStaffName = (s: any) => s?.name || "Staff Member";
  const getStaffId = (s: any) => s?.staffId || s?.id || "STF-100";
  const getStaffRole = (s: any) => s?.role || "Healthcare Staff";
  const getStaffDept = (s: any) => {
    if (typeof s?.department === "object" && s?.department) return s.department.name || "General";
    return s?.departmentId || s?.dept || "General Ward";
  };
  const getStaffShift = (s: any) => s?.shift || "Morning (7AM-3PM)";
  const getStaffStatus = (s: any) => s?.attendanceStatus || s?.status || "Present";
  const getStaffSalary = (s: any) => {
    const sal = s?.salaryMonthly ?? s?.salary ?? 5500;
    return typeof sal === "number" ? sal : parseFloat(sal) || 5500;
  };

  const filteredStaff = staffList.filter((s) => {
    const name = getStaffName(s).toLowerCase();
    const role = getStaffRole(s).toLowerCase();
    const dept = getStaffDept(s).toLowerCase();
    const matchesSearch = name.includes(searchTerm.toLowerCase()) || role.includes(searchTerm.toLowerCase()) || dept.includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter === "All" || getStaffDept(s) === deptFilter;
    return matchesSearch && matchesDept;
  });

  const toggleAttendance = (id: string) => {
    const updated = staffList.map((s) => {
      const sId = getStaffId(s);
      if (sId === id || s.id === id) {
        const currentStatus = getStaffStatus(s);
        const newStatus = currentStatus === "Present" ? "Clocked Out" : "Present";
        return {
          ...s,
          status: newStatus,
          attendanceStatus: newStatus,
        };
      }
      return s;
    });
    setStaffList(updated);
    if (onUpdateStaff) onUpdateStaff(updated);
    setHrSuccess(`Updated attendance status for staff #${id}.`);
  };

  const handleOnboardStaff = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = (formData.get("name") as string) || "New Staff";
    const role = (formData.get("role") as string) || "Nurse";
    const dept = (formData.get("dept") as string) || "General Ward";
    const shift = (formData.get("shift") as string) || "Morning (7AM-3PM)";
    const salary = parseInt(formData.get("salary") as string) || 5000;

    const newStaff: StaffMember = {
      id: `STF-${Math.floor(105 + Math.random() * 900)}`,
      name,
      role,
      dept,
      shift,
      status: "Present",
      salary,
    };

    try {
      await fetch("/api/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        credentials: "same-origin",
        body: JSON.stringify({
          name,
          role,
          dept,
          shift,
          salary,
        }),
      });
    } catch (err) {
      console.warn("Failed to persist staff to database:", err);
    }

    const updated = [newStaff, ...staffList];
    setStaffList(updated);
    if (onUpdateStaff) onUpdateStaff(updated);
    setShowAddModal(false);
    setHrSuccess(`Onboarded ${name} as ${role} (${dept})!`);
  };

  const presentCount = staffList.filter((s) => getStaffStatus(s) === "Present").length;
  const totalPayroll = staffList.reduce((acc, s) => acc + getStaffSalary(s), 0);

  return (
    <div className="space-y-6 font-sans text-[#111]">
      {/* ── TOP HERO BANNER ────────────────────────────────────────── */}
      <div className="bg-[#111] text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
            <Users className="w-7 h-7 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <h2 className="text-xl font-bold tracking-tight">Staff Roster, Attendance &amp; HR Management</h2>
            </div>
            <p className="text-xs text-white/60">
              Nurses, laboratory technologists, pharmacists, ambulance drivers, attendance tracking, and monthly payroll
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-900 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Onboard New Staff Member</span>
        </button>
      </div>

      {/* Success Notification */}
      {hrSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{hrSuccess}</span>
          </div>
          <button onClick={() => setHrSuccess(null)}><X className="w-4 h-4 text-emerald-400" /></button>
        </div>
      )}

      {/* ── METRICS STRIP ──────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div className="bg-[#F0EEE8] p-4 rounded-2xl border border-black/10">
          <span className="text-[10px] text-black/50 uppercase font-bold font-pixel block">Total Hospital Staff</span>
          <div className="text-xl font-bold text-[#111] mt-1">{staffList.length} Active</div>
        </div>
        <div className="bg-[#F0EEE8] p-4 rounded-2xl border border-black/10">
          <span className="text-[10px] text-emerald-800 uppercase font-bold font-pixel block">Present on Duty</span>
          <div className="text-xl font-bold text-emerald-900 mt-1">{presentCount} Clocked In</div>
        </div>
        <div className="bg-[#F0EEE8] p-4 rounded-2xl border border-black/10">
          <span className="text-[10px] text-amber-800 uppercase font-bold font-pixel block">Off Shift / On Leave</span>
          <div className="text-xl font-bold text-amber-900 mt-1">{staffList.length - presentCount} Staff</div>
        </div>
        <div className="bg-[#F0EEE8] p-4 rounded-2xl border border-black/10">
          <span className="text-[10px] text-black/50 uppercase font-bold font-pixel block">Est. Monthly Payroll</span>
          <div className="text-xl font-bold font-mono text-[#111] mt-1">₹{totalPayroll.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* ── SEARCH & FILTER CONTROLS ────────────────────────────────── */}
      <div className="bg-[#F0EEE8] p-3.5 rounded-2xl border border-black/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-black/40 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search staff by name, role, dept..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs border border-black/10 rounded-xl outline-none bg-white font-medium"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="w-3.5 h-3.5 text-black/40" />
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            className="text-xs font-semibold text-[#111] bg-white border border-black/10 rounded-xl px-3 py-2 outline-none cursor-pointer"
          >
            <option value="All">All Departments</option>
            <option value="ICU Ward">ICU Ward</option>
            <option value="Central Laboratory">Central Laboratory</option>
            <option value="Main Pharmacy">Main Pharmacy</option>
            <option value="Ambulance Fleet">Ambulance Fleet</option>
            <option value="Operation Theatre">Operation Theatre</option>
            <option value="General Ward">General Ward</option>
          </select>
        </div>
      </div>

      {/* ── STAFF TABLE ────────────────────────────────────────────── */}
      <div className="bg-[#F0EEE8] rounded-2xl border border-black/10 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-white/80 border-b border-black/10 text-[10px] font-bold text-black/50 uppercase tracking-wider font-pixel">
                <th className="py-3.5 px-4">Staff ID &amp; Name</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Department</th>
                <th className="py-3.5 px-4">Current Shift</th>
                <th className="py-3.5 px-4">Attendance Status</th>
                <th className="py-3.5 px-4 text-right">Monthly Payroll</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5">
              {filteredStaff.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-black/40 text-xs">
                    No staff members match the selected criteria.
                  </td>
                </tr>
              ) : (
                filteredStaff.map((s) => {
                  const sId = getStaffId(s);
                  const name = getStaffName(s);
                  const role = getStaffRole(s);
                  const dept = getStaffDept(s);
                  const shift = getStaffShift(s);
                  const status = getStaffStatus(s);
                  const salary = getStaffSalary(s);

                  return (
                    <tr key={sId} className="hover:bg-white/60 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[#111]">{name}</div>
                        <div className="text-[10px] font-mono text-black/40">{sId}</div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{role}</td>
                      <td className="py-3.5 px-4 text-slate-600">{dept}</td>
                      <td className="py-3.5 px-4 font-mono text-black/60">{shift}</td>
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => toggleAttendance(sId)}
                          className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase cursor-pointer hover:opacity-80 transition-opacity border ${
                            status === "Present"
                              ? "bg-emerald-100/90 text-emerald-900 border-emerald-300"
                              : "bg-amber-100/90 text-amber-900 border-amber-300"
                          }`}
                        >
                          {status} (Toggle)
                        </button>
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold font-mono text-[#111]">
                        ₹{salary.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Onboard Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#F0EEE8] rounded-3xl border border-black/10 shadow-2xl w-full max-w-lg p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <h3 className="text-base font-bold text-[#111]">Onboard New Hospital Staff Member</h3>
              <button onClick={() => setShowAddModal(false)} className="text-black/40 hover:text-black font-bold text-sm">
                ✕
              </button>
            </div>

            <form onSubmit={handleOnboardStaff} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-black/70 mb-1">Full Name</label>
                  <input
                    required
                    name="name"
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full p-2.5 border border-black/10 rounded-xl outline-none bg-white font-semibold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-black/70 mb-1">Role / Job Title</label>
                  <select name="role" className="w-full p-2.5 border border-black/10 rounded-xl outline-none bg-white font-semibold">
                    <option value="Nurse">Staff Nurse</option>
                    <option value="Lab Technician">Lab Technician</option>
                    <option value="Pharmacist">Pharmacist</option>
                    <option value="Housekeeper">Housekeeper / Sanitation</option>
                    <option value="Driver">Ambulance Driver</option>
                    <option value="Receptionist">Receptionist / Front Desk</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-black/70 mb-1">Assigned Department</label>
                  <select name="dept" className="w-full p-2.5 border border-black/10 rounded-xl outline-none bg-white font-semibold">
                    <option value="ICU Ward">ICU Ward</option>
                    <option value="Central Laboratory">Central Laboratory</option>
                    <option value="Main Pharmacy">Main Pharmacy</option>
                    <option value="Ambulance Fleet">Ambulance Fleet</option>
                    <option value="Operation Theatre">Operation Theatre</option>
                    <option value="General Ward">General Ward</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-black/70 mb-1">Shift Timing</label>
                  <select name="shift" className="w-full p-2.5 border border-black/10 rounded-xl outline-none bg-white font-semibold">
                    <option value="Morning (7AM-3PM)">Morning (7AM-3PM)</option>
                    <option value="Evening (3PM-11PM)">Evening (3PM-11PM)</option>
                    <option value="Night (11PM-7AM)">Night (11PM-7AM)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-black/70 mb-1">Monthly Salary (INR)</label>
                <input
                  type="number"
                  name="salary"
                  defaultValue={5500}
                  className="w-full p-2.5 border border-black/10 rounded-xl outline-none bg-white font-mono font-bold"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-black/10">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-black/5 rounded-xl font-semibold text-black/70"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#111] hover:bg-[#333] text-white font-bold rounded-xl shadow-md"
                >
                  Onboard &amp; Issue Badge
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
