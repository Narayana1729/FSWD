// ============================================================================
// Enterprise Hospital Management System (HMS) — Centralized Data & State Model
// ============================================================================

export type PatientStatus = "Admitted" | "OPD Queue" | "Emergency" | "Discharged" | "Scheduled";
export type EmergencySeverity = "RED" | "YELLOW" | "GREEN";
export type BedStatus = "Available" | "Occupied" | "Reserved" | "Cleaning" | "Maintenance";
export type BedWard = "General" | "Semi-Private" | "Deluxe" | "ICU";
export type DoctorAvailability = "Available" | "In Consultation" | "In Surgery" | "On Break" | "Off Duty";
export type LabSampleStatus = "Requested" | "Collected" | "Lab Processing" | "Result Ready" | "Verified";
export type EquipmentStatus = "Operational" | "Scheduled" | "In Use" | "Due Maintenance" | "Breakdown";
export type SurgeryStatus = "Scheduled" | "Pre-Op Check" | "In Progress" | "Post-Op Recovery" | "Completed";

export const LAB_TEST_CATALOG: Record<string, { code: string; name: string; category: string; sampleType: string; price: number; referenceRange: string; unit: string }> = {
  "CBC": { code: "LAB-CBC", name: "Complete Blood Count (CBC)", category: "Hematology", sampleType: "Blood", price: 280, referenceRange: "4.5 - 11.0", unit: "10^3/uL" },
  "LIPID": { code: "LAB-LIPID", name: "Lipid Profile Panel", category: "Biochemistry", sampleType: "Blood", price: 220, referenceRange: "< 200", unit: "mg/dL" },
  "LFT": { code: "LAB-LFT", name: "Liver Function Test (LFT)", category: "Biochemistry", sampleType: "Blood", price: 450, referenceRange: "7 - 56", unit: "U/L" },
  "KFT": { code: "LAB-KFT", name: "Kidney Function Test (KFT)", category: "Renal", sampleType: "Blood", price: 380, referenceRange: "0.7 - 1.3", unit: "mg/dL" },
  "URINE": { code: "LAB-URINE", name: "Routine Urine Analysis", category: "Microbiology", sampleType: "Urine", price: 150, referenceRange: "Normal", unit: "" },
  "THYROID": { code: "LAB-TSH", name: "Thyroid Profile (T3, T4, TSH)", category: "Endocrinology", sampleType: "Blood", price: 550, referenceRange: "0.4 - 4.0", unit: "mIU/L" },
};

export const RADIOLOGY_TEST_CATALOG: Record<string, { code: string; name: string; modality: string; price: number; bodyPart: string }> = {
  "X-Ray": { code: "RAD-XRAY", name: "Chest Digital Radiography (X-Ray)", modality: "X-Ray", price: 650, bodyPart: "Chest" },
  "CT Scan": { code: "RAD-CT", name: "CT Coronary Angiography Scan", modality: "CT Scan", price: 3500, bodyPart: "Cardiovascular" },
  "MRI": { code: "RAD-MRI", name: "Brain & Lumbar Spine MRI", modality: "MRI", price: 6500, bodyPart: "Brain / Spine" },
  "Ultrasound": { code: "RAD-USG", name: "Abdominal & Pelvic Ultrasound", modality: "Ultrasound", price: 1200, bodyPart: "Abdomen" },
};

export const WARD_RATES_CATALOG: Record<string, { code: string; name: string; ratePerDay: number }> = {
  "General": { code: "WARD-GEN", name: "General Ward Bed", ratePerDay: 500 },
  "Semi-Private": { code: "WARD-SEMI", name: "Semi-Private Room", ratePerDay: 1200 },
  "Deluxe": { code: "WARD-DLX", name: "Deluxe Executive Suite", ratePerDay: 2500 },
  "ICU": { code: "WARD-ICU", name: "ICU Resuscitation Bed", ratePerDay: 5000 },
};

export const EMERGENCY_RATES_CATALOG: Record<string, { code: string; name: string; rate: number }> = {
  "RED": { code: "EMG-RED", name: "Emergency Resuscitation & RED Triage Fee", rate: 2500 },
  "YELLOW": { code: "EMG-YEL", name: "Emergency Urgent Care & YELLOW Triage Fee", rate: 1500 },
  "GREEN": { code: "EMG-GRN", name: "Emergency Non-Urgent Triage Fee", rate: 800 },
};

export interface Patient {
  id: string;
  mrn?: string;
  name: string;
  age: number;
  gender: "Male" | "Female" | "Other";
  phone: string;
  email: string;
  address: string;
  bloodGroup: string;
  emergencyContact: { name: string; relation: string; phone: string };
  medicalHistory: string[];
  allergies: string[];
  currentConditions: string[];
  insurance: { provider: string; policyNo: string; coverageLimit: number; coPayPct: number };
  department: string;
  doctor: string;
  status: PatientStatus;
  lastVisit: string;
  admissionDate?: string;
  bedNo?: string;
  ward?: BedWard;
}

export interface Doctor {
  id: string;
  name: string;
  avatar: string;
  specialization: string;
  department: string;
  experienceYears: number;
  phone: string;
  email: string;
  availability: DoctorAvailability;
  todayAppointmentsCount: number;
  currentPatientsCount: number;
  shift: string;
  roomNo: string;
}

export interface OPDToken {
  tokenNo: number;
  patientId: string;
  patientName: string;
  age: number;
  gender: string;
  doctorName: string;
  department: string;
  appointmentTime: string;
  status: "Serving" | "Waiting" | "Completed" | "Delayed" | "Cancelled";
  avgWaitMins: number;
}

export interface BedItem {
  bedNo: string;
  ward: BedWard;
  status: BedStatus;
  patientId?: string;
  patientName?: string;
  admittedDate?: string;
  attendingDoctor?: string;
  nurseAssigned?: string;
  cleaningStaff?: string;
  maintenanceNotes?: string;
  dailyRate: number;
}

