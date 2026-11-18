import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting Dronagiri (Gandhamadana) Database Seeding with Indian Patient Roster...");

  // Clean existing tables (in order of relations)
  await prisma.auditLog.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.ambulanceTrip.deleteMany();
  await prisma.ambulance.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.bloodUnit.deleteMany();
  await prisma.inventoryConsumable.deleteMany();
  await prisma.prescriptionItem.deleteMany();
  await prisma.prescription.deleteMany();
  await prisma.consultation.deleteMany();
  await prisma.vitals.deleteMany();
  await prisma.labResult.deleteMany();
  await prisma.labOrder.deleteMany();
  await prisma.radiologyReport.deleteMany();
  await prisma.radiologyOrder.deleteMany();
  await prisma.surgery.deleteMany();
  await prisma.operationTheatre.deleteMany();
  await prisma.admission.deleteMany();
  await prisma.bed.deleteMany();
  await prisma.room.deleteMany();
  await prisma.ward.deleteMany();
  await prisma.emergencyCase.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.visit.deleteMany();
  await prisma.medicine.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.staff.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.department.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();

  const defaultPasswordHash = await bcrypt.hash("Password123!", 10);

  // 1. Departments
  const depts = [
    { name: "Integrative Medicine", description: "Holistic Health, Dhanvantari Protocols & Preventive Healing", floor: "Apex Pavilion" },
    { name: "Emergency & Critical Care", description: "24/7 Level-1 Trauma, Rapid Response & Ashwini Resuscitation", floor: "Ground Floor" },
    { name: "Surgical Sciences", description: "Sushruta Advanced Plastic, Reconstructive & Orthopedic OT", floor: "2nd Floor" },
    { name: "Internal Medicine & Pathology", description: "Charaka Diagnostics, Metabolism & Physiology", floor: "3rd Floor" },
    { name: "Neurology & Diagnostics", description: "Jivaka Pulse Analysis & Neuro-Surgery", floor: "4th Floor" },
    { name: "Pharmacology & Therapeutics", description: "Nagarjuna Formulations, Toxicology & Metallurgy", floor: "Basement 1" },
    { name: "Pediatrics & Obstetrics", description: "Kashyapa Maternal & Child Health", floor: "1st Floor" },
    { name: "Cardiology", description: "Heart & Vascular Care", floor: "3rd Floor" },
    { name: "Radiology", description: "Diagnostic Imaging & PACS", floor: "Basement 1" },
  ];

  const createdDepts: Record<string, any> = {};
  for (const d of depts) {
    createdDepts[d.name] = await prisma.department.create({ data: d });
  }

  // 2. Admin User
  await prisma.user.create({
    data: {
      email: "admin@dronagiri.health",
      passwordHash: defaultPasswordHash,
      name: "Dr. Dhanvantari (Chief Medical Officer & Superintendent)",
      role: "ADMIN",
      phone: "+91 98480 00001",
    },
  });

  // 3. Doctors & Doctor Users
  const doctorsData = [
    {
      staffId: "DOC-101",
      name: "Dr. Dhanvantari",
      email: "dhanvantari@dronagiri.health",
      avatar: "/images/doctors/dr-dhanvantari.jpg",
      specialization: "Chief Medical Officer & Divine Healer (Integrative Medicine)",
      department: "Integrative Medicine",
      experienceYears: 32,
      phone: "+91 98480 00101",
      availability: "In Consultation",
      shift: "Morning (08:00 AM - 04:00 PM)",
      roomNo: "Apex Dhanvantari Suite 101",
    },
    {
      staffId: "DOC-102",
      name: "Dr. Ashwini Kumaras",
      email: "ashwini.kumaras@dronagiri.health",
      avatar: "/images/doctors/dr-ashwini-kumaras.png",
      specialization: "Chiefs of Clinical Operations & Dual Regenerative Medicine",
      department: "Emergency & Critical Care",
      experienceYears: 28,
      phone: "+91 98480 00102",
      availability: "Available",
      shift: "24/7 Clinical Command",
      roomNo: "Ashwini Complex Suite 102",
    },
    {
      staffId: "DOC-103",
      name: "Dr. Sushruta",
      email: "sushruta@dronagiri.health",
      avatar: "/images/doctors/dr-sushruta.jpg",
      specialization: "Father of Surgery & Master of Reconstructive Sciences",
      department: "Surgical Sciences",
      experienceYears: 30,
      phone: "+91 98480 00103",
      availability: "In Surgery",
      shift: "Surgical Rotation (07:00 AM - 03:00 PM)",
      roomNo: "Sushruta OT Theatre 1",
    },
    {
      staffId: "DOC-104",
      name: "Dr. Charaka",
      email: "charaka@dronagiri.health",
      avatar: "/images/doctors/dr-charaka.png",
      specialization: "Master of Internal Medicine, Diagnostics & Physiology",
      department: "Internal Medicine & Pathology",
      experienceYears: 29,
      phone: "+91 98480 00104",
      availability: "Available",
      shift: "Morning (08:00 AM - 04:00 PM)",
      roomNo: "Charaka Diagnostics Suite 201",
    },
    {
      staffId: "DOC-105",
      name: "Dr. Jivaka",
      email: "jivaka@dronagiri.health",
      avatar: "/images/doctors/dr-jivaka.png",
      specialization: "Head of Neuro-Surgery, Pulse Diagnostics & Royal Physician",
      department: "Neurology & Diagnostics",
      experienceYears: 24,
      phone: "+91 98480 00105",
      availability: "In Consultation",
      shift: "Full Day (09:00 AM - 05:00 PM)",
      roomNo: "Jivaka Pavilion Suite 301",
    },
    {
      staffId: "DOC-106",
      name: "Dr. Nagarjuna",
      email: "nagarjuna@dronagiri.health",
      avatar: "/images/doctors/dr-nagarjuna.png",
      specialization: "Chief Pharmacologist, Metallurgist & Critical Therapeutics",
      department: "Pharmacology & Therapeutics",
      experienceYears: 26,
      phone: "+91 98480 00106",
      availability: "Available",
      shift: "Clinical & Lab Command (08:00 AM - 04:00 PM)",
      roomNo: "Nagarjuna Therapeutics Lab 401",
    },
    {
      staffId: "DOC-107",
      name: "Dr. Kashyapa",
      email: "kashyapa@dronagiri.health",
      avatar: "/images/doctors/dr-kashyapa.png",
      specialization: "Master of Pediatrics, Obstetrics & Child Rejuvenation",
      department: "Pediatrics & Obstetrics",
      experienceYears: 22,
      phone: "+91 98480 00107",
      availability: "Available",
      shift: "Maternal Care Rotation",
      roomNo: "Kashyapa Maternity Suite 501",
    },
  ];

  const createdDoctors: Record<string, any> = {};
  for (const doc of doctorsData) {
    const user = await prisma.user.create({
      data: {
        email: doc.email,
        passwordHash: defaultPasswordHash,
        name: doc.name,
        role: "DOCTOR",
        phone: doc.phone,
      },
    });

    createdDoctors[doc.staffId] = await prisma.doctor.create({
      data: {
        userId: user.id,
        staffId: doc.staffId,
        name: doc.name,
        avatar: doc.avatar,
        specialization: doc.specialization,
        experienceYears: doc.experienceYears,
        phone: doc.phone,
        email: doc.email,
        availability: doc.availability,
        shift: doc.shift,
        roomNo: doc.roomNo,
        departmentId: createdDepts[doc.department].id,
      },
    });
  }

  // 4. Nurses / Staff
  const nurseUser = await prisma.user.create({
    data: {
      email: "nurse.ananya@dronagiri.health",
      passwordHash: defaultPasswordHash,
      name: "Head Nurse Ananya Sharma",
      role: "NURSE",
      phone: "+91 98480 00201",
    },
  });

  const createdNurse = await prisma.staff.create({
    data: {
      userId: nurseUser.id,
      staffId: "STF-201",
      name: "Head Nurse Ananya Sharma",
      role: "Nurse",
      phone: "+91 98480 00201",
      shift: "Morning (7AM-3PM)",
      departmentId: createdDepts["Integrative Medicine"].id,
    },
  });

  // Driver User & Patient User
  await prisma.user.create({
    data: {
      email: "driver.maruti@dronagiri.health",
      passwordHash: defaultPasswordHash,
      name: "Driver Maruti Rescue",
      role: "STAFF",
      phone: "+91 98480 00902",
    },
  });

  await prisma.user.create({
    data: {
      email: "dr.dhanvantari@dronagiri.health",
      passwordHash: defaultPasswordHash,
      name: "Dr. Dhanvantari",
      role: "DOCTOR",
      phone: "+91 98480 00101",
    },
  });

  await prisma.user.create({
    data: {
      email: "srimannarayana@dronagiri.health",
      passwordHash: defaultPasswordHash,
      name: "Srimannarayana",
      role: "PATIENT",
      phone: "+91 98480 34872",
    },
  });

  // 5. Patients — All Indian Patient Roster (Bhuvan, Upagna, Koushik, Nikhitha, Sundar, Srimannarayana, Tejas, Subramhanyam, Vishal, Shashank, Ganesh)
  const patientsData = [
    {
      mrn: "HMS34872",
      name: "Srimannarayana",
      age: 18,
      gender: "Male",
      phone: "+91 98480 34872",
      email: "srimannarayana@dronagiri.health",
      address: "Gandhamadana Pavilion, Suite 404",
      bloodGroup: "O+",
      emergencyContactJson: JSON.stringify({ name: "Narayana Family", relation: "Family", phone: "+91 98480 34873" }),
      medicalHistoryJson: JSON.stringify(["Athletic Fitness Optimization (2025)", "Comprehensive Biomarker Screening"]),
      allergiesJson: JSON.stringify(["None Reported"]),
      currentConditionsJson: JSON.stringify(["Annual Health Review", "Holistic Vitals Monitoring"]),
      insuranceJson: JSON.stringify({ provider: "Dronagiri Apex Health", policyNo: "DRN-34872-PREM", coverageLimit: 100000, coPayPct: 0 }),
      status: "OPD Queue",
      departmentId: createdDepts["Integrative Medicine"].id,
    },
    {
      mrn: "P-1001",
      name: "Sundar",
      age: 32,
      gender: "Male",
      phone: "+91 98490 23489",
      email: "sundar@dronagiri.health",
      address: "742 Ashwini Vihar, Gandhamadana",
      bloodGroup: "O+",
      emergencyContactJson: JSON.stringify({ name: "Lakshmi Sundar", relation: "Spouse", phone: "+91 98490 23490" }),
      medicalHistoryJson: JSON.stringify(["Mild Hypertension (2023)", "Preventive Wellness Program"]),
      allergiesJson: JSON.stringify(["Penicillin"]),
      currentConditionsJson: JSON.stringify(["Post-Exertion Monitoring", "Cardiovascular Care"]),
      insuranceJson: JSON.stringify({ provider: "Ayush Care Plus", policyNo: "AYU-892104-X", coverageLimit: 75000, coPayPct: 10 }),
      status: "Admitted",
      departmentId: createdDepts["Cardiology"].id,
    },
    {
      mrn: "P-1002",
      name: "Bhuvan",
      age: 24,
      gender: "Male",
      phone: "+91 98760 12345",
      email: "bhuvan@dronagiri.health",
      address: "1200 Sushruta Enclave, Dronagiri",
      bloodGroup: "B+",
      emergencyContactJson: JSON.stringify({ name: "Bhavan", relation: "Twin Brother", phone: "+91 98760 12346" }),
      medicalHistoryJson: JSON.stringify(["Sports Ligament Reconstruction (2024)", "Rapid Rehab Recovery"]),
      allergiesJson: JSON.stringify(["Sulfa Drugs"]),
      currentConditionsJson: JSON.stringify(["Post-Operative Arthroscopy Recovery"]),
      insuranceJson: JSON.stringify({ provider: "Sanjeevani Health Shield", policyNo: "SNJ-77192-M", coverageLimit: 100000, coPayPct: 5 }),
      status: "Admitted",
      departmentId: createdDepts["Surgical Sciences"].id,
    },
    {
      mrn: "P-1003",
      name: "Upagna",
      age: 26,
      gender: "Female",
      phone: "+91 94320 90810",
      email: "upagna@dronagiri.health",
      address: "88 Charaka Heights, Gandhamadana",
      bloodGroup: "B+",
      emergencyContactJson: JSON.stringify({ name: "Satvik", relation: "Brother", phone: "+91 94320 90811" }),
      medicalHistoryJson: JSON.stringify(["Neurological Stress Management", "Pulse Balance Protocols"]),
      allergiesJson: JSON.stringify(["Latex"]),
      currentConditionsJson: JSON.stringify(["Neuro-Vascular Assessment", "Migraine Prophylaxis"]),
      insuranceJson: JSON.stringify({ provider: "Global Universal AyurMed", policyNo: "GUM-994102", coverageLimit: 50000, coPayPct: 15 }),
      status: "OPD Queue",
      departmentId: createdDepts["Neurology & Diagnostics"].id,
    },
    {
      mrn: "P-1004",
      name: "Koushik",
      age: 29,
      gender: "Male",
      phone: "+91 99010 45670",
      email: "koushik@dronagiri.health",
      address: "45 Nagarjuna Road, Dronagiri",
      bloodGroup: "AB+",
      emergencyContactJson: JSON.stringify({ name: "Satwik", relation: "Brother", phone: "+91 99010 45671" }),
      medicalHistoryJson: JSON.stringify(["Coronary Care History (2024)"]),
      allergiesJson: JSON.stringify(["Iodine Contrast"]),
      currentConditionsJson: JSON.stringify(["Trauma Stabilization & Cardiac Care"]),
      insuranceJson: JSON.stringify({ provider: "Apex Corporate Healthcare", policyNo: "ACH-440219", coverageLimit: 120000, coPayPct: 0 }),
      status: "Admitted",
      departmentId: createdDepts["Emergency & Critical Care"].id,
    },
    {
      mrn: "P-1005",
      name: "Nikhitha",
      age: 28,
      gender: "Female",
      phone: "+91 96780 34560",
      email: "nikhitha@dronagiri.health",
      address: "502 Kashyapa Lane, Gandhamadana",
      bloodGroup: "O-",
      emergencyContactJson: JSON.stringify({ name: "Bangaram", relation: "Mother", phone: "+91 96780 34561" }),
      medicalHistoryJson: JSON.stringify(["Prenatal Care 32 Weeks"]),
      allergiesJson: JSON.stringify(["None"]),
      currentConditionsJson: JSON.stringify(["Maternal & Fetal Health Assessment"]),
      insuranceJson: JSON.stringify({ provider: "Matru Raksha Insurance", policyNo: "MRI-110293", coverageLimit: 60000, coPayPct: 10 }),
      status: "OPD Queue",
      departmentId: createdDepts["Pediatrics & Obstetrics"].id,
    },
    {
      mrn: "P-1006",
      name: "Tejas",
      age: 35,
      gender: "Male",
      phone: "+91 98110 56780",
      email: "tejas@dronagiri.health",
      address: "104 Vedic Boulevard, Dronagiri",
      bloodGroup: "A+",
      emergencyContactJson: JSON.stringify({ name: "Axitha", relation: "Sister", phone: "+91 98110 56781" }),
      medicalHistoryJson: JSON.stringify(["Metabolic & Digestive Assessment"]),
      allergiesJson: JSON.stringify(["Pollen"]),
      currentConditionsJson: JSON.stringify(["Routine Health Screening", "Physiology Diagnostics"]),
      insuranceJson: JSON.stringify({ provider: "Charaka Health Shield", policyNo: "CHS-99210-A", coverageLimit: 80000, coPayPct: 10 }),
      status: "OPD Queue",
      departmentId: createdDepts["Internal Medicine & Pathology"].id,
    },
    {
      mrn: "P-1007",
      name: "Subramhanyam",
      age: 52,
      gender: "Male",
      phone: "+91 98450 78901",
      email: "subramhanyam@dronagiri.health",
      address: "301 Sanjeevani Hill View, Gandhamadana",
      bloodGroup: "A-",
      emergencyContactJson: JSON.stringify({ name: "Vamshi", relation: "Brother", phone: "+91 98450 78902" }),
      medicalHistoryJson: JSON.stringify(["Hypertension Management", "Therapeutic Rejuvenation"]),
      allergiesJson: JSON.stringify(["Aspirin"]),
      currentConditionsJson: JSON.stringify(["Formulation Monitoring & Inpatient Care"]),
      insuranceJson: JSON.stringify({ provider: "Nagarjuna AyurRaksha", policyNo: "NAR-44120-S", coverageLimit: 90000, coPayPct: 5 }),
      status: "Admitted",
      departmentId: createdDepts["Pharmacology & Therapeutics"].id,
    },
    {
      mrn: "P-1008",
      name: "Vishal",
      age: 30,
      gender: "Male",
      phone: "+91 97120 34512",
      email: "vishal@dronagiri.health",
      address: "220 Sushruta Surgical Way, Dronagiri",
      bloodGroup: "O+",
      emergencyContactJson: JSON.stringify({ name: "Prawal", relation: "Brother", phone: "+91 97120 34513" }),
      medicalHistoryJson: JSON.stringify(["Orthopedic Knee Evaluation"]),
      allergiesJson: JSON.stringify(["None"]),
      currentConditionsJson: JSON.stringify(["Pre-Op Surgical Planning"]),
      insuranceJson: JSON.stringify({ provider: "Sushruta Surgical Shield", policyNo: "SSS-55012-V", coverageLimit: 110000, coPayPct: 10 }),
      status: "OPD Queue",
      departmentId: createdDepts["Surgical Sciences"].id,
    },
    {
      mrn: "P-1009",
      name: "Shashank",
      age: 27,
      gender: "Male",
      phone: "+91 99230 45678",
      email: "shashank@dronagiri.health",
      address: "610 Dhanvantari Enclave, Gandhamadana",
      bloodGroup: "B-",
      emergencyContactJson: JSON.stringify({ name: "Greeshma", relation: "Girlfriend", phone: "+91 99230 45679" }),
      medicalHistoryJson: JSON.stringify(["Ankle Sprain Recovery", "Cardiovascular Screening"]),
      allergiesJson: JSON.stringify(["Dust Mites"]),
      currentConditionsJson: JSON.stringify(["Post-Triage Follow-up"]),
      insuranceJson: JSON.stringify({ provider: "Ayush Care Plus", policyNo: "AYU-10293-S", coverageLimit: 50000, coPayPct: 10 }),
      status: "Discharged",
      departmentId: createdDepts["Cardiology"].id,
    },
    {
      mrn: "P-1010",
      name: "Ganesh",
      age: 45,
      gender: "Male",
      phone: "+91 98340 56712",
      email: "ganesh@dronagiri.health",
      address: "18 Garuda Path, Dronagiri",
      bloodGroup: "AB-",
      emergencyContactJson: JSON.stringify({ name: "Parvati Ganesh", relation: "Spouse", phone: "+91 98340 56713" }),
      medicalHistoryJson: JSON.stringify(["General Wellness", "Metabolic Review"]),
      allergiesJson: JSON.stringify(["None Reported"]),
      currentConditionsJson: JSON.stringify(["Inpatient General Care"]),
      insuranceJson: JSON.stringify({ provider: "Dronagiri Apex Health", policyNo: "DRN-88120-G", coverageLimit: 60000, coPayPct: 15 }),
      status: "Admitted",
      departmentId: createdDepts["Internal Medicine & Pathology"].id,
    },
  ];

  const createdPatients: Record<string, any> = {};
  for (const p of patientsData) {
    createdPatients[p.mrn] = await prisma.patient.create({ data: p });
  }

  // 6. Appointments
  await prisma.appointment.createMany({
    data: [
      { tokenNo: 101, patientId: createdPatients["HMS34872"].id, doctorId: createdDoctors["DOC-101"].id, appointmentDate: new Date(), appointmentTime: "10:00 AM", status: "Serving", avgWaitMins: 0 },
      { tokenNo: 102, patientId: createdPatients["P-1001"].id, doctorId: createdDoctors["DOC-101"].id, appointmentDate: new Date(), appointmentTime: "10:15 AM", status: "Waiting", avgWaitMins: 12 },
      { tokenNo: 103, patientId: createdPatients["P-1002"].id, doctorId: createdDoctors["DOC-103"].id, appointmentDate: new Date(), appointmentTime: "10:30 AM", status: "Waiting", avgWaitMins: 18 },
      { tokenNo: 104, patientId: createdPatients["P-1003"].id, doctorId: createdDoctors["DOC-105"].id, appointmentDate: new Date(), appointmentTime: "10:45 AM", status: "Waiting", avgWaitMins: 25 },
      { tokenNo: 105, patientId: createdPatients["P-1005"].id, doctorId: createdDoctors["DOC-107"].id, appointmentDate: new Date(), appointmentTime: "11:00 AM", status: "Waiting", avgWaitMins: 35 },
      { tokenNo: 106, patientId: createdPatients["P-1006"].id, doctorId: createdDoctors["DOC-104"].id, appointmentDate: new Date(), appointmentTime: "11:15 AM", status: "Waiting", avgWaitMins: 40 },
      { tokenNo: 107, patientId: createdPatients["P-1008"].id, doctorId: createdDoctors["DOC-103"].id, appointmentDate: new Date(), appointmentTime: "11:30 AM", status: "Waiting", avgWaitMins: 45 },
    ],
  });

  // 7. Wards, Rooms, Beds
  const wards = [
    { name: "ICU Ward", type: "ICU" },
    { name: "Deluxe Ward", type: "Deluxe" },
    { name: "Semi-Private Ward", type: "Semi-Private" },
    { name: "General Ward", type: "General" },
  ];

  for (const w of wards) {
    const ward = await prisma.ward.create({ data: { name: w.name, type: w.type } });
    const room = await prisma.room.create({
      data: { roomNo: `RM-${w.type.slice(0, 3)}`, wardId: ward.id, capacity: 4 },
    });

    if (w.type === "ICU") {
      await prisma.bed.create({
        data: {
          bedNo: "ICU-01",
          roomId: room.id,
          status: "Occupied",
          dailyRate: 1500,
          patientId: createdPatients["P-1004"].id,
          patientName: "Koushik",
          admittedDate: "2026-08-12",
          attendingDoctorId: createdDoctors["DOC-102"].id,
          nurseAssignedId: createdNurse.id,
        },
      });
      await prisma.bed.create({
        data: {
          bedNo: "ICU-02",
          roomId: room.id,
          status: "Occupied",
          dailyRate: 1500,
          patientId: createdPatients["P-1001"].id,
          patientName: "Sundar",
          admittedDate: "2026-08-14",
          attendingDoctorId: createdDoctors["DOC-101"].id,
          nurseAssignedId: createdNurse.id,
        },
      });
      await prisma.bed.create({ data: { bedNo: "ICU-03", roomId: room.id, status: "Available", dailyRate: 1500 } });
      await prisma.bed.create({ data: { bedNo: "ICU-04", roomId: room.id, status: "Cleaning", dailyRate: 1500 } });
    } else if (w.type === "Deluxe") {
      await prisma.bed.create({ data: { bedNo: "DLX-101", roomId: room.id, status: "Available", dailyRate: 650 } });
      await prisma.bed.create({
        data: {
          bedNo: "DLX-104",
          roomId: room.id,
          status: "Occupied",
          dailyRate: 650,
          patientId: createdPatients["P-1002"].id,
          patientName: "Bhuvan",
          admittedDate: "2026-08-13",
          attendingDoctorId: createdDoctors["DOC-103"].id,
        },
      });
    } else if (w.type === "Semi-Private") {
      await prisma.bed.create({
        data: {
          bedNo: "SEM-201",
          roomId: room.id,
          status: "Occupied",
          dailyRate: 350,
          patientId: createdPatients["P-1007"].id,
          patientName: "Subramhanyam",
          admittedDate: "2026-08-14",
          attendingDoctorId: createdDoctors["DOC-106"].id,
        },
      });
      await prisma.bed.create({ data: { bedNo: "SEM-202", roomId: room.id, status: "Available", dailyRate: 350 } });
    } else {
      await prisma.bed.create({
        data: {
          bedNo: "GEN-301",
          roomId: room.id,
          status: "Occupied",
          dailyRate: 150,
          patientId: createdPatients["P-1010"].id,
          patientName: "Ganesh",
          admittedDate: "2026-08-11",
          attendingDoctorId: createdDoctors["DOC-104"].id,
        },
      });
      await prisma.bed.create({ data: { bedNo: "GEN-302", roomId: room.id, status: "Available", dailyRate: 150 } });
      await prisma.bed.create({ data: { bedNo: "GEN-303", roomId: room.id, status: "Maintenance", dailyRate: 150 } });
      await prisma.bed.create({ data: { bedNo: "GEN-304", roomId: room.id, status: "Reserved", dailyRate: 150 } });
    }
  }

  // 8. Emergency Cases
  await prisma.emergencyCase.createMany({
    data: [
      {
        caseId: "EMG-901",
        patientId: createdPatients["P-1004"].id,
        patientName: "Koushik",
        age: 29,
        gender: "Male",
        arrivalTime: "10:12 AM",
        severity: "RED",
        chiefComplaint: "Acute Cardiac Discomfort + Hypotension",
        assignedDoctor: "Dr. Ashwini Kumaras",
        traumaBay: "Bay-1 (Ashwini Resuscitation)",
        bedNo: "ER-01",
        vitalsJson: JSON.stringify({ bp: "90/60", pulse: 118, temp: "98.6 F", spo2: 94 }),
        status: "Under Care",
      },
      {
        caseId: "EMG-902",
        patientName: "Upagna",
        age: 26,
        gender: "Female",
        arrivalTime: "10:28 AM",
        severity: "YELLOW",
        chiefComplaint: "Laceration forearm, controlled bleeding",
        assignedDoctor: "Dr. Sushruta",
        traumaBay: "Bay-3",
        bedNo: "ER-04",
        vitalsJson: JSON.stringify({ bp: "120/80", pulse: 82, temp: "98.4 F", spo2: 99 }),
        status: "Triaged",
      },
      {
        caseId: "EMG-903",
        patientName: "Shashank",
        age: 27,
        gender: "Male",
        arrivalTime: "09:45 AM",
        severity: "GREEN",
        chiefComplaint: "Sprained ankle from sports exertion",
        assignedDoctor: "Dr. Sushruta",
        traumaBay: "Triage Desk 2",
        bedNo: "ER-07",
        vitalsJson: JSON.stringify({ bp: "128/84", pulse: 74, temp: "98.6 F", spo2: 98 }),
        status: "Discharged",
      },
    ],
  });

  // 9. Pharmacy Items
  await prisma.medicine.createMany({
    data: [
      { medicineId: "RX-01", name: "Amoxicillin 500mg", category: "Antibiotics", batchNo: "BAT-88210", stockQty: 1420, reorderLevel: 200, supplier: "Dronagiri Pharma", expiryDate: "2027-04-30", unitPrice: 12.5, prescriptionRequired: true },
      { medicineId: "RX-02", name: "Atorvastatin 20mg", category: "Cardiovascular", batchNo: "BAT-99312", stockQty: 88, reorderLevel: 100, supplier: "Sanjeevani Labs", expiryDate: "2026-09-15", unitPrice: 28.0, prescriptionRequired: true },
      { medicineId: "RX-03", name: "Paracetamol 650mg", category: "Analgesics", batchNo: "BAT-11029", stockQty: 4500, reorderLevel: 500, supplier: "Cipla Health", expiryDate: "2028-01-10", unitPrice: 2.0, prescriptionRequired: false },
      { medicineId: "RX-04", name: "Insulin Glargine 100U", category: "Diabetes", batchNo: "BAT-33410", stockQty: 45, reorderLevel: 50, supplier: "Biocon Global", expiryDate: "2026-09-01", unitPrice: 85.0, prescriptionRequired: true },
    ],
  });

  // 10. Lab Orders & Results
  const lab1 = await prisma.labOrder.create({
    data: {
      orderId: "LAB-401",
      patientId: createdPatients["P-1001"].id,
      doctorId: createdDoctors["DOC-101"].id,
      testName: "Complete Blood Count (CBC)",
      category: "Hematology",
      sampleType: "Venous Blood",
      status: "Verified",
      technician: "Tech Alok Verma",
      verifyingDoctor: "Dr. Dhanvantari",
    },
  });

  await prisma.labResult.create({
    data: {
      labOrderId: lab1.id,
      parameter: "WBC Count",
      value: "12.4 x10^3/uL",
      unit: "x10^3/uL",
      referenceRange: "4.5 - 11.0",
      isAbnormal: false,
      remarks: "Normal leukocyte distribution",
      verifiedAt: new Date(),
    },
  });

  // 11. Radiology
  const rad1 = await prisma.radiologyOrder.create({
    data: {
      orderId: "RAD-701",
      patientId: createdPatients["P-1001"].id,
      doctorId: createdDoctors["DOC-101"].id,
      scanType: "CT Scan",
      bodyPart: "Chest & Coronary Angiography",
      urgency: "Urgent",
      technician: "Rad-Tech Jayant",
      radiologist: "Dr. Jivaka",
      status: "Completed",
      dcmImage: "https://images.unsplash.com/photo-1516549655169-df83a0774514?w=600&auto=format&fit=crop&q=80",
    },
  });

  await prisma.radiologyReport.create({
    data: {
      radiologyOrderId: rad1.id,
      reportText: "No acute aortic dissection observed. Clear coronary circulation.",
      findings: "Clear arterial vascularity without calcification.",
      impression: "Healthy cardiac physiology.",
      reportedBy: "Dr. Jivaka",
    },
  });

  // 12. Operation Theatre & Surgeries
  const ot1 = await prisma.operationTheatre.create({ data: { name: "Sushruta OT-1", status: "Available" } });
  const ot2 = await prisma.operationTheatre.create({ data: { name: "Ashwini Hybrid Suite", status: "In Use" } });

  await prisma.surgery.create({
    data: {
      surgeryId: "OT-201",
      patientId: createdPatients["P-1002"].id,
      procedure: "Arthroscopic Ligament Reconstruction (Right Knee)",
      otId: ot1.id,
      leadSurgeonId: createdDoctors["DOC-103"].id,
      anesthetist: "Dr. Nagarjuna",
      scrubNurse: "Nurse Sneha Rao",
      startTime: "08:00 AM",
      endTime: "11:30 AM",
      status: "Completed",
      preOpChecklistJson: JSON.stringify({ identityVerified: true, consentSigned: true, bloodAvailable: true, anesthesiaCleared: true, equipmentReady: true, surgicalSiteMarked: true }),
    },
  });

  await prisma.surgery.create({
    data: {
      surgeryId: "OT-202",
      patientId: createdPatients["P-1004"].id,
      procedure: "Cardiac Catheterization & Revascularization",
      otId: ot2.id,
      leadSurgeonId: createdDoctors["DOC-102"].id,
      anesthetist: "Dr. Dhanvantari",
      scrubNurse: "Nurse Ananya Sharma",
      startTime: "01:00 PM",
      endTime: "04:00 PM",
      status: "Pre-Op Check",
      preOpChecklistJson: JSON.stringify({ identityVerified: true, consentSigned: true, bloodAvailable: true, anesthesiaCleared: true, equipmentReady: true, surgicalSiteMarked: true }),
    },
  });

  // 13. Blood Bank Stock
  const bloodData = [
    { bloodGroup: "A+", unitsAvailable: 28, minAlertThreshold: 10, expiringIn30Days: 4, compatibleDonorsJson: JSON.stringify(["A+", "A-", "O+", "O-"]), compatibleRecipientsJson: JSON.stringify(["A+", "AB+"]) },
    { bloodGroup: "A-", unitsAvailable: 8, minAlertThreshold: 8, expiringIn30Days: 2, compatibleDonorsJson: JSON.stringify(["A-", "O-"]), compatibleRecipientsJson: JSON.stringify(["A+", "A-", "AB+", "AB-"]) },
    { bloodGroup: "B+", unitsAvailable: 34, minAlertThreshold: 12, expiringIn30Days: 5, compatibleDonorsJson: JSON.stringify(["B+", "B-", "O+", "O-"]), compatibleRecipientsJson: JSON.stringify(["B+", "AB+"]) },
    { bloodGroup: "B-", unitsAvailable: 6, minAlertThreshold: 6, expiringIn30Days: 1, compatibleDonorsJson: JSON.stringify(["B-", "O-"]), compatibleRecipientsJson: JSON.stringify(["B+", "B-", "AB+", "AB-"]) },
    { bloodGroup: "AB+", unitsAvailable: 15, minAlertThreshold: 5, expiringIn30Days: 3, compatibleDonorsJson: JSON.stringify(["Everyone (Universal Recipient)"]), compatibleRecipientsJson: JSON.stringify(["AB+"]) },
    { bloodGroup: "AB-", unitsAvailable: 4, minAlertThreshold: 5, expiringIn30Days: 1, compatibleDonorsJson: JSON.stringify(["AB-", "A-", "B-", "O-"]), compatibleRecipientsJson: JSON.stringify(["AB+", "AB-"]) },
    { bloodGroup: "O+", unitsAvailable: 42, minAlertThreshold: 15, expiringIn30Days: 6, compatibleDonorsJson: JSON.stringify(["O+", "O-"]), compatibleRecipientsJson: JSON.stringify(["O+", "A+", "B+", "AB+"]) },
    { bloodGroup: "O-", unitsAvailable: 9, minAlertThreshold: 10, expiringIn30Days: 2, compatibleDonorsJson: JSON.stringify(["O-"]), compatibleRecipientsJson: JSON.stringify(["Everyone (Universal Donor)"]) },
  ];

  for (const b of bloodData) {
    await prisma.bloodUnit.create({ data: b });
  }

  // 14. Equipment
  await prisma.equipment.createMany({
    data: [
      { equipmentId: "EQ-101", name: "Siemens Somatom 128-Slice CT Scanner", type: "Radiology Imaging", location: "Radiology Room 1", departmentId: createdDepts["Radiology"].id, status: "Operational", lastCalibrated: "2026-07-10", nextCalibration: "2026-10-10", serialNo: "SN-CT-9901A" },
      { equipmentId: "EQ-102", name: "GE Signa 3.0T MRI Scanner", type: "High Field MRI", location: "Radiology Room 3", departmentId: createdDepts["Radiology"].id, status: "In Use", lastCalibrated: "2026-06-15", nextCalibration: "2026-09-15", serialNo: "SN-MRI-3000", breakdownReportsCount: 1 },
      { equipmentId: "EQ-103", name: "Drager Evita V800 ICU Ventilator", type: "Respiratory Care", location: "ICU Bed-01", departmentId: createdDepts["Emergency & Critical Care"].id, status: "In Use", lastCalibrated: "2026-08-01", nextCalibration: "2026-11-01", serialNo: "SN-VENT-8812" },
      { equipmentId: "EQ-104", name: "Philips HeartStart XL Defibrillator", type: "Emergency Resuscitation", location: "Emergency Bay 1", departmentId: createdDepts["Emergency & Critical Care"].id, status: "Operational", lastCalibrated: "2026-08-05", nextCalibration: "2026-09-05", serialNo: "SN-DEF-1102" },
    ],
  });

  // 15. Ambulances
  await prisma.ambulance.createMany({
    data: [
      { ambulanceId: "AMB-01", vehicleNo: "DRN-AMB-01", driverName: "Garuda Dispatch", driverPhone: "+91 98480 00901", location: "Dronagiri Central Gate", availability: "Available", fuelLevelPct: 88, equipmentType: "Advanced Life Support (ALS)" },
      { ambulanceId: "AMB-02", vehicleNo: "DRN-AMB-02", driverName: "Maruti Rescue", driverPhone: "+91 98480 00902", location: "Gandhamadana Highway North", availability: "On Dispatch", fuelLevelPct: 74, equipmentType: "Basic Life Support (BLS)" },
      { ambulanceId: "AMB-03", vehicleNo: "DRN-AMB-03", driverName: "Vayu Fleet", driverPhone: "+91 98480 00903", location: "Fleet Bay 3", availability: "Maintenance", fuelLevelPct: 40, equipmentType: "Cardiac Unit" },
    ],
  });

  // 16. Invoices
  await prisma.invoice.create({
    data: {
      invoiceNo: "INV-88210",
      patientId: createdPatients["P-1001"].id,
      billDate: "2026-08-15",
      subtotal: 5550,
      insuranceCovered: 4717.5,
      coPayAmount: 832.5,
      discount: 0,
      tax: 0,
      finalAmount: 832.5,
      paymentStatus: "Pending Insurance",
      items: {
        create: [
          { description: "ICU Bed Charge (2 Days @ ₹1,500/day)", category: "Room", amount: 3000 },
          { description: "Chief Consultation (Dr. Dhanvantari)", category: "Consultation", amount: 450 },
          { description: "CT Coronary Angiography Scan", category: "Imaging", amount: 1200 },
          { description: "CBC & Serum Electrolytes Panel", category: "Laboratory", amount: 280 },
          { description: "IV Medications & Holistic Cardiac Monitoring", category: "Pharmacy", amount: 620 },
        ],
      },
    },
  });

  await prisma.invoice.create({
    data: {
      invoiceNo: "INV-88211",
      patientId: createdPatients["P-1002"].id,
      billDate: "2026-08-14",
      subtotal: 16350,
      insuranceCovered: 14715,
      coPayAmount: 1635,
      discount: 100,
      tax: 0,
      finalAmount: 1535,
      paymentStatus: "Paid",
      items: {
        create: [
          { description: "Deluxe Room Charge (2 Days @ ₹650/day)", category: "Room", amount: 1300 },
          { description: "Arthroscopic Surgery (Dr. Sushruta)", category: "Surgery", amount: 12500 },
          { description: "Anesthesia Services Fee (Dr. Nagarjuna)", category: "Procedure", amount: 2200 },
          { description: "Post-Op Physical Therapy & Rejuvenation", category: "Consultation", amount: 350 },
        ],
      },
      payments: {
        create: [
          { amount: 1535, method: "Card", reference: "TXN-CC-99120" },
        ],
      },
    },
  });

  await prisma.invoice.create({
    data: {
      invoiceNo: "INV-88212",
      patientId: createdPatients["P-1006"].id,
      billDate: "2026-08-15",
      subtotal: 1220,
      insuranceCovered: 1098,
      coPayAmount: 122,
      discount: 0,
      tax: 0,
      finalAmount: 122,
      paymentStatus: "Paid",
      items: {
        create: [
          { description: "Charaka Internal Medicine Consultation", category: "Consultation", amount: 350 },
          { description: "Abdominal Ultrasound Imaging", category: "Imaging", amount: 650 },
          { description: "Metabolic Lipid Profile Lab Test", category: "Laboratory", amount: 220 },
        ],
      },
    },
  });

  // 17. Audit Logs
  await prisma.auditLog.createMany({
    data: [
      { logId: "LOG-1001", userName: "Dr. Dhanvantari", role: "Doctor", action: "patient_emr_viewed", resource: "Patient #HMS34872 (Srimannarayana)", ip: "192.168.1.45", status: "Success" },
      { logId: "LOG-1002", userName: "Dr. Sushruta", role: "Doctor", action: "surgical_notes_logged", resource: "Surgery #OT-201 (Bhuvan)", ip: "192.168.1.62", status: "Success" },
      { logId: "LOG-1003", userName: "Dr. Ashwini Kumaras", role: "Doctor", action: "bed_allocated_icu", resource: "Bed #ICU-02 (Sundar)", ip: "192.168.1.18", status: "Success" },
      { logId: "LOG-1004", userName: "Dr. Jivaka", role: "Doctor", action: "lab_result_verified", resource: "Lab Order #LAB-403 (Upagna)", ip: "192.168.1.89", status: "Success" },
      { logId: "LOG-1005", userName: "Dr. Nagarjuna", role: "Doctor", action: "therapeutics_dispensed", resource: "Prescription #RX-8812 (Koushik)", ip: "192.168.1.101", status: "Success" },
    ],
  });

  console.log("✅ Dronagiri (Gandhamadana) Database Seeded successfully with all Indian Patients & Records!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
