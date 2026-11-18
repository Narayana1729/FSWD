"use client";

import React, { useState, useEffect, Suspense } from "react";
import AuthSwitch from "@/components/auth-switch";
import { HMSNavigation, HMSModuleId } from "@/components/hms-navigation";

// Subsystem View Components
import { DashboardView } from "@/components/hms/dashboard";
import { PatientsView } from "@/components/hms/patients";
import { EMRPatient360View } from "@/components/hms/emr-patient360";
import { DoctorsView } from "@/components/hms/doctors";
import { OPDAppointmentsView } from "@/components/hms/opd-appointments";
import { InpatientIPDView } from "@/components/hms/inpatient-ipd";
import { EmergencyView } from "@/components/hms/emergency";
import { PharmacyView } from "@/components/hms/pharmacy";
import { LaboratoryView } from "@/components/hms/laboratory";
import { RadiologyPACSView } from "@/components/hms/radiology-pacs";
import { OperationTheatreView } from "@/components/hms/operation-theatre";
import { BloodBankView } from "@/components/hms/blood-bank";
import { EquipmentView } from "@/components/hms/equipment";
import { InventoryProcurementView } from "@/components/hms/inventory-procurement";
import { StaffHRView } from "@/components/hms/staff-hr";
import { AmbulanceView } from "@/components/hms/ambulance";
import { BillingInsuranceView } from "@/components/hms/billing-insurance";
import { SecurityComplianceView } from "@/components/hms/security-compliance";
import { PatientPortalView } from "@/components/hms/patient-portal";

import { usePersistentState } from "@/hooks/use-persistent-state";
import { useHmsApi } from "@/hooks/use-hms-api";

// Datastore Initial State
import {
  INITIAL_PATIENTS,
  INITIAL_DOCTORS,
  INITIAL_OPD_TOKENS,
  INITIAL_BEDS,
  INITIAL_EMERGENCY_CASES,
  INITIAL_PHARMACY_ITEMS,
  INITIAL_LAB_ORDERS,
  INITIAL_RADIOLOGY_SCANS,
  INITIAL_OPERATIONS,
  INITIAL_BLOOD_BANK,
  INITIAL_EQUIPMENT,
  INITIAL_AMBULANCE_FLEET,
  INITIAL_BILLING_INVOICES,
  INITIAL_AUDIT_LOGS,
  INITIAL_INVENTORY,
  INITIAL_STAFF,
  Patient,
  OPDToken,
  BedItem,
  EmergencyCase,
  PharmacyItem,
  LabOrder,
  BloodBankStock,
  AuditLogEntry,
} from "@/lib/hms-data";


import { useSearchParams } from "next/navigation";