export interface EmergencyCase {
  id: string;
  caseId?: string;
  patientName: string;
  age: number;
  gender: string;
  arrivalTime: string;
  severity: EmergencySeverity;
  chiefComplaint: string;
  assignedDoctor: string;
  traumaBay: string;
  bedNo: string;
  vitals: { bp: string; pulse: number; temp: string; spo2: number };
  status: "Triaged" | "Under Care" | "ICU Transfer" | "Discharged" | "Referred" | "Admitted" | string;
}

export interface PharmacyItem {
  id: string;
  name: string;
  category: string;
  batchNo: string;
  stockQty: number;
  reorderLevel: number;
  supplier: string;
  expiryDate: string; // YYYY-MM-DD
  unitPrice: number;
  prescriptionRequired: boolean;
}

export interface LabOrder {
  id: string;
  patientId: string;
  patientName: string;
  testName: string;
  category: string;
  doctorName: string;
  orderedTime: string;
  sampleType: string;
  status: LabSampleStatus;
  result?: string;
  unit?: string;
  referenceRange?: string;
  isAbnormal?: boolean;
  technician?: string;
  verifyingDoctor?: string;
}

export interface RadiologyScan {
  id: string;
  patientId: string;
  patientName: string;
  scanType: "X-Ray" | "CT Scan" | "MRI" | "Ultrasound" | "X-RAY" | "CT" | "ULTRASOUND" | string;
  bodyPart: string;
  urgency?: "Routine" | "Urgent" | "Stat Emergency" | string;
  technician?: string;
  radiologist: string;
  status: "Scheduled" | "Scanning" | "Report Writing" | "Completed" | string;
  reportText?: string;
  dcmImage: string;
  scanDate: string;
  patient?: any;
}

export interface OperationSurgery {
  id: string;
  patientId: string;
  patientName: string;
  procedure: string;
  otRoom: "OT-1" | "OT-2" | "OT-3" | "OT-4" | string;
  leadSurgeon: string;
  anesthetist: string;
  scrubNurse: string;
  startTime: string;
  endTime: string;
  status: SurgeryStatus;
  preOpChecklist: {
    identityVerified: boolean;
    consentSigned: boolean;
    bloodAvailable: boolean;
    anesthesiaCleared: boolean;
    equipmentReady: boolean;
    surgicalSiteMarked: boolean;
  };
}

export interface BloodBankStock {
  id?: string;
  group: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
  unitsAvailable: number;
  minAlertThreshold: number;
  compatibleDonors: string[];
  compatibleRecipients: string[];
  expiringIn30Days: number;
}


export interface MedicalEquipmentItem {
  id: string;
  name: string;
  type?: string;
  serialNo?: string;
  location: string;
  department?: string;
  status: EquipmentStatus;
  lastCalibrated: string;
  nextCalibration: string;
  breakdownReportsCount?: number;
}

export interface StaffMember {
  id: string;
  name: string;
  role: string;
  dept?: string;
  department?: string;
  shift?: string;
  status?: string;
  attendanceStatus?: string;
  phone?: string;
  salary?: number;
  salaryMonthly?: number;
}

export interface InventoryConsumable {
  id: string;
  itemName: string;
  category: "PPE" | "Surgical Tools" | "IV & Syringes" | "Sanitization" | "Lab Supplies" | "General Consumable" | string;
  stockQty: number;
  unit: string;
  minLevel: number;
  supplier: string;
  unitCost: number;
}


export interface AmbulanceItem {
  id: string;
  vehicleNo: string;
  driverName: string;
  driverPhone: string;
  location: string;
  availability: "Available" | "On Dispatch" | "Maintenance";
  fuelLevelPct: number;
  equipmentType: "Basic Life Support (BLS)" | "Advanced Life Support (ALS)" | "Cardiac Unit";
  currentTrip?: { patientName: string; pickupAddress: string; destination: string; etaMins: number };
}

export interface BillingInvoice {
  id: string;
  patientId: string;
  patientName: string;
  billDate: string;
  items: { description: string; category: string; amount: number }[];
  subtotal: number;
  insuranceCovered: number;
  coPayAmount: number;
  discount?: number;
  tax?: number;
  finalAmount: number;
  paymentStatus: "Paid" | "Pending Insurance" | "Partially Paid" | "Outstanding" | "Pending";
  payments?: {
    id: string;
    amount: number;
    method: string;
    reference?: string | null;
    paidAt: string;
  }[];
}

export interface EMRTimelineEvent {
  id: string;
  patientId: string;
  timestamp: string;
  type: "Visit" | "Diagnosis" | "Prescription" | "Lab Report" | "Imaging" | "Procedure" | "Admission" | "Discharge" | "Emergency" | string;
  title: string;
  doctorName: string;
  department: string;
  summary: string;
  details: Record<string, any>;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  user: string;
  userName?: string;
  role: string;
  action: string;
  resource: string;
  ip: string;
  status: "Success" | "Denied" | "Flagged";
}

