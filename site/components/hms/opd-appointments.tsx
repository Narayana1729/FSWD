"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  Clock,
  User,
  Plus,
  Play,
  CheckCircle,
  FileText,
  Stethoscope,
  Pill,
  Activity,
  ChevronRight,
  Sparkles,
  AlertCircle,
  Heart,
  FileCheck,
  Check,
  X,
  HeartPulse,
} from "lucide-react";
import { Patient, Doctor, OPDToken } from "@/lib/hms-data";

interface OPDAppointmentsViewProps {
  patients: Patient[];
  doctors: Doctor[];
  opdTokens: OPDToken[];
  onAddToken: (token: OPDToken) => void;
  onUpdateTokens?: (tokens: OPDToken[]) => void;
}

export function OPDAppointmentsView({
  patients = [],
  doctors = [],
  opdTokens = [],
  onAddToken,
  onUpdateTokens,
}: OPDAppointmentsViewProps) {
  const [tokens, setTokens] = useState<OPDToken[]>(opdTokens);
  const [filterMode, setFilterMode] = useState<"dhanvantari" | "all">("dhanvantari");
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [activeConsultationToken, setActiveConsultationToken] = useState<OPDToken | null>(null);

  // Sync with incoming tokens
  useEffect(() => {
    setTokens(opdTokens);
    if (opdTokens.length > 0 && !activeConsultationToken) {
      const match = opdTokens.find((t) => {
        const docName = typeof t.doctorName === "string" ? t.doctorName : (t as any).doctor?.name || "";
        return docName.includes("Dhanvantari");
      }) || opdTokens[0];
      setActiveConsultationToken(match);
    }
  }, [opdTokens]);

  // Auth header utility
  const getAuthHeaders = (): Record<string, string> => {
    const headers: Record<string, string> = {};
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("hms_auth_token");
      if (token) headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  };

  // ── DOCTOR CONSULTATION SUITES ───────────────────────────────────────────
  interface DoctorSuiteInfo {
    id: string;
    name: string;
    title: string;
    department: string;
    suiteName: string;
    roomBadge: string;
    avatar: string;
    rxTitle: string;
    rxSubtitle: string;
    signature: string;
  }

  const DOCTOR_SUITES: Record<string, DoctorSuiteInfo> = {
    dhanvantari: {
      id: "DOC-101",
      name: "Dr. Dhanvantari",
      title: "Chief Medical Officer & Divine Healer",
      department: "Integrative Medicine & Cardiology",
      suiteName: "Apex Dhanvantari Suite 101 • Cardiology & Divine Medicine",
      roomBadge: "Suite 101 • CMO",
      avatar: "/images/doctors/dr-dhanvantari.jpg",
      rxTitle: "Dr. Dhanvantari Integrative Divine e-Prescription",
      rxSubtitle: "Cardiology & Integrative Healing • Registered NMC-48821",
      signature: "Dr. Dhanvantari (CMO • Reg. NMC-48821)",
    },
    ashwini: {
      id: "DOC-102",
      name: "Dr. Ashwini Kumaras",
      title: "Chiefs of Clinical Operations & Dual Regenerative Medicine",
      department: "Emergency & Critical Care",
      suiteName: "Ashwini Resuscitation Suite 102 • Level-1 Trauma",
      roomBadge: "Suite 102 • Emergency",
      avatar: "/images/doctors/dr-ashwini-kumaras.png",
      rxTitle: "Dr. Ashwini Kumaras Emergency & Rapid Resuscitation e-Prescription",
      rxSubtitle: "Level-1 Critical Care Resuscitation • Registered NMC-10022",
      signature: "Dr. Ashwini Kumaras (Critical Care Chiefs • Reg. NMC-10022)",
    },
    sushruta: {
      id: "DOC-103",
      name: "Dr. Sushruta",
      title: "Father of Surgery & Master of Reconstructive Sciences",
      department: "Surgical Sciences & Orthopedics",
      suiteName: "Sushruta OT Theatre 1 • Surgical & Orthopedic Suite",
      roomBadge: "OT Theatre 1 • Chief Surgeon",
      avatar: "/images/doctors/dr-sushruta.jpg",
      rxTitle: "Dr. Sushruta Advanced Surgical & Musculoskeletal e-Prescription",
      rxSubtitle: "Reconstructive Surgery & Orthopedics • Registered NMC-32014",
      signature: "Dr. Sushruta (Head of Surgical Sciences • Reg. NMC-32014)",
    },
    charaka: {
      id: "DOC-104",
      name: "Dr. Charaka",
      title: "Master of Internal Medicine, Diagnostics & Physiology",
      department: "Internal Medicine & Pathology",
      suiteName: "Charaka Diagnostics Suite 201 • Internal Medicine",
      roomBadge: "Suite 201 • Internal Med",
      avatar: "/images/doctors/dr-charaka.png",
      rxTitle: "Dr. Charaka Classical Internal Medicine & Physiological e-Prescription",
      rxSubtitle: "Metabolism, Diagnostics & Physiology • Registered NMC-29184",
      signature: "Dr. Charaka (Master of Internal Medicine • Reg. NMC-29184)",
    },
    jivaka: {
      id: "DOC-105",
      name: "Dr. Jivaka",
      title: "Head of Neuro-Surgery, Pulse Diagnostics & Royal Physician",
      department: "Neurology & Diagnostics",
      suiteName: "Jivaka Diagnostics Pavilion Suite 301 • Neurology",
      roomBadge: "Suite 301 • Neuro Chief",
      avatar: "/images/doctors/dr-jivaka.png",
      rxTitle: "Dr. Jivaka Neuro-Vascular & Pulse Diagnostics e-Prescription",
      rxSubtitle: "Cranial Nerves & Neuro-Diagnostics • Registered NMC-41092",
      signature: "Dr. Jivaka (Head of Neurology • Reg. NMC-41092)",
    },
    nagarjuna: {
      id: "DOC-106",
      name: "Dr. Nagarjuna",
      title: "Chief Pharmacologist, Metallurgist & Critical Therapeutics",
      department: "Pharmacology & Therapeutics",
      suiteName: "Nagarjuna Therapeutics Lab 401 • Formulations",
      roomBadge: "Lab 401 • Therapeutics",
      avatar: "/images/doctors/dr-nagarjuna.png",
      rxTitle: "Dr. Nagarjuna Advanced Therapeutics & Formulations e-Prescription",
      rxSubtitle: "Pharmacology, Metallurgy & Toxicology • Registered NMC-19402",
      signature: "Dr. Nagarjuna (Chief Pharmacologist • Reg. NMC-19402)",
    },
    kashyapa: {
      id: "DOC-107",
      name: "Dr. Kashyapa",
      title: "Master of Pediatrics, Obstetrics & Child Rejuvenation",
      department: "Pediatrics & Obstetrics",
      suiteName: "Kashyapa Maternity Suite 501 • Maternal & Child Health",
      roomBadge: "Suite 501 • Maternity",
      avatar: "/images/doctors/dr-kashyapa.png",
      rxTitle: "Dr. Kashyapa Maternal, Prenatal & Pediatric Care e-Prescription",
      rxSubtitle: "Obstetrics, Fetal Medicine & Pediatrics • Registered NMC-50211",
      signature: "Dr. Kashyapa (Chief of Obstetrics & Pediatrics • Reg. NMC-50211)",
    },
  };

  const getDoctorSuite = (docNameOrId: string): DoctorSuiteInfo => {
    const q = (docNameOrId || "").toLowerCase();
    if (q.includes("ashwini") || q.includes("doc-102")) return DOCTOR_SUITES.ashwini;
    if (q.includes("sushruta") || q.includes("doc-103")) return DOCTOR_SUITES.sushruta;
    if (q.includes("charaka") || q.includes("doc-104")) return DOCTOR_SUITES.charaka;
    if (q.includes("jivaka") || q.includes("doc-105")) return DOCTOR_SUITES.jivaka;
    if (q.includes("nagarjuna") || q.includes("doc-106")) return DOCTOR_SUITES.nagarjuna;
    if (q.includes("kashyapa") || q.includes("doc-107")) return DOCTOR_SUITES.kashyapa;
    return DOCTOR_SUITES.dhanvantari;
  };

  // ── PATIENT CLINICAL PROFILES (DIFFER FROM PATIENT TO PATIENT) ───────────
  interface PatientClinicalProfile {
    vitals: {
      bp: string;
      pulse: string;
      temp: string;
      spo2: string;
      ecg: string;
    };
    symptoms: string;
    diagnosis: string;
    clinicalNotes: string;
    prescriptionItems: { med: string; dosage: string; freq: string; duration: string }[];
    orderedTests: string[];
  }

  const PATIENT_CLINICAL_PROFILES: Record<string, PatientClinicalProfile> = {
    // 1. Srimannarayana — Athletic Health Review & Integrative Medicine
    HMS34872: {
      vitals: { bp: "118/76 mmHg", pulse: "68 bpm", temp: "98.4 °F", spo2: "100%", ecg: "Normal Sinus (Athletic Bradycardia)" },
      symptoms: "Annual holistic health assessment & athletic biomarker baseline screening for collegiate marathon preparation.",
      diagnosis: "Optimal Cardiovascular & Metabolic Fitness • Athletic Baseline • Balanced Tridosha",
      clinicalNotes: "Cardiovascular endurance and baseline recovery parameters exemplary. Lung fields clear. Advised hydration electrolytes, Ashwagandha vitality regimen, and seasonal cross-training schedule.",
      prescriptionItems: [
        { med: "Ashwagandha Gold Extract 500mg", dosage: "1 Capsule", freq: "Twice Daily (Post-Meal)", duration: "30 Days" },
        { med: "Chyawanprash Supreme Organic", dosage: "1 Teaspoon", freq: "Once Daily (Morning)", duration: "30 Days" },
        { med: "Electrolyte Balance Complex", dosage: "1 Sachet", freq: "Once Daily (Post-Workout)", duration: "14 Days" },
      ],
      orderedTests: ["Comprehensive Metabolic Panel (CMP)", "VO2 Max Cardiac Screen", "Lipid Subfraction Panel", "Vitamin D3 & B12"],
    },
    srimannarayana: {
      vitals: { bp: "118/76 mmHg", pulse: "68 bpm", temp: "98.4 °F", spo2: "100%", ecg: "Normal Sinus (Athletic Bradycardia)" },
      symptoms: "Annual holistic health assessment & athletic biomarker baseline screening for collegiate marathon preparation.",
      diagnosis: "Optimal Cardiovascular & Metabolic Fitness • Athletic Baseline • Balanced Tridosha",
      clinicalNotes: "Cardiovascular endurance and baseline recovery parameters exemplary. Lung fields clear. Advised hydration electrolytes, Ashwagandha vitality regimen, and seasonal cross-training schedule.",
      prescriptionItems: [
        { med: "Ashwagandha Gold Extract 500mg", dosage: "1 Capsule", freq: "Twice Daily (Post-Meal)", duration: "30 Days" },
        { med: "Chyawanprash Supreme Organic", dosage: "1 Teaspoon", freq: "Once Daily (Morning)", duration: "30 Days" },
        { med: "Electrolyte Balance Complex", dosage: "1 Sachet", freq: "Once Daily (Post-Workout)", duration: "14 Days" },
      ],
      orderedTests: ["Comprehensive Metabolic Panel (CMP)", "VO2 Max Cardiac Screen", "Lipid Subfraction Panel", "Vitamin D3 & B12"],
    },

    // 2. Sundar — Cardiology / Hypertension Follow-up
    "P-1001": {
      vitals: { bp: "138/88 mmHg", pulse: "84 bpm", temp: "98.6 °F", spo2: "98%", ecg: "Sinus Tachycardia • Pre-anginal Strain" },
      symptoms: "Sudden retrosternal chest tightness and high pulse after climbing stairs, progressive exertional fatigue over past 2 weeks.",
      diagnosis: "Stage 1 Essential Hypertension • Pre-anginal Myocardial Strain • Dyslipidemia",
      clinicalNotes: "Patient educated on low-sodium DASH diet, daily 30-min brisk aerobic walking, stress reduction protocols, and strict adherence to Arjuna and Atorvastatin.",
      prescriptionItems: [
        { med: "Arjuna Bark Extract 500mg", dosage: "1 Capsule", freq: "Twice Daily (Post-Meal)", duration: "30 Days" },
        { med: "Atorvastatin 10mg", dosage: "1 Tablet", freq: "Once Daily (Night)", duration: "30 Days" },
        { med: "Low-Dose Aspirin 81mg", dosage: "1 Tablet", freq: "Once Daily (Morning)", duration: "30 Days" },
      ],
      orderedTests: ["Cardiac Troponin I", "2D Echocardiogram", "Lipid Profile Panel", "CT Coronary Angiogram"],
    },
    sundar: {
      vitals: { bp: "138/88 mmHg", pulse: "84 bpm", temp: "98.6 °F", spo2: "98%", ecg: "Sinus Tachycardia • Pre-anginal Strain" },
      symptoms: "Sudden retrosternal chest tightness and high pulse after climbing stairs, progressive exertional fatigue over past 2 weeks.",
      diagnosis: "Stage 1 Essential Hypertension • Pre-anginal Myocardial Strain • Dyslipidemia",
      clinicalNotes: "Patient educated on low-sodium DASH diet, daily 30-min brisk aerobic walking, stress reduction protocols, and strict adherence to Arjuna and Atorvastatin.",
      prescriptionItems: [
        { med: "Arjuna Bark Extract 500mg", dosage: "1 Capsule", freq: "Twice Daily (Post-Meal)", duration: "30 Days" },
        { med: "Atorvastatin 10mg", dosage: "1 Tablet", freq: "Once Daily (Night)", duration: "30 Days" },
        { med: "Low-Dose Aspirin 81mg", dosage: "1 Tablet", freq: "Once Daily (Morning)", duration: "30 Days" },
      ],
      orderedTests: ["Cardiac Troponin I", "2D Echocardiogram", "Lipid Profile Panel", "CT Coronary Angiogram"],
    },

    // 3. Bhuvan — Orthopedic Knee Post-Op Care
    "P-1002": {
      vitals: { bp: "122/78 mmHg", pulse: "72 bpm", temp: "98.7 °F", spo2: "99%", ecg: "Normal Sinus Rhythm" },
      symptoms: "Post-operative Day-2 right knee arthroscopic ACL reconstruction evaluation. Localized peri-articular edema, controlled post-surgical discomfort.",
      diagnosis: "Status Post Right Knee Arthroscopic ACL Reconstruction • Resolving Hemarthrosis • Satisfactory Graft Tension",
      clinicalNotes: "Portals clean and dry, sutures intact without erythema. Passive knee range of motion 0-60 degrees. Cryotherapy and isometric quadriceps strengthening initiated.",
      prescriptionItems: [
        { med: "Cissus Quadrangularis (Hadjod) 750mg", dosage: "1 Tablet", freq: "Twice Daily (Post-Meal)", duration: "21 Days" },
        { med: "Aceclofenac + Paracetamol (100mg/325mg)", dosage: "1 Tablet", freq: "Twice Daily (Post-Meal)", duration: "7 Days" },
        { med: "Chymoral Forte (Enzyme Anti-edema)", dosage: "1 Tablet", freq: "Three Times Daily (Before Food)", duration: "5 Days" },
      ],
      orderedTests: ["Post-Op Knee X-Ray (AP/Lateral)", "Full Leg Alignment Scan", "Inflammatory Markers (CRP/ESR)"],
    },
    bhuvan: {
      vitals: { bp: "122/78 mmHg", pulse: "72 bpm", temp: "98.7 °F", spo2: "99%", ecg: "Normal Sinus Rhythm" },
      symptoms: "Post-operative Day-2 right knee arthroscopic ACL reconstruction evaluation. Localized peri-articular edema, controlled post-surgical discomfort.",
      diagnosis: "Status Post Right Knee Arthroscopic ACL Reconstruction • Resolving Hemarthrosis • Satisfactory Graft Tension",
      clinicalNotes: "Portals clean and dry, sutures intact without erythema. Passive knee range of motion 0-60 degrees. Cryotherapy and isometric quadriceps strengthening initiated.",
      prescriptionItems: [
        { med: "Cissus Quadrangularis (Hadjod) 750mg", dosage: "1 Tablet", freq: "Twice Daily (Post-Meal)", duration: "21 Days" },
        { med: "Aceclofenac + Paracetamol (100mg/325mg)", dosage: "1 Tablet", freq: "Twice Daily (Post-Meal)", duration: "7 Days" },
        { med: "Chymoral Forte (Enzyme Anti-edema)", dosage: "1 Tablet", freq: "Three Times Daily (Before Food)", duration: "5 Days" },
      ],
      orderedTests: ["Post-Op Knee X-Ray (AP/Lateral)", "Full Leg Alignment Scan", "Inflammatory Markers (CRP/ESR)"],
    },

    // 4. Upagna — Neurology & Migraine Aura
    "P-1003": {
      vitals: { bp: "114/74 mmHg", pulse: "76 bpm", temp: "98.4 °F", spo2: "99%", ecg: "Normal Sinus Rhythm" },
      symptoms: "Recurrent unilateral throbbing fronto-temporal cephalalgia with severe photophobia, phonophobia, nausea, preceded by scintillating scotoma (visual aura).",
      diagnosis: "Episodic Migraine with Typical Aura • Neuro-Vascular Dysregulation • Vata-Pitta Shiroroga",
      clinicalNotes: "Cranial nerves II-XII completely intact. No focal neurological deficits. Identified triggers include sleep disruption and screen flicker. Initiated neuro-protective adaptogen and abortive triptan protocol.",
      prescriptionItems: [
        { med: "Brahmi (Bacopa Monnieri) 450mg", dosage: "1 Capsule", freq: "Twice Daily (Post-Meal)", duration: "30 Days" },
        { med: "Rizatriptan Benzoate 10mg", dosage: "1 Tablet", freq: "At Onset of Migraine Aura", duration: "As Needed" },
        { med: "Magnesium Glycinate 400mg", dosage: "1 Tablet", freq: "Once Daily (Night)", duration: "30 Days" },
      ],
      orderedTests: ["Brain MRI with Neuro-Angiography", "Routine 32-Channel EEG", "Serum Magnesium & Vitamin B12"],
    },
    upagna: {
      vitals: { bp: "114/74 mmHg", pulse: "76 bpm", temp: "98.4 °F", spo2: "99%", ecg: "Normal Sinus Rhythm" },
      symptoms: "Recurrent unilateral throbbing fronto-temporal cephalalgia with severe photophobia, phonophobia, nausea, preceded by scintillating scotoma (visual aura).",
      diagnosis: "Episodic Migraine with Typical Aura • Neuro-Vascular Dysregulation • Vata-Pitta Shiroroga",
      clinicalNotes: "Cranial nerves II-XII completely intact. No focal neurological deficits. Identified triggers include sleep disruption and screen flicker. Initiated neuro-protective adaptogen and abortive triptan protocol.",
      prescriptionItems: [
        { med: "Brahmi (Bacopa Monnieri) 450mg", dosage: "1 Capsule", freq: "Twice Daily (Post-Meal)", duration: "30 Days" },
        { med: "Rizatriptan Benzoate 10mg", dosage: "1 Tablet", freq: "At Onset of Migraine Aura", duration: "As Needed" },
        { med: "Magnesium Glycinate 400mg", dosage: "1 Tablet", freq: "Once Daily (Night)", duration: "30 Days" },
      ],
      orderedTests: ["Brain MRI with Neuro-Angiography", "Routine 32-Channel EEG", "Serum Magnesium & Vitamin B12"],
    },

    // 5. Koushik — Emergency Cardiac Stabilization
    "P-1004": {
      vitals: { bp: "96/62 mmHg", pulse: "112 bpm", temp: "98.6 °F", spo2: "94%", ecg: "Sinus Tachycardia • Non-specific ST depression" },
      symptoms: "Acute retrosternal heaviness radiating to left shoulder accompanied by diaphoresis and acute lightheadedness following physical exertion.",
      diagnosis: "Acute Coronary Syndrome (NSTEMI Rule-out) • Hypotension • Ashwini Emergency Care",
      clinicalNotes: "Patient stabilized in Emergency Bay 1. IV access secured, dual antiplatelet loading initiated. Continuous hemodynamic monitoring active.",
      prescriptionItems: [
        { med: "Clopidogrel 75mg", dosage: "1 Tablet", freq: "Once Daily (Morning)", duration: "30 Days" },
        { med: "Rosuvastatin 20mg", dosage: "1 Tablet", freq: "Once Daily (Night)", duration: "30 Days" },
        { med: "Isosorbide Mononitrate 30mg", dosage: "1 Tablet", freq: "Once Daily (Morning)", duration: "14 Days" },
      ],
      orderedTests: ["Serial Cardiac Troponin T (0h, 3h)", "Emergency 12-Lead ECG", "Bedside Echocardiography", "Serum Electrolytes"],
    },
    koushik: {
      vitals: { bp: "96/62 mmHg", pulse: "112 bpm", temp: "98.6 °F", spo2: "94%", ecg: "Sinus Tachycardia • Non-specific ST depression" },
      symptoms: "Acute retrosternal heaviness radiating to left shoulder accompanied by diaphoresis and acute lightheadedness following physical exertion.",
      diagnosis: "Acute Coronary Syndrome (NSTEMI Rule-out) • Hypotension • Ashwini Emergency Care",
      clinicalNotes: "Patient stabilized in Emergency Bay 1. IV access secured, dual antiplatelet loading initiated. Continuous hemodynamic monitoring active.",
      prescriptionItems: [
        { med: "Clopidogrel 75mg", dosage: "1 Tablet", freq: "Once Daily (Morning)", duration: "30 Days" },
        { med: "Rosuvastatin 20mg", dosage: "1 Tablet", freq: "Once Daily (Night)", duration: "30 Days" },
        { med: "Isosorbide Mononitrate 30mg", dosage: "1 Tablet", freq: "Once Daily (Morning)", duration: "14 Days" },
      ],
      orderedTests: ["Serial Cardiac Troponin T (0h, 3h)", "Emergency 12-Lead ECG", "Bedside Echocardiography", "Serum Electrolytes"],
    },

    // 6. Nikhitha — Pediatrics & Obstetrics (32-Week Prenatal Care)
    "P-1005": {
      vitals: { bp: "116/72 mmHg", pulse: "80 bpm", temp: "98.6 °F", spo2: "99%", ecg: "Normal Sinus Rhythm" },
      symptoms: "Routine 32-week third-trimester prenatal evaluation. Occasional mild bilateral dependent ankle edema, active fetal movements.",
      diagnosis: "Intrauterine Pregnancy at 32+3 Weeks • Single Live Cephalic Fetus • Normotensive Gravida",
      clinicalNotes: "Fundal height 32 cm. Fetal heart rate 142 bpm regular with good acoustic reactivity. Urine protein negative. Normal fetal kick count verified.",
      prescriptionItems: [
        { med: "Shatavari Kalpa Extract 500mg", dosage: "1 Capsule", freq: "Twice Daily (Post-Meal)", duration: "30 Days" },
        { med: "Ferrous Ascorbate + Folic Acid", dosage: "1 Tablet", freq: "Once Daily (After Lunch)", duration: "60 Days" },
        { med: "Calcium Carbonate 500mg + Vit D3", dosage: "1 Tablet", freq: "Once Daily (After Dinner)", duration: "60 Days" },
      ],
      orderedTests: ["Obstetric Growth & Umbilical Doppler USG", "Complete Hemogram (Hb/Platelets)", "Urine Routine & Microscopic"],
    },
    nikhitha: {
      vitals: { bp: "116/72 mmHg", pulse: "80 bpm", temp: "98.6 °F", spo2: "99%", ecg: "Normal Sinus Rhythm" },
      symptoms: "Routine 32-week third-trimester prenatal evaluation. Occasional mild bilateral dependent ankle edema, active fetal movements.",
      diagnosis: "Intrauterine Pregnancy at 32+3 Weeks • Single Live Cephalic Fetus • Normotensive Gravida",
      clinicalNotes: "Fundal height 32 cm. Fetal heart rate 142 bpm regular with good acoustic reactivity. Urine protein negative. Normal fetal kick count verified.",
      prescriptionItems: [
        { med: "Shatavari Kalpa Extract 500mg", dosage: "1 Capsule", freq: "Twice Daily (Post-Meal)", duration: "30 Days" },
        { med: "Ferrous Ascorbate + Folic Acid", dosage: "1 Tablet", freq: "Once Daily (After Lunch)", duration: "60 Days" },
        { med: "Calcium Carbonate 500mg + Vit D3", dosage: "1 Tablet", freq: "Once Daily (After Dinner)", duration: "60 Days" },
      ],
      orderedTests: ["Obstetric Growth & Umbilical Doppler USG", "Complete Hemogram (Hb/Platelets)", "Urine Routine & Microscopic"],
    },

    // 7. Tejas — Internal Medicine & Pathology (GERD & Dyspepsia)
    "P-1006": {
      vitals: { bp: "126/82 mmHg", pulse: "74 bpm", temp: "98.8 °F", spo2: "98%", ecg: "Normal Sinus Rhythm" },
      symptoms: "Recurrent retrosternal heartburn (pyrosis), postprandial epigastric bloating, and acidic regurgitation aggravated by spicy foods and nocturnal recumbency.",
      diagnosis: "Gastroesophageal Reflux Disease (GERD) Grade 1 • Non-Ulcer Dyspepsia • Pitta Agni Imbalance",
      clinicalNotes: "Epigastrium non-tender on deep palpation. No alarming red flags (no dysphagia, weight loss, or anemia). Advised early dinners, head of bed elevation by 6 inches, and 4-week acid reduction therapy.",
      prescriptionItems: [
        { med: "Shankha Bhasma Compound 250mg", dosage: "1 Capsule", freq: "Twice Daily (Before Meals)", duration: "21 Days" },
        { med: "Pantoprazole Gastro-Resistant 40mg", dosage: "1 Tablet", freq: "Once Daily (30m Before Breakfast)", duration: "28 Days" },
        { med: "Triphala Churna Tablets 500mg", dosage: "2 Tablets", freq: "At Bedtime with Warm Water", duration: "30 Days" },
      ],
      orderedTests: ["Upper GI Video Endoscopy", "H. Pylori Stool Antigen Test", "Liver Function Test (LFT)", "Serum Amylase & Lipase"],
    },
    tejas: {
      vitals: { bp: "126/82 mmHg", pulse: "74 bpm", temp: "98.8 °F", spo2: "98%", ecg: "Normal Sinus Rhythm" },
      symptoms: "Recurrent retrosternal heartburn (pyrosis), postprandial epigastric bloating, and acidic regurgitation aggravated by spicy foods and nocturnal recumbency.",
      diagnosis: "Gastroesophageal Reflux Disease (GERD) Grade 1 • Non-Ulcer Dyspepsia • Pitta Agni Imbalance",
      clinicalNotes: "Epigastrium non-tender on deep palpation. No alarming red flags (no dysphagia, weight loss, or anemia). Advised early dinners, head of bed elevation by 6 inches, and 4-week acid reduction therapy.",
      prescriptionItems: [
        { med: "Shankha Bhasma Compound 250mg", dosage: "1 Capsule", freq: "Twice Daily (Before Meals)", duration: "21 Days" },
        { med: "Pantoprazole Gastro-Resistant 40mg", dosage: "1 Tablet", freq: "Once Daily (30m Before Breakfast)", duration: "28 Days" },
        { med: "Triphala Churna Tablets 500mg", dosage: "2 Tablets", freq: "At Bedtime with Warm Water", duration: "30 Days" },
      ],
      orderedTests: ["Upper GI Video Endoscopy", "H. Pylori Stool Antigen Test", "Liver Function Test (LFT)", "Serum Amylase & Lipase"],
    },

    // 8. Subramhanyam — Pharmacology & Therapeutics (Rejuvenation Monitoring)
    "P-1007": {
      vitals: { bp: "132/84 mmHg", pulse: "70 bpm", temp: "98.4 °F", spo2: "98%", ecg: "Normal Sinus Rhythm" },
      symptoms: "Follow-up for chronic hypertension management and evaluation of therapeutic metalo-mineral formulations under pharmacological monitoring.",
      diagnosis: "Essential Hypertension (Controlled) • Therapeutic Rejuvenation Monitoring • Nagarjuna Pharmacology",
      clinicalNotes: "Renal and liver function biomarkers stable. Blood pressure well-regulated within targets. Continuing therapeutic protocol with dietary supervision.",
      prescriptionItems: [
        { med: "Sarpagandha Ghan Vati 250mg", dosage: "1 Tablet", freq: "Twice Daily (Post-Meal)", duration: "30 Days" },
        { med: "Telmisartan 40mg", dosage: "1 Tablet", freq: "Once Daily (Morning)", duration: "30 Days" },
        { med: "Punarnavadi Kashayam 15ml", dosage: "15 ml with equal warm water", freq: "Twice Daily (Before Food)", duration: "30 Days" },
      ],
      orderedTests: ["Serum Creatinine & Blood Urea", "Electrolytes Panel (Na/K/Cl)", "24-Hour Ambulatory BP Monitoring"],
    },
    subramhanyam: {
      vitals: { bp: "132/84 mmHg", pulse: "70 bpm", temp: "98.4 °F", spo2: "98%", ecg: "Normal Sinus Rhythm" },
      symptoms: "Follow-up for chronic hypertension management and evaluation of therapeutic metalo-mineral formulations under pharmacological monitoring.",
      diagnosis: "Essential Hypertension (Controlled) • Therapeutic Rejuvenation Monitoring • Nagarjuna Pharmacology",
      clinicalNotes: "Renal and liver function biomarkers stable. Blood pressure well-regulated within targets. Continuing therapeutic protocol with dietary supervision.",
      prescriptionItems: [
        { med: "Sarpagandha Ghan Vati 250mg", dosage: "1 Tablet", freq: "Twice Daily (Post-Meal)", duration: "30 Days" },
        { med: "Telmisartan 40mg", dosage: "1 Tablet", freq: "Once Daily (Morning)", duration: "30 Days" },
        { med: "Punarnavadi Kashayam 15ml", dosage: "15 ml with equal warm water", freq: "Twice Daily (Before Food)", duration: "30 Days" },
      ],
      orderedTests: ["Serum Creatinine & Blood Urea", "Electrolytes Panel (Na/K/Cl)", "24-Hour Ambulatory BP Monitoring"],
    },

    // 9. Vishal — Surgical Sciences / Inguinal Hernia Pre-Op
    "P-1008": {
      vitals: { bp: "124/80 mmHg", pulse: "70 bpm", temp: "98.6 °F", spo2: "100%", ecg: "Normal Sinus Rhythm" },
      symptoms: "Pre-operative evaluation for right reducible indirect inguinal hernia. Dull dragging discomfort in groin upon heavy lifting, no irreducible pain.",
      diagnosis: "Uncomplicated Right Indirect Inguinal Hernia • Scheduled for Laparoscopic TEP Hernioplasty",
      clinicalNotes: "Right superficial inguinal ring dilated, expansile cough impulse positive, easily reducible in supine position. No features of incarceration or strangulation. Pre-anesthesia clearance in progress.",
      prescriptionItems: [
        { med: "Kanchnar Guggulu 500mg", dosage: "2 Tablets", freq: "Twice Daily (Post-Meal)", duration: "14 Days" },
        { med: "Stool Softener (Lactulose 10ml)", dosage: "10 ml", freq: "At Bedtime (As Needed)", duration: "7 Days" },
        { med: "Multivitamin & Zinc Rejuvenator", dosage: "1 Capsule", freq: "Once Daily", duration: "30 Days" },
      ],
      orderedTests: ["High-Resolution Inguinal Ultrasound", "Pre-Op Coagulation Screen (PT/INR/APTT)", "Viral Markers (HIV/HBsAg/HCV)", "Chest X-Ray PA View"],
    },
    vishal: {
      vitals: { bp: "124/80 mmHg", pulse: "70 bpm", temp: "98.6 °F", spo2: "100%", ecg: "Normal Sinus Rhythm" },
      symptoms: "Pre-operative evaluation for right reducible indirect inguinal hernia. Dull dragging discomfort in groin upon heavy lifting, no irreducible pain.",
      diagnosis: "Uncomplicated Right Indirect Inguinal Hernia • Scheduled for Laparoscopic TEP Hernioplasty",
      clinicalNotes: "Right superficial inguinal ring dilated, expansile cough impulse positive, easily reducible in supine position. No features of incarceration or strangulation. Pre-anesthesia clearance in progress.",
      prescriptionItems: [
        { med: "Kanchnar Guggulu 500mg", dosage: "2 Tablets", freq: "Twice Daily (Post-Meal)", duration: "14 Days" },
        { med: "Stool Softener (Lactulose 10ml)", dosage: "10 ml", freq: "At Bedtime (As Needed)", duration: "7 Days" },
        { med: "Multivitamin & Zinc Rejuvenator", dosage: "1 Capsule", freq: "Once Daily", duration: "30 Days" },
      ],
      orderedTests: ["High-Resolution Inguinal Ultrasound", "Pre-Op Coagulation Screen (PT/INR/APTT)", "Viral Markers (HIV/HBsAg/HCV)", "Chest X-Ray PA View"],
    },

    // 10. Shashank — Cardiology / Triage Follow-up
    "P-1009": {
      vitals: { bp: "120/78 mmHg", pulse: "74 bpm", temp: "98.6 °F", spo2: "99%", ecg: "Normal Sinus Rhythm" },
      symptoms: "Follow-up review post left lateral ankle inversion sprain sustained during badminton. Pain significantly resolved, mild tenderness on anterior talofibular ligament.",
      diagnosis: "Grade 1 Lateral Ankle Ligament Sprain (Resolving) • Musculoskeletal Recovery",
      clinicalNotes: "Weight bearing full without limp. Anterior drawer test negative. Ankle range of motion 90% restored. Advised proprioceptive wobble board exercises.",
      prescriptionItems: [
        { med: "Yograj Guggulu 500mg", dosage: "1 Tablet", freq: "Twice Daily", duration: "14 Days" },
        { med: "Topical Mahanarayan Pain Oil", dosage: "Gentle Application", freq: "Twice Daily", duration: "14 Days" },
      ],
      orderedTests: ["Ankle Stress Radiograph (AP/Lateral)", "Lower Limb Biomechanical Assessment"],
    },
    shashank: {
      vitals: { bp: "120/78 mmHg", pulse: "74 bpm", temp: "98.6 °F", spo2: "99%", ecg: "Normal Sinus Rhythm" },
      symptoms: "Follow-up review post left lateral ankle inversion sprain sustained during badminton. Pain significantly resolved, mild tenderness on anterior talofibular ligament.",
      diagnosis: "Grade 1 Lateral Ankle Ligament Sprain (Resolving) • Musculoskeletal Recovery",
      clinicalNotes: "Weight bearing full without limp. Anterior drawer test negative. Ankle range of motion 90% restored. Advised proprioceptive wobble board exercises.",
      prescriptionItems: [
        { med: "Yograj Guggulu 500mg", dosage: "1 Tablet", freq: "Twice Daily", duration: "14 Days" },
        { med: "Topical Mahanarayan Pain Oil", dosage: "Gentle Application", freq: "Twice Daily", duration: "14 Days" },
      ],
      orderedTests: ["Ankle Stress Radiograph (AP/Lateral)", "Lower Limb Biomechanical Assessment"],
    },

    // 11. Ganesh — Internal Medicine / General Care
    "P-1010": {
      vitals: { bp: "128/82 mmHg", pulse: "78 bpm", temp: "98.6 °F", spo2: "98%", ecg: "Normal Sinus Rhythm" },
      symptoms: "Periodic general health review and metabolic assessment for dysglycemia and weight management.",
      diagnosis: "Pre-Diabetes (Impaired Fasting Glucose) • Mild Metabolic Overload • Kapha Predominance",
      clinicalNotes: "BMI 26.8 kg/m2. Waist circumference 92 cm. Advised dietary low-glycemic index regimen, elimination of refined sugars, and 45-min daily brisk activity.",
      prescriptionItems: [
        { med: "Nisha Amalaki Powder Compound", dosage: "1 Teaspoon with Warm Water", freq: "Twice Daily (Before Meals)", duration: "30 Days" },
        { med: "Metformin 500mg (Extended Release)", dosage: "1 Tablet", freq: "Once Daily (After Dinner)", duration: "30 Days" },
      ],
      orderedTests: ["HbA1c Glycated Hemoglobin", "Fasting & Postprandial Blood Glucose", "Lipid Profile", "Liver Ultrasound"],
    },
    ganesh: {
      vitals: { bp: "128/82 mmHg", pulse: "78 bpm", temp: "98.6 °F", spo2: "98%", ecg: "Normal Sinus Rhythm" },
      symptoms: "Periodic general health review and metabolic assessment for dysglycemia and weight management.",
      diagnosis: "Pre-Diabetes (Impaired Fasting Glucose) • Mild Metabolic Overload • Kapha Predominance",
      clinicalNotes: "BMI 26.8 kg/m2. Waist circumference 92 cm. Advised dietary low-glycemic index regimen, elimination of refined sugars, and 45-min daily brisk activity.",
      prescriptionItems: [
        { med: "Nisha Amalaki Powder Compound", dosage: "1 Teaspoon with Warm Water", freq: "Twice Daily (Before Meals)", duration: "30 Days" },
        { med: "Metformin 500mg (Extended Release)", dosage: "1 Tablet", freq: "Once Daily (After Dinner)", duration: "30 Days" },
      ],
      orderedTests: ["HbA1c Glycated Hemoglobin", "Fasting & Postprandial Blood Glucose", "Lipid Profile", "Liver Ultrasound"],
    },
  };

  const getPatientProfile = (token: OPDToken, allPatients: Patient[]): PatientClinicalProfile => {
    const pId = token.patientId || "";
    const pName = (token.patientName || "").toLowerCase();

    if (PATIENT_CLINICAL_PROFILES[pId]) return PATIENT_CLINICAL_PROFILES[pId];

    const matched = allPatients.find((p) => p.id === pId || (p as any).mrn === pId);
    if (matched) {
      if (PATIENT_CLINICAL_PROFILES[matched.id]) return PATIENT_CLINICAL_PROFILES[matched.id];
      if (matched.mrn && PATIENT_CLINICAL_PROFILES[matched.mrn]) return PATIENT_CLINICAL_PROFILES[matched.mrn];
      const mName = matched.name.toLowerCase();
      for (const [key, profile] of Object.entries(PATIENT_CLINICAL_PROFILES)) {
        if (mName.includes(key.toLowerCase()) || key.toLowerCase().includes(mName)) {
          return profile;
        }
      }
    }

    for (const [key, profile] of Object.entries(PATIENT_CLINICAL_PROFILES)) {
      if (pName.includes(key.toLowerCase()) || key.toLowerCase().includes(pName)) {
        return profile;
      }
    }

    const dept = (token.department || "").toLowerCase();
    if (dept.includes("surg") || dept.includes("ortho")) {
      return {
        vitals: { bp: "122/80 mmHg", pulse: "74 bpm", temp: "98.6 °F", spo2: "99%", ecg: "Normal Sinus" },
        symptoms: "Surgical and orthopedic evaluation for joint mobility and localized discomfort.",
        diagnosis: "Musculoskeletal Assessment • Post-Injury Evaluation",
        clinicalNotes: "Range of motion intact, no acute neurological compromise. Conservative therapy and imaging indicated.",
        prescriptionItems: [
          { med: "Cissus Quadrangularis 750mg", dosage: "1 Tablet", freq: "Twice Daily", duration: "21 Days" },
          { med: "Paracetamol 650mg", dosage: "1 Tablet", freq: "As Needed for Pain", duration: "5 Days" },
        ],
        orderedTests: ["Digital X-Ray Assessment", "Musculoskeletal Ultrasound"],
      };
    }
    if (dept.includes("neuro")) {
      return {
        vitals: { bp: "116/76 mmHg", pulse: "72 bpm", temp: "98.4 °F", spo2: "99%", ecg: "Normal Sinus" },
        symptoms: "Neurological follow-up for episodic headache and visual sensitivity.",
        diagnosis: "Neuro-Vascular Cephalea • Stress-Induced Tension",
        clinicalNotes: "Cranial nerves normal. Advised lifestyle regularity and adaptogenic therapy.",
        prescriptionItems: [
          { med: "Brahmi 450mg", dosage: "1 Capsule", freq: "Twice Daily", duration: "30 Days" },
          { med: "Magnesium Complex 400mg", dosage: "1 Tablet", freq: "Nightly", duration: "30 Days" },
        ],
        orderedTests: ["Brain MRI Scan", "Routine EEG"],
      };
    }
    if (dept.includes("pediat") || dept.includes("obste") || dept.includes("matern")) {
      return {
        vitals: { bp: "114/72 mmHg", pulse: "82 bpm", temp: "98.6 °F", spo2: "99%", ecg: "Normal Sinus" },
        symptoms: "Routine prenatal and maternal-fetal wellness review.",
        diagnosis: "Prenatal Health Assessment • Stable Maternal Parameters",
        clinicalNotes: "Maternal parameters stable. Fetal heart rate regular. Routine nutritional supplementation continued.",
        prescriptionItems: [
          { med: "Shatavari 500mg", dosage: "1 Capsule", freq: "Twice Daily", duration: "30 Days" },
          { med: "Folic Acid + Iron 100mg", dosage: "1 Tablet", freq: "Once Daily", duration: "60 Days" },
        ],
        orderedTests: ["Obstetric Ultrasound", "Complete Blood Count"],
      };
    }
    if (dept.includes("internal") || dept.includes("patho")) {
      return {
        vitals: { bp: "124/82 mmHg", pulse: "76 bpm", temp: "98.6 °F", spo2: "98%", ecg: "Normal Sinus" },
        symptoms: "Internal medicine consult for dyspepsia and metabolic monitoring.",
        diagnosis: "Metabolic Dyspepsia • Pitta Imbalance",
        clinicalNotes: "Abdomen soft and non-tender. Advised dietary modifications and gastroprotective regimen.",
        prescriptionItems: [
          { med: "Pantoprazole 40mg", dosage: "1 Tablet", freq: "Once Daily Morning", duration: "28 Days" },
          { med: "Triphala 500mg", dosage: "2 Tablets", freq: "Bedtime", duration: "30 Days" },
        ],
        orderedTests: ["Lipid Profile", "Liver Function Test", "Abdominal USG"],
      };
    }

    return {
      vitals: { bp: "120/80 mmHg", pulse: "76 bpm", temp: "98.6 °F", spo2: "99%", ecg: "Normal Sinus Rhythm" },
      symptoms: "General outpatient consultation and clinical evaluation.",
      diagnosis: "General Clinical Review • Stable Hemodynamic State",
      clinicalNotes: "All systemic examinations unremarkable. Advised routine preventive precautions and balanced hydration.",
      prescriptionItems: [
        { med: "Comprehensive Multivitamin Mineral", dosage: "1 Tablet", freq: "Once Daily (Post-Meal)", duration: "30 Days" },
        { med: "Herbal Antioxidant Rejuvenator", dosage: "1 Capsule", freq: "Twice Daily", duration: "30 Days" },
      ],
      orderedTests: ["Complete Hemogram (CBC)", "Routine Biomarker Panel"],
    };
  };

  // ── STATE VARIABLES ──────────────────────────────────────────────────────
  const [bookingData, setBookingData] = useState({
    patientId: patients[0]?.id || "P-1001",
    department: "Cardiology & Integrative Medicine",
    doctorName: "Dr. Dhanvantari",
    doctorId: "DOC-101",
    time: "11:30 AM",
    reason: "Hypertension & Cardiac Follow-up",
  });

  const [vitals, setVitals] = useState({
    bp: "128/84 mmHg",
    pulse: "76 bpm",
    temp: "98.6 °F",
    spo2: "99%",
    ecg: "Normal Sinus Rhythm",
  });

  const [symptoms, setSymptoms] = useState("Sudden chest tightness and high pulse after exertion, mild exertion fatigue.");
  const [diagnosis, setDiagnosis] = useState("Stage 1 Essential Hypertension • Pre-anginal strain • Vata-Pitta Imbalance");
  const [clinicalNotes, setClinicalNotes] = useState("Cardiology OPD consultation completed. Patient advised dietary moderation, lifestyle regularities, and prescription regimen.");
  const [prescriptionItems, setPrescriptionItems] = useState<{ med: string; dosage: string; freq: string; duration: string }[]>([]);
  const [newMed, setNewMed] = useState("");
  const [orderedTests, setOrderedTests] = useState<string[]>([]);
  const [newTest, setNewTest] = useState("");
  const [consultationSaved, setConsultationSaved] = useState(false);
  const [opdSuccess, setOpdSuccess] = useState<string | null>(null);

  // Sync with incoming tokens
  useEffect(() => {
    setTokens(opdTokens);
    if (opdTokens.length > 0 && !activeConsultationToken) {
      const match = opdTokens.find((t) => {
        const docName = typeof t.doctorName === "string" ? t.doctorName : (t as any).doctor?.name || "";
        return docName.includes("Dhanvantari");
      }) || opdTokens[0];
      setActiveConsultationToken(match);
    }
  }, [opdTokens]);

  // Load patient-specific clinical profile and verify isolated storage
  useEffect(() => {
    if (!activeConsultationToken?.patientId) return;
    const patientId = activeConsultationToken.patientId;

    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem(`dronagiri_consultation_${patientId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.vitals) setVitals(parsed.vitals);
          if (parsed.symptoms) setSymptoms(parsed.symptoms);
          if (parsed.diagnosis) setDiagnosis(parsed.diagnosis);
          if (parsed.clinicalNotes) setClinicalNotes(parsed.clinicalNotes);
          if (Array.isArray(parsed.prescriptionItems) && parsed.prescriptionItems.length > 0) {
            setPrescriptionItems(parsed.prescriptionItems);
          }
          if (Array.isArray(parsed.orderedTests) && parsed.orderedTests.length > 0) {
            setOrderedTests(parsed.orderedTests);
          }
        } else {
          // Fall back to the isolated clinical profile for this patient
          const profile = getPatientProfile(activeConsultationToken, patients);
          setVitals(profile.vitals);
          setSymptoms(profile.symptoms);
          setDiagnosis(profile.diagnosis);
          setClinicalNotes(profile.clinicalNotes);
          setPrescriptionItems(profile.prescriptionItems);
          setOrderedTests(profile.orderedTests);

          // Seed isolated draft into storage immediately
          localStorage.setItem(
            `dronagiri_consultation_${patientId}`,
            JSON.stringify({
              vitals: profile.vitals,
              symptoms: profile.symptoms,
              diagnosis: profile.diagnosis,
              clinicalNotes: profile.clinicalNotes,
              prescriptionItems: profile.prescriptionItems,
              orderedTests: profile.orderedTests,
            })
          );
        }
      } catch (e) {
        console.warn("Error restoring consultation:", e);
      }
    }

    // Load any verified server prescriptions for this specific patient
    async function loadServerPrescriptions() {
      try {
        const res = await fetch(`/api/prescriptions?patientId=${patientId}`, {
          headers: getAuthHeaders(),
          credentials: "same-origin",
        });
        if (res.ok) {
          const json = await res.json();
          if (json.prescriptions && Array.isArray(json.prescriptions) && json.prescriptions.length > 0) {
            const serverItems: { med: string; dosage: string; freq: string; duration: string }[] = [];
            json.prescriptions.forEach((rx: any) => {
              if (rx.items && Array.isArray(rx.items)) {
                rx.items.forEach((item: any) => {
                  serverItems.push({
                    med: item.medicineName,
                    dosage: item.dosage || "1 Tablet",
                    freq: item.frequency || "Once Daily",
                    duration: item.duration || "14 Days",
                  });
                });
              }
            });
            if (serverItems.length > 0) {
              setPrescriptionItems((prev) => {
                const existing = new Set(prev.map((p) => p.med.toLowerCase()));
                const toAdd = serverItems.filter((i) => !existing.has(i.med.toLowerCase()));
                const merged = [...prev, ...toAdd];
                try {
                  localStorage.setItem(
                    `dronagiri_consultation_${patientId}`,
                    JSON.stringify({
                      vitals,
                      symptoms,
                      diagnosis,
                      clinicalNotes,
                      prescriptionItems: merged,
                      orderedTests,
                    })
                  );
                } catch (e) {}
                return merged;
              });
            }
          }
        }
      } catch (e) {
        console.warn("Could not load prescriptions from server:", e);
      }
    }

    loadServerPrescriptions();
  }, [activeConsultationToken?.patientId]);

  // Isolated auto-save: saves specifically to this patient's key
  useEffect(() => {
    if (!activeConsultationToken?.patientId || typeof window === "undefined") return;
    const patientId = activeConsultationToken.patientId;
    try {
      localStorage.setItem(
        `dronagiri_consultation_${patientId}`,
        JSON.stringify({
          vitals,
          symptoms,
          diagnosis,
          clinicalNotes,
          prescriptionItems,
          orderedTests,
        })
      );
    } catch (e) {}
  }, [vitals, symptoms, diagnosis, clinicalNotes, prescriptionItems, orderedTests, activeConsultationToken?.patientId]);

  const getDocName = (t: OPDToken) => {
    if (typeof t.doctorName === "string" && t.doctorName) return t.doctorName;
    if (typeof (t as any).doctor === "object") return (t as any).doctor?.name || "Dr. Dhanvantari";
    return (t as any).doctor || "Dr. Dhanvantari";
  };

  const getPatientName = (t: OPDToken) => {
    if (typeof t.patientName === "string" && t.patientName) return t.patientName;
    if (typeof (t as any).patient === "object") return (t as any).patient?.name || "Patient";
    return (t as any).patient || "Patient";
  };

  const getDept = (t: OPDToken) => {
    if (typeof t.department === "string" && t.department) return t.department;
    if (typeof (t as any).doctor?.department === "object") return (t as any).doctor?.department?.name || "Cardiology";
    return "Cardiology";
  };

  const filteredTokens = tokens.filter((t) => {
    if (filterMode === "dhanvantari") {
      const dName = getDocName(t);
      const dept = getDept(t);
      return dName.includes("Dhanvantari") || dept.includes("Cardiology");
    }
    return true;
  });

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    const selPatient = patients.find((p) => p.id === bookingData.patientId) || patients[0] || {
      id: "P-1001",
      name: "Patient",
      age: 45,
      gender: "Male",
    };

    const tokenNum = tokens.length + 101;
    const newT: OPDToken = {
      tokenNo: tokenNum,
      patientId: selPatient.id,
      patientName: selPatient.name,
      age: selPatient.age,
      gender: selPatient.gender,
      doctorName: bookingData.doctorName,
      department: bookingData.department,
      appointmentTime: bookingData.time,
      status: "Waiting",
      avgWaitMins: 15,
    };

    try {
      await fetch("/api/appointments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        credentials: "same-origin",
        body: JSON.stringify({
          patientId: selPatient.id,
          doctorId: bookingData.doctorId || "DOC-101",
          appointmentDate: new Date().toISOString(),
          appointmentTime: bookingData.time,
          type: "Walk-in",
          notes: bookingData.reason,
        }),
      });
    } catch (err) {
      console.warn("Failed to persist appointment:", err);
    }

    const updated = [newT, ...tokens];
    setTokens(updated);
    onAddToken(newT);
    if (onUpdateTokens) onUpdateTokens(updated);
    setActiveConsultationToken(newT);
    setShowBookingModal(false);
    setOpdSuccess(`Token #${newT.tokenNo} issued for ${newT.patientName} with ${newT.doctorName} (${newT.department}).`);
  };

  const handleAddMedication = () => {
    if (!newMed.trim()) return;
    const item = { med: newMed.trim(), dosage: "1 Tablet", freq: "Twice Daily", duration: "14 Days" };
    setPrescriptionItems((prev) => [...prev, item]);
    setNewMed("");
  };

  const handleRemoveMedication = (index: number) => {
    setPrescriptionItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddTest = () => {
    if (!newTest.trim()) return;
    if (!orderedTests.includes(newTest.trim())) {
      setOrderedTests((prev) => [...prev, newTest.trim()]);
    }
    setNewTest("");
  };

  const handleRemoveTest = (testToRemove: string) => {
    setOrderedTests((prev) => prev.filter((t) => t !== testToRemove));
  };

  const handleFinishConsultation = async () => {
    if (!activeConsultationToken) return;

    const currentDoc = getDoctorSuite(getDocName(activeConsultationToken));

    // Issue Prescription to database via REST API
    if (prescriptionItems.length > 0) {
      try {
        await fetch("/api/prescriptions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          credentials: "same-origin",
          body: JSON.stringify({
            patientId: activeConsultationToken.patientId,
            doctorId: currentDoc.id || "DOC-101",
            notes: clinicalNotes || diagnosis || `${currentDoc.name} OPD Prescription`,
            items: prescriptionItems.map((item) => ({
              medicineName: item.med,
              dosage: item.dosage,
              frequency: item.freq,
              duration: item.duration,
              quantity: 10,
            })),
          }),
        });
      } catch (e) {
        console.warn("Error creating prescription in database:", e);
      }
    }

    // Update appointment status to Completed in API
    try {
      await fetch("/api/appointments", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        credentials: "same-origin",
        body: JSON.stringify({
          tokenNo: activeConsultationToken.tokenNo,
          status: "Completed",
        }),
      });
    } catch (e) {
      console.warn("Error updating appointment status:", e);
    }

    const updated = tokens.map((t) =>
      t.tokenNo === activeConsultationToken.tokenNo ? { ...t, status: "Completed" as const } : t
    );
    setTokens(updated);
    if (onUpdateTokens) onUpdateTokens(updated);
    setActiveConsultationToken((prev) => (prev ? { ...prev, status: "Completed" } : null));
    setConsultationSaved(true);

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(
          `dronagiri_consultation_${activeConsultationToken.patientId}`,
          JSON.stringify({
            vitals,
            symptoms,
            diagnosis,
            clinicalNotes,
            prescriptionItems,
            orderedTests,
            status: "Completed",
          })
        );
      } catch (e) {}
    }
    setOpdSuccess(`Consultation finalized for Token #${activeConsultationToken.tokenNo} (${getPatientName(activeConsultationToken)}) by ${currentDoc.name}!`);
    setTimeout(() => setConsultationSaved(false), 5000);
  };

  // Active Doctor Information for dynamic suite rendering
  const activeDoctorSuite = activeConsultationToken
    ? getDoctorSuite(getDocName(activeConsultationToken))
    : DOCTOR_SUITES.dhanvantari;

  return (
    <div className="space-y-6 text-[#111]">
      {/* ── CLINICAL SUITE BANNER ────────────────────────────────────────── */}
      <div className="bg-[#F0EEE8] p-6 rounded-2xl border border-black/10 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border border-black/10 shadow-xs bg-white">
            <img src={activeDoctorSuite.avatar} alt={activeDoctorSuite.name} className="w-full h-full object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-[#111]">
                {activeDoctorSuite.name}&apos;s Clinical Suite
              </h2>
              <span className="text-[10px] font-pixel px-2 py-0.5 rounded-md bg-[#111] text-white uppercase">
                {activeDoctorSuite.roomBadge}
              </span>
            </div>
            <p className="text-xs text-black/50 mt-0.5">
              {activeDoctorSuite.department} • {activeDoctorSuite.title} • Active Duty
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex bg-white/70 p-1 rounded-xl border border-black/10 text-xs font-semibold">
            <button
              onClick={() => setFilterMode("dhanvantari")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterMode === "dhanvantari"
                  ? "bg-[#111] text-white shadow-xs"
                  : "text-black/60 hover:text-[#111]"
              }`}
            >
              Cardiology Queue ({tokens.filter((t) => getDocName(t).includes("Dhanvantari") || getDept(t).includes("Cardiology")).length})
            </button>
            <button
              onClick={() => setFilterMode("all")}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterMode === "all"
                  ? "bg-[#111] text-white shadow-xs"
                  : "text-black/60 hover:text-[#111]"
              }`}
            >
              All Hospital OPD ({tokens.length})
            </button>
          </div>

          <button
            onClick={() => setShowBookingModal(true)}
            className="px-4 py-2 bg-[#111] hover:bg-[#333] text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Patient Token</span>
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {opdSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-2xl text-xs font-semibold flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>{opdSuccess}</span>
          </div>
          <button onClick={() => setOpdSuccess(null)}><X className="w-4 h-4 text-emerald-400" /></button>
        </div>
      )}

      {/* ── MAIN CLINICAL GRID ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: OPD Queue */}
        <div className="lg:col-span-5 bg-[#F0EEE8] rounded-2xl border border-black/10 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-[#111]">
                {filterMode === "dhanvantari" ? "Cardiology OPD Queue" : "All Hospital OPD Queue"}
              </h3>
              <p className="text-[11px] text-black/40">Select any patient token to switch consultation suite</p>
            </div>
            <span className="text-xs text-black/50 font-mono font-bold bg-white/80 px-2 py-0.5 rounded-md border border-black/5">
              {filteredTokens.length} in Queue
            </span>
          </div>

          <div className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
            {filteredTokens.length === 0 ? (
              <div className="text-center py-12 text-black/40 text-xs">
                No patients in queue. Click &quot;Add Patient Token&quot; to issue a new OPD token.
              </div>
            ) : (
              filteredTokens.map((t) => {
                const isSelected = activeConsultationToken?.tokenNo === t.tokenNo;
                const pName = getPatientName(t);
                const dName = getDocName(t);
                return (
                  <div
                    key={t.tokenNo}
                    onClick={() => setActiveConsultationToken(t)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "bg-white border-black/40 ring-2 ring-black/10 shadow-sm"
                        : "bg-white/70 border-black/10 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-lg bg-[#111] text-white text-xs font-bold font-mono flex items-center justify-center">
                          #{t.tokenNo}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-[#111]">{pName}</div>
                          <div className="text-[10px] text-black/50">
                            {t.age}Y / {t.gender} • ID: {t.patientId} • {dName}
                          </div>
                        </div>
                      </div>

                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          t.status === "Serving"
                            ? "bg-[#111] text-white"
                            : t.status === "Waiting"
                            ? "bg-amber-100/90 text-amber-900 border border-amber-300"
                            : "bg-emerald-100/90 text-emerald-900 border border-emerald-300"
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-black/50 mt-2 pt-2 border-t border-black/5">
                      <div className="flex items-center gap-1 font-medium">
                        <Clock className="w-3 h-3 text-black/40" />
                        <span>{t.appointmentTime} (est. {t.avgWaitMins || 10}m)</span>
                      </div>
                      <span className="text-[#111] font-semibold flex items-center gap-0.5">
                        {isSelected ? "Consulting Active" : "Open Suite →"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Active Clinical Suite (Differ by Doctor & Patient) */}
        <div className="lg:col-span-7 bg-[#F0EEE8] rounded-2xl border border-black/10 p-6 shadow-xs flex flex-col justify-between">
          <div>
            {/* Suite Header */}
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-black/10">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#111] text-white flex items-center justify-center shrink-0">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#111]">{activeDoctorSuite.suiteName}</h3>
                  <p className="text-[11px] text-black/50">{activeDoctorSuite.name} ({activeDoctorSuite.id}) • {activeDoctorSuite.roomBadge}</p>
                </div>
              </div>

              {activeConsultationToken && (
                <span className="px-3 py-1 bg-[#111] text-white rounded-full text-xs font-mono font-bold">
                  Token #{activeConsultationToken.tokenNo}
                </span>
              )}
            </div>

            {activeConsultationToken ? (
              <div className="space-y-5">
                {/* Patient Summary Header Box */}
                <div className="p-4 bg-white/90 rounded-xl border border-black/10 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-pixel text-[9px] text-black/40 uppercase tracking-wider block">Patient Profile</span>
                    <div className="font-bold text-[#111] text-sm mt-0.5">{getPatientName(activeConsultationToken)}</div>
                    <div className="text-black/50 font-medium text-[11px]">
                      {activeConsultationToken.age}Y / {activeConsultationToken.gender} • MRN: {activeConsultationToken.patientId}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-pixel text-[9px] text-black/40 uppercase tracking-wider block">Attending Consultant</span>
                    <div className="font-bold text-[#111] mt-0.5">{activeDoctorSuite.name}</div>
                    <div className="text-[10px] text-emerald-800 font-semibold flex items-center justify-end gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      {activeDoctorSuite.roomBadge}
                    </div>
                  </div>
                </div>

                {/* Vitals Log */}
                <div>
                  <label className="font-pixel text-[10px] tracking-widest text-black/40 uppercase mb-2 block">
                    Cardiovascular &amp; Vital Biomarkers
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
                    <div className="bg-white/85 p-2.5 rounded-xl border border-black/10">
                      <span className="text-[10px] text-black/40 uppercase font-bold">Blood Pressure</span>
                      <input
                        type="text"
                        value={vitals.bp}
                        onChange={(e) => setVitals({ ...vitals, bp: e.target.value })}
                        className="w-full font-bold text-[#111] bg-transparent outline-none mt-0.5"
                      />
                    </div>
                    <div className="bg-white/85 p-2.5 rounded-xl border border-black/10">
                      <span className="text-[10px] text-black/40 uppercase font-bold">Heart Rate</span>
                      <input
                        type="text"
                        value={vitals.pulse}
                        onChange={(e) => setVitals({ ...vitals, pulse: e.target.value })}
                        className="w-full font-bold text-[#111] bg-transparent outline-none mt-0.5"
                      />
                    </div>
                    <div className="bg-white/85 p-2.5 rounded-xl border border-black/10">
                      <span className="text-[10px] text-black/40 uppercase font-bold">SpO2 Oxygen</span>
                      <input
                        type="text"
                        value={vitals.spo2}
                        onChange={(e) => setVitals({ ...vitals, spo2: e.target.value })}
                        className="w-full font-bold text-[#111] bg-transparent outline-none mt-0.5"
                      />
                    </div>
                    <div className="bg-white/85 p-2.5 rounded-xl border border-black/10">
                      <span className="text-[10px] text-black/40 uppercase font-bold">Temperature</span>
                      <input
                        type="text"
                        value={vitals.temp}
                        onChange={(e) => setVitals({ ...vitals, temp: e.target.value })}
                        className="w-full font-bold text-[#111] bg-transparent outline-none mt-0.5"
                      />
                    </div>
                    <div className="bg-white/85 p-2.5 rounded-xl border border-black/10 col-span-2 sm:col-span-1">
                      <span className="text-[10px] text-black/40 uppercase font-bold">ECG Rhythm</span>
                      <input
                        type="text"
                        value={vitals.ecg}
                        onChange={(e) => setVitals({ ...vitals, ecg: e.target.value })}
                        className="w-full font-bold text-emerald-800 text-[11px] bg-transparent outline-none mt-0.5"
                      />
                    </div>
                  </div>
                </div>

                {/* Symptoms & Clinical Diagnosis */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="block text-xs font-semibold text-[#111] mb-1">Chief Clinical Complaint</label>
                    <textarea
                      value={symptoms}
                      onChange={(e) => setSymptoms(e.target.value)}
                      className="w-full p-2.5 border border-black/10 rounded-xl outline-none focus:border-black/30 bg-white h-20 text-xs leading-relaxed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#111] mb-1">Clinical Assessment &amp; Diagnosis</label>
                    <textarea
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      className="w-full p-2.5 border border-black/10 rounded-xl outline-none focus:border-black/30 bg-white h-20 text-xs leading-relaxed font-medium"
                    />
                  </div>
                </div>

                {/* e-Prescription Suite */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="font-pixel text-[10px] tracking-widest text-black/40 uppercase flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5 text-black/70" />
                      <span>{activeDoctorSuite.rxTitle}</span>
                    </label>
                    <span className="text-[10px] text-black/40">{activeDoctorSuite.rxSubtitle}</span>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {prescriptionItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 bg-white/90 rounded-xl border border-black/10 text-xs"
                      >
                        <div>
                          <span className="font-bold text-[#111]">{item.med}</span>
                          <span className="text-black/50 ml-2">
                            ({item.dosage} • {item.freq} • {item.duration})
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono text-emerald-800 font-semibold">Verified Rx</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveMedication(idx)}
                            className="text-black/30 hover:text-rose-600 p-0.5 rounded transition-colors"
                            title="Remove medication"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder={`Add Rx for ${getPatientName(activeConsultationToken)} (e.g. Atorvastatin 20mg, Arjuna Bark 500mg)`}
                      value={newMed}
                      onChange={(e) => setNewMed(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddMedication();
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-black/10 rounded-xl text-xs outline-none bg-white placeholder:text-black/30"
                    />
                    <button
                      type="button"
                      onClick={handleAddMedication}
                      className="px-4 py-2 bg-[#111] text-white text-xs font-bold rounded-xl hover:bg-[#333] transition-colors"
                    >
                      Add Rx Item
                    </button>
                  </div>
                </div>

                {/* Ordered Diagnostic Tests */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-pixel text-[10px] tracking-widest text-black/40 uppercase block">
                      Diagnostic Lab &amp; Imaging Orders
                    </label>
                    <span className="text-[10px] text-black/40">{orderedTests.length} Tests Ordered</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {orderedTests.map((test, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-white/90 border border-black/10 rounded-xl text-xs font-medium text-[#111] flex items-center gap-1.5"
                      >
                        <Activity className="w-3 h-3 text-emerald-700" />
                        <span>{test}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveTest(test)}
                          className="text-black/30 hover:text-rose-600 ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>

                  <div className="flex gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Order new diagnostic test (e.g. 2D Echocardiogram, Knee MRI, Brain CT)"
                      value={newTest}
                      onChange={(e) => setNewTest(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddTest();
                        }
                      }}
                      className="flex-1 px-3 py-1.5 border border-black/10 rounded-xl text-xs outline-none bg-white placeholder:text-black/30"
                    />
                    <button
                      type="button"
                      onClick={handleAddTest}
                      className="px-3 py-1.5 bg-black/5 hover:bg-black/10 text-[#111] text-xs font-semibold rounded-xl transition-colors"
                    >
                      + Order Test
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-24 text-black/40 text-xs">
                Select an OPD Token on the left to begin consultation
              </div>
            )}
          </div>

          {/* Consultation Action Footer */}
          {activeConsultationToken && (
            <div className="pt-6 mt-6 border-t border-black/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-[11px] text-black/50">
                Digitally Authenticated: <strong>{activeDoctorSuite.signature}</strong>
              </div>

              <div className="flex items-center gap-3">
                {consultationSaved && (
                  <span className="text-xs text-emerald-800 font-semibold flex items-center gap-1">
                    <Check className="w-4 h-4" /> Consultation Finalized &amp; Dispatched!
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleFinishConsultation}
                  className="px-5 py-2.5 bg-[#111] hover:bg-[#333] text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
                >
                  <FileCheck className="w-4 h-4" />
                  <span>Complete Consultation &amp; Sign Rx</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal — Multi-Doctor & Multi-Patient OPD Token Generation */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#F0EEE8] rounded-3xl border border-black/10 shadow-2xl w-full max-w-lg overflow-hidden p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-[#111]">Generate OPD Token</h3>
              <button onClick={() => setShowBookingModal(false)} className="text-black/40 hover:text-black font-bold">✕</button>
            </div>
            <form onSubmit={handleCreateBooking} className="space-y-3 text-xs">
              <div>
                <label className="block text-black/60 mb-1">Select Patient</label>
                <select
                  value={bookingData.patientId}
                  onChange={(e) => {
                    const selId = e.target.value;
                    const p = patients.find((pat) => pat.id === selId);
                    setBookingData((prev) => ({
                      ...prev,
                      patientId: selId,
                      reason: p?.currentConditions?.[0] || p?.department ? `${p.department} Consultation` : prev.reason,
                    }));
                  }}
                  className="w-full p-2.5 border border-black/10 rounded-xl outline-none bg-white font-semibold"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.id} • {p.age}Y/{p.gender})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-black/60 mb-1">Select Attending Physician</label>
                <select
                  value={bookingData.doctorId}
                  onChange={(e) => {
                    const selDocId = e.target.value;
                    const suite = getDoctorSuite(selDocId);
                    setBookingData((prev) => ({
                      ...prev,
                      doctorId: suite.id,
                      doctorName: suite.name,
                      department: suite.department,
                    }));
                  }}
                  className="w-full p-2.5 border border-black/10 rounded-xl outline-none bg-white font-semibold"
                >
                  <option value="DOC-101">Dr. Dhanvantari — Cardiology &amp; Integrative Medicine</option>
                  <option value="DOC-103">Dr. Sushruta — Surgical Sciences &amp; Orthopedics</option>
                  <option value="DOC-104">Dr. Charaka — Internal Medicine &amp; Pathology</option>
                  <option value="DOC-105">Dr. Jivaka — Neurology &amp; Diagnostics</option>
                  <option value="DOC-107">Dr. Kashyapa — Pediatrics &amp; Obstetrics</option>
                  <option value="DOC-102">Dr. Ashwini Kumaras — Emergency &amp; Critical Care</option>
                  <option value="DOC-106">Dr. Nagarjuna — Pharmacology &amp; Therapeutics</option>
                </select>
              </div>

              <div>
                <label className="block text-black/60 mb-1">Clinical Department &amp; Suite</label>
                <input
                  type="text"
                  value={bookingData.department}
                  readOnly
                  className="w-full p-2.5 border border-black/10 rounded-xl outline-none bg-black/5 text-black/60 font-semibold"
                />
              </div>

              <div>
                <label className="block text-black/60 mb-1">Chief Reason for Consultation</label>
                <input
                  type="text"
                  value={bookingData.reason}
                  onChange={(e) => setBookingData({ ...bookingData, reason: e.target.value })}
                  className="w-full p-2.5 border border-black/10 rounded-xl outline-none bg-white font-medium"
                  placeholder="e.g. Chest pain follow up, Post-op evaluation, Migraine aura"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBookingModal(false)}
                  className="px-4 py-2 bg-black/5 rounded-xl font-semibold text-xs text-black/70 hover:bg-black/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#111] text-white rounded-xl text-xs font-bold hover:bg-[#333]"
                >
                  Generate Token &amp; Dispatch to Suite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