function HMSAppContent() {
  const searchParams = useSearchParams();
  const initialRoleParam = searchParams.get("role");

  // Auth & Session State: Strictly require verified session
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [activeRole, setActiveRole] = useState(initialRoleParam || "Doctor");
  const [loggedInUserName, setLoggedInUserName] = useState("");
  const [activeModule, setActiveModule] = useState<HMSModuleId>(() => {
    if (initialRoleParam === "Doctor") return "opd";
    if (initialRoleParam === "Nurse") return "ipd-beds";
    if (initialRoleParam === "Ambulance Driver") return "ambulance";
    if (initialRoleParam === "Patient") return "overview";
    return "overview";
  });
  const [selectedPatientId, setSelectedPatientId] = useState("P-1001");

  useEffect(() => {
    async function checkAuthSession() {
      try {
        const token = typeof window !== "undefined" ? localStorage.getItem("hms_auth_token") : null;
        const res = await fetch("/api/auth/me", {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: "same-origin",
        });

        if (res.ok) {
          const json = await res.json();
          if (json.user) {
            setIsAuthenticated(true);
            setActiveRole(json.user.role);
            setLoggedInUserName(json.user.name);
          }
        }
      } catch (e) {
        console.warn("Session check failed:", e);
      } finally {
        setIsAuthChecking(false);
      }
    }
    checkAuthSession();
  }, []);

  // Datastore State connected to Prisma REST API (/api/*) & SQLite DB
  const { data: patients, setData: setPatients, createItem: createPatient } = useHmsApi<Patient>("patients", "patients", INITIAL_PATIENTS);
  const { data: doctors, setData: setDoctors } = useHmsApi("doctors", "doctors", INITIAL_DOCTORS);
  const { data: opdTokens, setData: setOpdTokens, createItem: createOpdToken, updateItem: updateOpdToken } = useHmsApi<OPDToken>("appointments", "appointments", INITIAL_OPD_TOKENS);
  const { data: beds, setData: setBeds, updateItem: updateBed } = useHmsApi<BedItem>("beds", "beds", INITIAL_BEDS);
  const { data: emergencyCases, setData: setEmergencyCases, createItem: createEmergencyCase } = useHmsApi<EmergencyCase>("emergency", "cases", INITIAL_EMERGENCY_CASES);
  const { data: pharmacyItems, setData: setPharmacyItems } = useHmsApi<PharmacyItem>("pharmacy", "inventory", INITIAL_PHARMACY_ITEMS);
  const { data: labOrders, setData: setLabOrders } = useHmsApi<LabOrder>("lab-orders", "labOrders", INITIAL_LAB_ORDERS);
  const { data: radiologyScans, setData: setRadiologyScans } = useHmsApi("radiology", "scans", INITIAL_RADIOLOGY_SCANS);
  const { data: operations, setData: setOperations } = useHmsApi("surgeries", "surgeries", INITIAL_OPERATIONS);
  const { data: bloodBankStock, setData: setBloodBankStock } = useHmsApi<BloodBankStock>("blood-bank", "stock", INITIAL_BLOOD_BANK);
  const { data: equipment, setData: setEquipment } = useHmsApi("equipment", "equipment", INITIAL_EQUIPMENT);
  const { data: ambulanceFleet, setData: setAmbulanceFleet } = useHmsApi("ambulances", "ambulances", INITIAL_AMBULANCE_FLEET);
  const { data: invoices, setData: setInvoices } = useHmsApi("billing", "invoices", INITIAL_BILLING_INVOICES);
  const [inventory, setInventory] = usePersistentState("dronagiri_inventory", INITIAL_INVENTORY);
  const { data: staff, setData: setStaff } = useHmsApi("staff", "staff", INITIAL_STAFF);
  const { data: auditLogs } = useHmsApi<AuditLogEntry>("audit-logs", "logs", INITIAL_AUDIT_LOGS);

  // If verifying session, show loader
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-[#F5F4F0] flex items-center justify-center p-6 text-slate-800 font-mono text-xs">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full border-2 border-slate-900 border-t-transparent animate-spin" />
          <span>VERIFYING CLINICAL CREDENTIALS...</span>
        </div>
      </div>
    );
  }

  // If user is not authenticated, render AuthSwitch
  if (!isAuthenticated) {
    return (
      <AuthSwitch
        onLoginSuccess={(role, userName) => {
          setActiveRole(role);
          setLoggedInUserName(userName);
          setIsAuthenticated(true);
        }}
      />
    );
  }


  // Handlers for state updates
  const handleRoleChange = (role: string) => {
    setActiveRole(role);
    if (role === "Doctor") setActiveModule("opd");
    else if (role === "Nurse") setActiveModule("ipd-beds");
    else if (role === "Ambulance Driver") setActiveModule("ambulance");
    else if (role === "Pharmacist") setActiveModule("pharmacy");
    else if (role === "Lab Technician") setActiveModule("laboratory");
    else if (role === "Super Admin" || role === "Hospital Admin") setActiveModule("overview");
  };

  const handleAddPatient = (newP: Patient) => {
    setPatients((prev) => [newP, ...prev.filter((p) => p.id !== newP.id)]);
    createPatient(newP, {
      name: newP.name,
      age: newP.age,
      gender: newP.gender,
      phone: newP.phone || "9876543210",
      email: newP.email || undefined,
      address: newP.address || undefined,
      bloodGroup: newP.bloodGroup || "O+",
      status: newP.status || "OPD Queue",
      department: newP.department || "Cardiology",
      emergencyContact: newP.emergencyContact,
      medicalHistory: newP.medicalHistory,
      allergies: newP.allergies,
      currentConditions: newP.currentConditions,
      insurance: newP.insurance,
    }).catch((err) => console.warn("Failed to persist patient to server:", err));
  };

  const handleAddOPDToken = (t: OPDToken) => {
    createOpdToken(t, {
      patientId: patients[0]?.id || "P-1001",
      doctorId: doctors[0]?.id || "DOC-101",
      appointmentDate: new Date().toISOString(),
      appointmentTime: "10:30 AM",
      type: "Walk-in",
      notes: `OPD Token #${t.tokenNo} - ${t.doctorName}`,
    });
  };

  const handleAddEmergencyCase = (c: EmergencyCase) => {
    setEmergencyCases((prev) => [c, ...prev]);
    createEmergencyCase(c, {
      patientName: c.patientName,
      age: c.age,
      gender: c.gender,
      severity: c.severity,
      chiefComplaint: c.chiefComplaint,
      assignedDoctor: c.assignedDoctor,
      traumaBay: c.traumaBay,
      bedNo: c.bedNo,
      vitals: c.vitals,
    }).catch((err) => console.warn("Failed to persist emergency case to server:", err));
  };

  return (
    <HMSNavigation
      activeModule={activeModule}
      onSelectModule={(mod) => setActiveModule(mod)}
      activeRole={activeRole}
      onLogout={() => {
        setIsAuthenticated(false);
        if (typeof window !== "undefined") {
          window.history.replaceState({}, "", "/hms");
        }
      }}
    >
      {/* Patient Role Direct Portal Switch */}
      {activeRole === "Patient" ? (
        <PatientPortalView
          patient={patients[0]}
          tokens={opdTokens}
          invoices={invoices}
          labOrders={labOrders}
          onBookAppointment={() => setActiveModule("opd")}
          onGenerateToken={handleAddOPDToken}
        />
      ) : (
        <>
          {/* Dynamic Module Rendering */}
      {(activeModule === "overview" || activeModule === "operations") && (
        <DashboardView
          patients={patients}
          doctors={doctors}
          opdTokens={opdTokens}
          beds={beds}
          emergencyCases={emergencyCases}
          labOrders={labOrders}
          invoices={invoices}
          auditLogs={auditLogs}
          onNavigate={(mod) => setActiveModule(mod)}
        />
      )}

      {(activeModule === "patient-directory" || activeModule === "patient-registration") && (
        <PatientsView
          patients={patients}
          onAddPatient={handleAddPatient}
          activeRole={activeRole}
          loggedInUserName={loggedInUserName}
          onSelectPatientEMR={(pId) => {
            setSelectedPatientId(pId);
            setActiveModule("emr-360");
          }}
        />
      )}

      {activeModule === "emr-360" && (
        <EMRPatient360View
          patientId={selectedPatientId}
          patients={patients}
          onSelectPatient={(pId) => setSelectedPatientId(pId)}
        />
      )}

      {activeModule === "doctors" && <DoctorsView doctors={doctors} />}

      {activeModule === "opd" && (
        <OPDAppointmentsView
          patients={patients}
          doctors={doctors}
          opdTokens={opdTokens}
          onAddToken={handleAddOPDToken}
          onUpdateTokens={(tList) => setOpdTokens(tList)}
        />
      )}

      {activeModule === "emergency" && (
        <EmergencyView
          emergencyCases={emergencyCases}
          onAddEmergencyCase={handleAddEmergencyCase}
        />
      )}

      {activeModule === "ipd-beds" && (
        <InpatientIPDView
          beds={beds}
          patients={patients}
          onUpdateBeds={(bList) => setBeds(bList)}
        />
      )}

      {activeModule === "operation-theatre" && (
        <OperationTheatreView
          operations={operations}
          onUpdateOperations={(opList) => setOperations(opList)}
        />
      )}

      {activeModule === "laboratory" && (
        <LaboratoryView
          labOrders={labOrders}
          onUpdateLabOrders={(orders) => setLabOrders(orders)}
        />
      )}

      {activeModule === "radiology-pacs" && (
        <RadiologyPACSView
          scans={radiologyScans}
          onUpdateScans={(scansList) => setRadiologyScans(scansList)}
        />
      )}

      {activeModule === "pharmacy" && (
        <PharmacyView
          pharmacyItems={pharmacyItems}
          onAddPharmacyItem={(item) => setPharmacyItems((prev) => [item, ...prev])}
          onUpdatePharmacyItems={(items) => setPharmacyItems(items)}
        />
      )}

      {activeModule === "blood-bank" && (
        <BloodBankView
          bloodBankStock={bloodBankStock}
          patients={patients}
          onUpdateBloodBank={(stock) => setBloodBankStock(stock)}
        />
      )}

      {activeModule === "equipment" && (
        <EquipmentView
          equipment={equipment}
          onUpdateEquipment={(eq) => setEquipment(eq)}
        />
      )}

      {activeModule === "inventory" && (
        <InventoryProcurementView
          inventory={inventory}
          onUpdateInventory={(inv) => setInventory(inv)}
        />
      )}

      {activeModule === "ambulance" && (
        <AmbulanceView
          fleet={ambulanceFleet}
          onUpdateFleet={(fleet) => setAmbulanceFleet(fleet)}
        />
      )}

      {activeModule === "billing" && (
        <BillingInsuranceView
          invoices={invoices}
          onUpdateInvoices={(invList) => setInvoices(invList)}
          patients={patients}
        />
      )}

      {activeModule === "staff-hr" && (
        <StaffHRView
          staff={staff}
          onUpdateStaff={(stfList) => setStaff(stfList)}
        />
      )}

      {activeModule === "security-compliance" && <SecurityComplianceView auditLogs={auditLogs} />}
        </>
      )}
    </HMSNavigation>
  );
}

export default function HMSAppPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F5F4F0] flex items-center justify-center font-mono text-xs text-black/50">
          Initializing Dronagiri OS...
        </div>
      }
    >
      <HMSAppContent />
    </Suspense>
  );
}