// ============================================================================
// INITIAL MOCK DATASTORE — Dronagiri (Gandhamadana)
// ============================================================================

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: "HMS34872",
    name: "Srimannarayana",
    age: 18,
    gender: "Male",
    phone: "+91 98480 34872",
    email: "srimannarayana@dronagiri.health",
    address: "Gandhamadana Pavilion, Suite 404",
    bloodGroup: "O+",
    emergencyContact: { name: "Narayana Family", relation: "Family", phone: "+91 98480 34873" },
    medicalHistory: ["Athletic Fitness Optimization (2025)", "Comprehensive Biomarker Screening"],
    allergies: ["None Reported"],
    currentConditions: ["Annual Health Review", "Holistic Vitals Monitoring"],
    insurance: { provider: "Dronagiri Apex Health", policyNo: "DRN-34872-PREM", coverageLimit: 100000, coPayPct: 0 },
    department: "Integrative Medicine",
    doctor: "Dr. Dhanvantari",
    status: "OPD Queue",
    lastVisit: "2026-08-15",
  },
  {
    id: "P-1001",
    name: "Sundar",
    age: 32,
    gender: "Male",
    phone: "+91 98490 23489",
    email: "sundar@dronagiri.health",
    address: "742 Ashwini Vihar, Gandhamadana",
    bloodGroup: "O+",
    emergencyContact: { name: "Lakshmi Sundar", relation: "Spouse", phone: "+91 98490 23490" },
    medicalHistory: ["Mild Hypertension (2023)", "Preventive Wellness Program"],
    allergies: ["Penicillin"],
    currentConditions: ["Post-Exertion Monitoring", "Cardiovascular Care"],
    insurance: { provider: "Ayush Care Plus", policyNo: "AYU-892104-X", coverageLimit: 75000, coPayPct: 10 },
    department: "Cardiology",
    doctor: "Dr. Dhanvantari",
    status: "Admitted",
    lastVisit: "2026-08-14",
    admissionDate: "2026-08-14 09:30 AM",
    bedNo: "ICU-02",
    ward: "ICU",
  },
  {
    id: "P-1002",
    name: "Bhuvan",
    age: 24,
    gender: "Male",
    phone: "+91 98760 12345",
    email: "bhuvan@dronagiri.health",
    address: "1200 Sushruta Enclave, Dronagiri",
    bloodGroup: "B+",
    emergencyContact: { name: "Bhavan", relation: "Twin Brother", phone: "+91 98760 12346" },
    medicalHistory: ["Sports Ligament Reconstruction (2024)", "Rapid Rehab Recovery"],
    allergies: ["Sulfa Drugs"],
    currentConditions: ["Post-Operative Arthroscopy Recovery"],
    insurance: { provider: "Sanjeevani Health Shield", policyNo: "SNJ-77192-M", coverageLimit: 100000, coPayPct: 5 },
    department: "Surgical Sciences",
    doctor: "Dr. Sushruta",
    status: "Admitted",
    lastVisit: "2026-08-13",
    admissionDate: "2026-08-13 02:15 PM",
    bedNo: "DLX-104",
    ward: "Deluxe",
  },
  {
    id: "P-1003",
    name: "Upagna",
    age: 26,
    gender: "Female",
    phone: "+91 94320 90810",
    email: "upagna@dronagiri.health",
    address: "88 Charaka Heights, Gandhamadana",
    bloodGroup: "B+",
    emergencyContact: { name: "Satvik", relation: "Brother", phone: "+91 94320 90811" },
    medicalHistory: ["Neurological Stress Management", "Pulse Balance Protocols"],
    allergies: ["Latex"],
    currentConditions: ["Neuro-Vascular Assessment", "Migraine Prophylaxis"],
    insurance: { provider: "Global Universal AyurMed", policyNo: "GUM-994102", coverageLimit: 50000, coPayPct: 15 },
    department: "Neurology & Diagnostics",
    doctor: "Dr. Jivaka",
    status: "OPD Queue",
    lastVisit: "2026-08-15",
  },
  {
    id: "P-1004",
    name: "Koushik",
    age: 29,
    gender: "Male",
    phone: "+91 99010 45670",
    email: "koushik@dronagiri.health",
    address: "45 Nagarjuna Road, Dronagiri",
    bloodGroup: "AB+",
    emergencyContact: { name: "Satwik", relation: "Brother", phone: "+91 99010 45671" },
    medicalHistory: ["Coronary Care History (2024)"],
    allergies: ["Iodine Contrast"],
    currentConditions: ["Trauma Stabilization & Cardiac Care"],
    insurance: { provider: "Apex Corporate Healthcare", policyNo: "ACH-440219", coverageLimit: 120000, coPayPct: 0 },
    department: "Emergency & Critical Care",
    doctor: "Dr. Ashwini Kumaras",
    status: "Admitted",
    lastVisit: "2026-08-15",
    admissionDate: "2026-08-12 10:15 AM",
    bedNo: "ICU-01",
    ward: "ICU",
  },
  {
    id: "P-1005",
    name: "Nikhitha",
    age: 28,
    gender: "Female",
    phone: "+91 96780 34560",
    email: "nikhitha@dronagiri.health",
    address: "502 Kashyapa Lane, Gandhamadana",
    bloodGroup: "O-",
    emergencyContact: { name: "Bangaram", relation: "Mother", phone: "+91 96780 34561" },
    medicalHistory: ["Prenatal Care 32 Weeks"],
    allergies: ["None"],
    currentConditions: ["Maternal & Fetal Health Assessment"],
    insurance: { provider: "Matru Raksha Insurance", policyNo: "MRI-110293", coverageLimit: 60000, coPayPct: 10 },
    department: "Pediatrics & Obstetrics",
    doctor: "Dr. Kashyapa",
    status: "OPD Queue",
    lastVisit: "2026-08-15",
  },
  {
    id: "P-1006",
    name: "Tejas",
    age: 35,
    gender: "Male",
    phone: "+91 98110 56780",
    email: "tejas@dronagiri.health",
    address: "104 Vedic Boulevard, Dronagiri",
    bloodGroup: "A+",
    emergencyContact: { name: "Axitha", relation: "Sister", phone: "+91 98110 56781" },
    medicalHistory: ["Metabolic & Digestive Assessment"],
    allergies: ["Pollen"],
    currentConditions: ["Routine Health Screening", "Physiology Diagnostics"],
    insurance: { provider: "Charaka Health Shield", policyNo: "CHS-99210-A", coverageLimit: 80000, coPayPct: 10 },
    department: "Internal Medicine & Pathology",
    doctor: "Dr. Charaka",
    status: "OPD Queue",
    lastVisit: "2026-08-15",
  },
  {
    id: "P-1007",
    name: "Subramhanyam",
    age: 52,
    gender: "Male",
    phone: "+91 98450 78901",
    email: "subramhanyam@dronagiri.health",
    address: "301 Sanjeevani Hill View, Gandhamadana",
    bloodGroup: "A-",
    emergencyContact: { name: "Vamshi", relation: "Brother", phone: "+91 98450 78902" },
    medicalHistory: ["Hypertension Management", "Therapeutic Rejuvenation"],
    allergies: ["Aspirin"],
    currentConditions: ["Formulation Monitoring & Inpatient Care"],
    insurance: { provider: "Nagarjuna AyurRaksha", policyNo: "NAR-44120-S", coverageLimit: 90000, coPayPct: 5 },
    department: "Pharmacology & Therapeutics",
    doctor: "Dr. Nagarjuna",
    status: "Admitted",
    lastVisit: "2026-08-14",
    admissionDate: "2026-08-14 11:30 AM",
    bedNo: "SEM-201",
    ward: "Semi-Private",
  },
  {
    id: "P-1008",
    name: "Vishal",
    age: 30,
    gender: "Male",
    phone: "+91 97120 34512",
    email: "vishal@dronagiri.health",
    address: "220 Sushruta Surgical Way, Dronagiri",
    bloodGroup: "O+",
    emergencyContact: { name: "Prawal", relation: "Brother", phone: "+91 97120 34513" },
    medicalHistory: ["Orthopedic Knee Evaluation"],
    allergies: ["None"],
    currentConditions: ["Pre-Op Surgical Planning"],
    insurance: { provider: "Sushruta Surgical Shield", policyNo: "SSS-55012-V", coverageLimit: 110000, coPayPct: 10 },
    department: "Surgical Sciences",
    doctor: "Dr. Sushruta",
    status: "OPD Queue",
    lastVisit: "2026-08-15",
  },
  {
    id: "P-1009",
    name: "Shashank",
    age: 27,
    gender: "Male",
    phone: "+91 99230 45678",
    email: "shashank@dronagiri.health",
    address: "610 Dhanvantari Enclave, Gandhamadana",
    bloodGroup: "B-",
    emergencyContact: { name: "Greeshma", relation: "Girlfriend", phone: "+91 99230 45679" },
    medicalHistory: ["Ankle Sprain Recovery", "Cardiovascular Screening"],
    allergies: ["Dust Mites"],
    currentConditions: ["Post-Triage Follow-up"],
    insurance: { provider: "Ayush Care Plus", policyNo: "AYU-10293-S", coverageLimit: 50000, coPayPct: 10 },
    department: "Cardiology",
    doctor: "Dr. Dhanvantari",
    status: "Discharged",
    lastVisit: "2026-08-15",
  },
  {
    id: "P-1010",
    name: "Ganesh",
    age: 45,
    gender: "Male",
    phone: "+91 98340 56712",
    email: "ganesh@dronagiri.health",
    address: "18 Garuda Path, Dronagiri",
    bloodGroup: "AB-",
    emergencyContact: { name: "Parvati Ganesh", relation: "Spouse", phone: "+91 98340 56713" },
    medicalHistory: ["General Wellness", "Metabolic Review"],
    allergies: ["None Reported"],
    currentConditions: ["Inpatient General Care"],
    insurance: { provider: "Dronagiri Apex Health", policyNo: "DRN-88120-G", coverageLimit: 60000, coPayPct: 15 },
    department: "Internal Medicine & Pathology",
    doctor: "Dr. Charaka",
    status: "Admitted",
    lastVisit: "2026-08-11",
    admissionDate: "2026-08-11 08:00 AM",
    bedNo: "GEN-301",
    ward: "General",
  },
];

export const INITIAL_DOCTORS: Doctor[] = [
  {
    id: "DOC-101",
    name: "Dr. Dhanvantari",
    avatar: "/images/doctors/dr-dhanvantari.jpg",
    specialization: "Chief Medical Officer & Divine Healer (Integrative Medicine)",
    department: "Integrative Medicine & Cardiology",
    experienceYears: 32,
    phone: "+91 98480 00101",
    email: "dhanvantari@dronagiri.health",
    availability: "In Consultation",
    todayAppointmentsCount: 18,
    currentPatientsCount: 8,
    shift: "Morning (08:00 AM - 04:00 PM)",
    roomNo: "Apex Dhanvantari Suite 101",
  },
  {
    id: "DOC-102",
    name: "Dr. Ashwini Kumaras",
    avatar: "/images/doctors/dr-ashwini-kumaras.png",
    specialization: "Chiefs of Clinical Operations & Dual Regenerative Medicine",
    department: "Emergency & Critical Care",
    experienceYears: 28,
    phone: "+91 98480 00102",
    email: "ashwini.kumaras@dronagiri.health",
    availability: "Available",
    todayAppointmentsCount: 24,
    currentPatientsCount: 10,
    shift: "24/7 Clinical Command",
    roomNo: "Ashwini Complex Suite 102",
  },
  {
    id: "DOC-103",
    name: "Dr. Sushruta",
    avatar: "/images/doctors/dr-sushruta.jpg",
    specialization: "Father of Surgery & Master of Reconstructive Sciences",
    department: "Surgical Sciences & Orthopedics",
    experienceYears: 30,
    phone: "+91 98480 00103",
    email: "sushruta@dronagiri.health",
    availability: "In Surgery",
    todayAppointmentsCount: 12,
    currentPatientsCount: 6,
    shift: "Surgical Rotation (07:00 AM - 03:00 PM)",
    roomNo: "Sushruta OT Theatre 1",
  },
  {
    id: "DOC-104",
    name: "Dr. Charaka",
    avatar: "/images/doctors/dr-charaka.png",
    specialization: "Master of Internal Medicine, Diagnostics & Physiology",
    department: "Internal Medicine & Pathology",
    experienceYears: 29,
    phone: "+91 98480 00104",
    email: "charaka@dronagiri.health",
    availability: "Available",
    todayAppointmentsCount: 16,
    currentPatientsCount: 7,
    shift: "Morning (08:00 AM - 04:00 PM)",
    roomNo: "Charaka Diagnostics Suite 201",
  },
  {
    id: "DOC-105",
    name: "Dr. Jivaka",
    avatar: "/images/doctors/dr-jivaka.png",
    specialization: "Head of Neuro-Surgery, Pulse Diagnostics & Royal Physician",
    department: "Neurology & Diagnostics",
    experienceYears: 24,
    phone: "+91 98480 00105",
    email: "jivaka@dronagiri.health",
    availability: "In Consultation",
    todayAppointmentsCount: 14,
    currentPatientsCount: 5,
    shift: "Full Day (09:00 AM - 05:00 PM)",
    roomNo: "Jivaka Pavilion Suite 301",
  },
  {
    id: "DOC-106",
    name: "Dr. Nagarjuna",
    avatar: "/images/doctors/dr-nagarjuna.png",
    specialization: "Chief Pharmacologist, Metallurgist & Critical Therapeutics",
    department: "Pharmacology & Emergency Critical Care",
    experienceYears: 26,
    phone: "+91 98480 00106",
    email: "nagarjuna@dronagiri.health",
    availability: "Available",
    todayAppointmentsCount: 20,
    currentPatientsCount: 8,
    shift: "Clinical & Lab Command (08:00 AM - 04:00 PM)",
    roomNo: "Nagarjuna Therapeutics Lab 401",
  },
  {
    id: "DOC-107",
    name: "Dr. Kashyapa",
    avatar: "/images/doctors/dr-kashyapa.png",
    specialization: "Master of Pediatrics, Obstetrics & Child Rejuvenation",
    department: "Pediatrics & Obstetrics",
    experienceYears: 22,
    phone: "+91 98480 00107",
    email: "kashyapa@dronagiri.health",
    availability: "Available",
    todayAppointmentsCount: 15,
    currentPatientsCount: 6,
    shift: "Maternal Care Rotation",
    roomNo: "Kashyapa Maternity Suite 501",
  },
];

export const INITIAL_OPD_TOKENS: OPDToken[] = [
  { tokenNo: 101, patientId: "HMS34872", patientName: "Srimannarayana", age: 18, gender: "Male", doctorName: "Dr. Dhanvantari", department: "Integrative Medicine", appointmentTime: "10:00 AM", status: "Serving", avgWaitMins: 0 },
  { tokenNo: 102, patientId: "P-1001", patientName: "Sundar", age: 32, gender: "Male", doctorName: "Dr. Dhanvantari", department: "Cardiology", appointmentTime: "10:15 AM", status: "Waiting", avgWaitMins: 12 },
  { tokenNo: 103, patientId: "P-1002", patientName: "Bhuvan", age: 24, gender: "Male", doctorName: "Dr. Sushruta", department: "Surgical Sciences", appointmentTime: "10:30 AM", status: "Waiting", avgWaitMins: 18 },
  { tokenNo: 104, patientId: "P-1003", patientName: "Upagna", age: 26, gender: "Female", doctorName: "Dr. Jivaka", department: "Neurology & Diagnostics", appointmentTime: "10:45 AM", status: "Waiting", avgWaitMins: 25 },
  { tokenNo: 105, patientId: "P-1005", patientName: "Nikhitha", age: 28, gender: "Female", doctorName: "Dr. Kashyapa", department: "Pediatrics & Obstetrics", appointmentTime: "11:00 AM", status: "Waiting", avgWaitMins: 35 },
  { tokenNo: 106, patientId: "P-1006", patientName: "Tejas", age: 35, gender: "Male", doctorName: "Dr. Charaka", department: "Internal Medicine & Pathology", appointmentTime: "11:15 AM", status: "Waiting", avgWaitMins: 40 },
  { tokenNo: 107, patientId: "P-1008", patientName: "Vishal", age: 30, gender: "Male", doctorName: "Dr. Sushruta", department: "Surgical Sciences", appointmentTime: "11:30 AM", status: "Waiting", avgWaitMins: 45 },
];

export const INITIAL_BEDS: BedItem[] = [
  { bedNo: "ICU-01", ward: "ICU", status: "Occupied", patientId: "P-1004", patientName: "Koushik", admittedDate: "2026-08-12", attendingDoctor: "Dr. Ashwini Kumaras", nurseAssigned: "Nurse Ananya Sharma", dailyRate: 1500 },
  { bedNo: "ICU-02", ward: "ICU", status: "Occupied", patientId: "P-1001", patientName: "Sundar", admittedDate: "2026-08-14", attendingDoctor: "Dr. Dhanvantari", nurseAssigned: "Nurse Priya Nair", dailyRate: 1500 },
  { bedNo: "ICU-03", ward: "ICU", status: "Available", dailyRate: 1500 },
  { bedNo: "ICU-04", ward: "ICU", status: "Cleaning", cleaningStaff: "Housekeeper Ramesh K. (Sanitation Crew A)", dailyRate: 1500 },
  { bedNo: "DLX-101", ward: "Deluxe", status: "Available", dailyRate: 650 },
  { bedNo: "DLX-104", ward: "Deluxe", status: "Occupied", patientId: "P-1002", patientName: "Bhuvan", admittedDate: "2026-08-13", attendingDoctor: "Dr. Sushruta", nurseAssigned: "Nurse Sneha Rao", dailyRate: 650 },
  { bedNo: "SEM-201", ward: "Semi-Private", status: "Occupied", patientId: "P-1007", patientName: "Subramhanyam", admittedDate: "2026-08-14", attendingDoctor: "Dr. Nagarjuna", nurseAssigned: "Nurse Rajesh Kumar", dailyRate: 350 },
  { bedNo: "SEM-202", ward: "Semi-Private", status: "Available", dailyRate: 350 },
  { bedNo: "GEN-301", ward: "General", status: "Occupied", patientId: "P-1010", patientName: "Ganesh", admittedDate: "2026-08-11", attendingDoctor: "Dr. Charaka", nurseAssigned: "Nurse Deepa Menon", dailyRate: 150 },
  { bedNo: "GEN-302", ward: "General", status: "Available", dailyRate: 150 },
  { bedNo: "GEN-303", ward: "General", status: "Maintenance", maintenanceNotes: "Bio-Med Calibration & Hydraulics Repair", dailyRate: 150 },
  { bedNo: "GEN-304", ward: "General", status: "Reserved", dailyRate: 150 },
];

export const INITIAL_EMERGENCY_CASES: EmergencyCase[] = [
  { id: "EMG-901", patientName: "Koushik", age: 29, gender: "Male", arrivalTime: "10:12 AM", severity: "RED", chiefComplaint: "Acute Cardiac Discomfort + Hypotension", assignedDoctor: "Dr. Ashwini Kumaras", traumaBay: "Bay-1 (Ashwini Resuscitation)", bedNo: "ER-01", vitals: { bp: "90/60", pulse: 118, temp: "98.6 F", spo2: 94 }, status: "Under Care" },
  { id: "EMG-902", patientName: "Upagna", age: 26, gender: "Female", arrivalTime: "10:28 AM", severity: "YELLOW", chiefComplaint: "Laceration forearm, controlled bleeding", assignedDoctor: "Dr. Sushruta", traumaBay: "Bay-3", bedNo: "ER-04", vitals: { bp: "120/80", pulse: 82, temp: "98.4 F", spo2: 99 }, status: "Triaged" },
  { id: "EMG-903", patientName: "Shashank", age: 27, gender: "Male", arrivalTime: "09:45 AM", severity: "GREEN", chiefComplaint: "Sprained ankle from sports exertion", assignedDoctor: "Dr. Sushruta", traumaBay: "Triage Desk 2", bedNo: "ER-07", vitals: { bp: "128/84", pulse: 74, temp: "98.6 F", spo2: 98 }, status: "Discharged" },
];

export const INITIAL_PHARMACY_ITEMS: PharmacyItem[] = [
  { id: "RX-01", name: "Amoxicillin 500mg", category: "Antibiotics", batchNo: "BAT-88210", stockQty: 1420, reorderLevel: 200, supplier: "Dronagiri Pharma", expiryDate: "2027-04-30", unitPrice: 12.5, prescriptionRequired: true },
  { id: "RX-02", name: "Atorvastatin 20mg", category: "Cardiovascular", batchNo: "BAT-99312", stockQty: 88, reorderLevel: 100, supplier: "Sanjeevani Labs", expiryDate: "2026-09-15", unitPrice: 28.0, prescriptionRequired: true },
  { id: "RX-03", name: "Paracetamol 650mg", category: "Analgesics", batchNo: "BAT-11029", stockQty: 4500, reorderLevel: 500, supplier: "Cipla Health", expiryDate: "2028-01-10", unitPrice: 2.0, prescriptionRequired: false },
  { id: "RX-04", name: "Insulin Glargine 100U", category: "Diabetes", batchNo: "BAT-33410", stockQty: 45, reorderLevel: 50, supplier: "Biocon Global", expiryDate: "2026-09-01", unitPrice: 85.0, prescriptionRequired: true },
];

export const INITIAL_LAB_ORDERS: LabOrder[] = [
  { id: "LAB-401", patientId: "P-1001", patientName: "Sundar", testName: "Complete Blood Count (CBC)", category: "Hematology", doctorName: "Dr. Dhanvantari", orderedTime: "09:45 AM", sampleType: "Venous Blood", status: "Verified", result: "WBC: 12.4 x10^3/uL (Normal)", unit: "x10^3/uL", referenceRange: "4.5 - 11.0", isAbnormal: false, technician: "Tech Alok Verma", verifyingDoctor: "Dr. Dhanvantari" },
  { id: "LAB-402", patientId: "P-1002", patientName: "Bhuvan", testName: "Liver & Muscle Enzyme Panel", category: "Biochemistry", doctorName: "Dr. Sushruta", orderedTime: "10:15 AM", sampleType: "Serum", status: "Lab Processing", technician: "Tech Maya Sen" },
  { id: "LAB-403", patientId: "P-1003", patientName: "Upagna", testName: "Serum Electrolytes & Neuro Panel", category: "Nephrology", doctorName: "Dr. Jivaka", orderedTime: "10:35 AM", sampleType: "Blood", status: "Collected" },
  { id: "LAB-404", patientId: "P-1006", patientName: "Tejas", testName: "Metabolic Lipid Profile", category: "Biochemistry", doctorName: "Dr. Charaka", orderedTime: "11:00 AM", sampleType: "Serum", status: "Lab Processing" },
];

export const INITIAL_RADIOLOGY_SCANS: RadiologyScan[] = [
  { id: "RAD-701", patientId: "P-1001", patientName: "Sundar", scanType: "CT Scan", bodyPart: "Chest & Coronary Angiography", urgency: "Urgent", technician: "Rad-Tech Jayant", radiologist: "Dr. Jivaka", status: "Completed", reportText: "No acute aortic dissection observed. Clear coronary circulation.", dcmImage: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80", scanDate: "2026-08-14 11:00 AM" },
  { id: "RAD-702", patientId: "P-1002", patientName: "Bhuvan", scanType: "MRI", bodyPart: "Right Knee Joint (Post-Op)", urgency: "Routine", technician: "Rad-Tech Esha", radiologist: "Dr. Sushruta", status: "Report Writing", dcmImage: "https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=600&auto=format&fit=crop&q=80", scanDate: "2026-08-13 03:30 PM" },
  { id: "RAD-703", patientId: "P-1006", patientName: "Tejas", scanType: "Ultrasound", bodyPart: "Abdominal & Digestive Scan", urgency: "Routine", technician: "Rad-Tech Jayant", radiologist: "Dr. Charaka", status: "Completed", reportText: "Normal hepatic architecture, no biliary obstruction.", dcmImage: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80", scanDate: "2026-08-15 09:15 AM" },
];

export const INITIAL_OPERATIONS: OperationSurgery[] = [
  {
    id: "OT-201",
    patientId: "P-1002",
    patientName: "Bhuvan",
    procedure: "Arthroscopic Ligament Reconstruction (Right Knee)",
    otRoom: "Sushruta OT-1",
    leadSurgeon: "Dr. Sushruta",
    anesthetist: "Dr. Nagarjuna",
    scrubNurse: "Nurse Sneha Rao",
    startTime: "08:00 AM",
    endTime: "11:30 AM",
    status: "Completed",
    preOpChecklist: { identityVerified: true, consentSigned: true, bloodAvailable: true, anesthesiaCleared: true, equipmentReady: true, surgicalSiteMarked: true },
  },
  {
    id: "OT-202",
    patientId: "P-1004",
    patientName: "Koushik",
    procedure: "Cardiac Catheterization & Revascularization",
    otRoom: "Ashwini Hybrid Suite",
    leadSurgeon: "Dr. Ashwini Kumaras",
    anesthetist: "Dr. Dhanvantari",
    scrubNurse: "Nurse Ananya Sharma",
    startTime: "01:00 PM",
    endTime: "04:00 PM",
    status: "Pre-Op Check",
    preOpChecklist: { identityVerified: true, consentSigned: true, bloodAvailable: true, anesthesiaCleared: true, equipmentReady: true, surgicalSiteMarked: true },
  },
  {
    id: "OT-203",
    patientId: "P-1008",
    patientName: "Vishal",
    procedure: "Orthopedic Tendon Repair & Alignment",
    otRoom: "Sushruta OT-1",
    leadSurgeon: "Dr. Sushruta",
    anesthetist: "Dr. Nagarjuna",
    scrubNurse: "Nurse Priya Nair",
    startTime: "04:30 PM",
    endTime: "06:30 PM",
    status: "Scheduled",
    preOpChecklist: { identityVerified: true, consentSigned: true, bloodAvailable: true, anesthesiaCleared: true, equipmentReady: true, surgicalSiteMarked: true },
  },
];

export const INITIAL_BLOOD_BANK: BloodBankStock[] = [
  { group: "A+", unitsAvailable: 28, minAlertThreshold: 10, compatibleDonors: ["A+", "A-", "O+", "O-"], compatibleRecipients: ["A+", "AB+"], expiringIn30Days: 4 },
  { group: "A-", unitsAvailable: 8, minAlertThreshold: 8, compatibleDonors: ["A-", "O-"], compatibleRecipients: ["A+", "A-", "AB+", "AB-"], expiringIn30Days: 2 },
  { group: "B+", unitsAvailable: 34, minAlertThreshold: 12, compatibleDonors: ["B+", "B-", "O+", "O-"], compatibleRecipients: ["B+", "AB+"], expiringIn30Days: 5 },
  { group: "B-", unitsAvailable: 6, minAlertThreshold: 6, compatibleDonors: ["B-", "O-"], compatibleRecipients: ["B+", "B-", "AB+", "AB-"], expiringIn30Days: 1 },
  { group: "AB+", unitsAvailable: 15, minAlertThreshold: 5, compatibleDonors: ["Everyone (Universal Recipient)"], compatibleRecipients: ["AB+"], expiringIn30Days: 3 },
  { group: "AB-", unitsAvailable: 4, minAlertThreshold: 5, compatibleDonors: ["AB-", "A-", "B-", "O-"], compatibleRecipients: ["AB+", "AB-"], expiringIn30Days: 1 },
  { group: "O+", unitsAvailable: 42, minAlertThreshold: 15, compatibleDonors: ["O+", "O-"], compatibleRecipients: ["O+", "A+", "B+", "AB+"], expiringIn30Days: 6 },
  { group: "O-", unitsAvailable: 9, minAlertThreshold: 10, compatibleDonors: ["O-"], compatibleRecipients: ["Everyone (Universal Donor)"], expiringIn30Days: 2 },
];

export const INITIAL_EQUIPMENT: MedicalEquipmentItem[] = [
  { id: "EQ-101", name: "Siemens Somatom 128-Slice CT Scanner", type: "Radiology Imaging", location: "Radiology Room 1", department: "Radiology", status: "Operational", lastCalibrated: "2026-07-10", nextCalibration: "2026-10-10", serialNo: "SN-CT-9901A", breakdownReportsCount: 0 },
  { id: "EQ-102", name: "GE Signa 3.0T MRI Scanner", type: "High Field MRI", location: "Radiology Room 3", department: "Radiology", status: "In Use", lastCalibrated: "2026-06-15", nextCalibration: "2026-09-15", serialNo: "SN-MRI-3000", breakdownReportsCount: 1 },
  { id: "EQ-103", name: "Drager Evita V800 ICU Ventilator", type: "Respiratory Care", location: "ICU Bed-01", department: "Critical Care", status: "In Use", lastCalibrated: "2026-08-01", nextCalibration: "2026-11-01", serialNo: "SN-VENT-8812", breakdownReportsCount: 0 },
  { id: "EQ-104", name: "Philips HeartStart XL Defibrillator", type: "Emergency Resuscitation", location: "Emergency Bay 1", department: "Emergency", status: "Operational", lastCalibrated: "2026-08-05", nextCalibration: "2026-09-05", serialNo: "SN-DEF-1102", breakdownReportsCount: 0 },
];

export const INITIAL_AMBULANCE_FLEET: AmbulanceItem[] = [
  { id: "AMB-01", vehicleNo: "DRN-AMB-01", driverName: "Garuda Dispatch", driverPhone: "+91 98480 00901", location: "Dronagiri Central Gate", availability: "Available", fuelLevelPct: 88, equipmentType: "Advanced Life Support (ALS)" },
  { id: "AMB-02", vehicleNo: "DRN-AMB-02", driverName: "Maruti Rescue", driverPhone: "+91 98480 00902", location: "Gandhamadana Highway North", availability: "On Dispatch", fuelLevelPct: 74, equipmentType: "Basic Life Support (BLS)", currentTrip: { patientName: "Ganesh (Urgent Transfer #891)", pickupAddress: "440 Vedic Enclave", destination: "Dronagiri Trauma Center", etaMins: 6 } },
  { id: "AMB-03", vehicleNo: "DRN-AMB-03", driverName: "Vayu Fleet", driverPhone: "+91 98480 00903", location: "Fleet Bay 3", availability: "Maintenance", fuelLevelPct: 40, equipmentType: "Cardiac Unit" },
];

export const INITIAL_BILLING_INVOICES: BillingInvoice[] = [
  {
    id: "INV-88210",
    patientId: "P-1001",
    patientName: "Sundar",
    billDate: "2026-08-15",
    items: [
      { description: "ICU Bed Charge (2 Days @ ₹1,500/day)", category: "Room", amount: 3000 },
      { description: "Chief Consultation (Dr. Dhanvantari)", category: "Consultation", amount: 450 },
      { description: "CT Coronary Angiography Scan", category: "Imaging", amount: 1200 },
      { description: "CBC & Serum Electrolytes Panel", category: "Laboratory", amount: 280 },
      { description: "IV Medications & Holistic Cardiac Monitoring", category: "Pharmacy", amount: 620 },
    ],
    subtotal: 5550,
    insuranceCovered: 4717.5,
    coPayAmount: 832.5,
    discount: 0,
    tax: 0,
    finalAmount: 832.5,
    paymentStatus: "Pending Insurance",
  },
  {
    id: "INV-88211",
    patientId: "P-1002",
    patientName: "Bhuvan",
    billDate: "2026-08-14",
    items: [
      { description: "Deluxe Room Charge (2 Days @ ₹650/day)", category: "Room", amount: 1300 },
      { description: "Arthroscopic Surgery (Dr. Sushruta)", category: "Surgery", amount: 12500 },
      { description: "Anesthesia Services Fee (Dr. Nagarjuna)", category: "Procedure", amount: 2200 },
      { description: "Post-Op Physical Therapy & Rejuvenation", category: "Consultation", amount: 350 },
    ],
    subtotal: 16350,
    insuranceCovered: 14715,
    coPayAmount: 1635,
    discount: 100,
    tax: 0,
    finalAmount: 1535,
    paymentStatus: "Paid",
  },
  {
    id: "INV-88212",
    patientId: "P-1006",
    patientName: "Tejas",
    billDate: "2026-08-15",
    items: [
      { description: "Charaka Internal Medicine Consultation", category: "Consultation", amount: 350 },
      { description: "Abdominal Ultrasound Imaging", category: "Imaging", amount: 650 },
      { description: "Metabolic Lipid Profile Lab Test", category: "Laboratory", amount: 220 },
    ],
    subtotal: 1220,
    insuranceCovered: 1098,
    coPayAmount: 122,
    discount: 0,
    tax: 0,
    finalAmount: 122,
    paymentStatus: "Paid",
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  { id: "LOG-1001", timestamp: "2026-08-15 11:24:12", user: "Dr. Dhanvantari", role: "Doctor", action: "patient_emr_viewed", resource: "Patient #HMS34872 (Srimannarayana)", ip: "192.168.1.45", status: "Success" },
  { id: "LOG-1002", timestamp: "2026-08-15 11:18:05", user: "Dr. Sushruta", role: "Doctor", action: "surgical_notes_logged", resource: "Surgery #OT-201 (Bhuvan)", ip: "192.168.1.62", status: "Success" },
  { id: "LOG-1003", timestamp: "2026-08-15 11:05:40", user: "Dr. Ashwini Kumaras", role: "Doctor", action: "bed_allocated_icu", resource: "Bed #ICU-02 (Sundar)", ip: "192.168.1.18", status: "Success" },
  { id: "LOG-1004", timestamp: "2026-08-15 10:48:19", user: "Dr. Jivaka", role: "Doctor", action: "lab_result_verified", resource: "Lab Order #LAB-403 (Upagna)", ip: "192.168.1.89", status: "Success" },
  { id: "LOG-1005", timestamp: "2026-08-15 10:15:33", user: "Dr. Nagarjuna", role: "Doctor", action: "therapeutics_dispensed", resource: "Prescription #RX-8812 (Koushik)", ip: "192.168.1.101", status: "Success" },
];

export const INITIAL_INVENTORY: InventoryConsumable[] = [
  { id: "CON-01", itemName: "Disposable Syringes 5ml", category: "IV & Syringes", stockQty: 12500, unit: "Pcs", minLevel: 2000, supplier: "MedTech Supplies Inc", unitCost: 0.25 },
  { id: "CON-02", itemName: "Latex Surgical Gloves (Size M)", category: "PPE", stockQty: 850, unit: "Boxes", minLevel: 1000, supplier: "SafeCare PPE Ltd", unitCost: 14.0 },
  { id: "CON-03", itemName: "N95 Respirator Masks", category: "PPE", stockQty: 3200, unit: "Pcs", minLevel: 500, supplier: "3M Healthcare", unitCost: 1.8 },
  { id: "CON-04", itemName: "IV Infusion Sets 20G", category: "IV & Syringes", stockQty: 480, unit: "Pcs", minLevel: 500, supplier: "Becton Dickinson", unitCost: 2.1 },
  { id: "CON-05", itemName: "Sterile Gauze Bandages 4x4", category: "Surgical Tools", stockQty: 6400, unit: "Pcs", minLevel: 1500, supplier: "MedTech Supplies Inc", unitCost: 0.45 },
];

export const INITIAL_STAFF: StaffMember[] = [
  { id: "STF-101", name: "Nurse Priya Nair", role: "Nurse", dept: "ICU Ward", shift: "Morning (7AM-3PM)", status: "Present", salary: 5800 },
  { id: "STF-102", name: "Tech Alok Verma", role: "Lab Technician", dept: "Central Laboratory", shift: "Morning (7AM-3PM)", status: "Present", salary: 5200 },
  { id: "STF-103", name: "Pharmacist Ananya Rao", role: "Pharmacist", dept: "Main Pharmacy", shift: "Evening (3PM-11PM)", status: "Clocked Out", salary: 6100 },
  { id: "STF-104", name: "Driver Maruti Rescue", role: "Driver", dept: "Ambulance Fleet", shift: "Night (11PM-7AM)", status: "On Leave", salary: 4200 },
];
