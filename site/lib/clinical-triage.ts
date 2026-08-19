export interface TriageResult {
  department: string;
  doctorId: string;
  doctorName: string;
  doctorAvatar: string;
  specialization: string;
  urgency: "Routine" | "Priority" | "Emergency";
  estimatedWaitMins: number;
  clinicalRationale: string;
  matchedKeywords: string[];
}

export function matchSymptomsToDoctor(symptomsText: string): TriageResult {
  const query = symptomsText.toLowerCase();

  // 1. Emergency & Trauma -> Dr. Ashwini Kumaras
  if (
    query.includes("accident") ||
    query.includes("severe bleed") ||
    query.includes("unconscious") ||
    query.includes("trauma") ||
    query.includes("collapsed") ||
    query.includes("fracture open")
  ) {
    return {
      department: "Emergency & Critical Care",
      doctorId: "DOC-102",
      doctorName: "Dr. Ashwini Kumaras",
      doctorAvatar: "/images/doctors/dr-ashwini-kumaras.png",
      specialization: "Chiefs of Clinical Operations & Level-1 Trauma Resuscitation",
      urgency: "Emergency",
      estimatedWaitMins: 0,
      clinicalRationale: "Acute trauma/critical condition identified. Immediate Level-1 triage and resuscitation required.",
      matchedKeywords: ["trauma", "acute critical care", "resuscitation"],
    };
  }

  // 2. Cardiology & Integrative Medicine -> Dr. Dhanvantari
  if (
    query.includes("chest") ||
    query.includes("heart") ||
    query.includes("palpitation") ||
    query.includes("breath") ||
    query.includes("hypertension") ||
    query.includes("cardiac") ||
    query.includes("bp high") ||
    query.includes("dizziness")
  ) {
    return {
      department: "Cardiology",
      doctorId: "DOC-101",
      doctorName: "Dr. Dhanvantari",
      doctorAvatar: "/images/doctors/dr-dhanvantari.jpg",
      specialization: "Chief Medical Officer & Divine Healer (Integrative Medicine & Cardiology)",
      urgency: "Priority",
      estimatedWaitMins: 12,
      clinicalRationale: "Cardiovascular and vital biomarker symptoms detected. Dhanvantari integrative cardiac protocol recommended.",
      matchedKeywords: ["cardiovascular", "hypertension", "integrative cardiology"],
    };
  }

  // 3. Surgical Sciences & Orthopedics -> Dr. Sushruta
  if (
    query.includes("knee") ||
    query.includes("joint") ||
    query.includes("ligament") ||
    query.includes("bone") ||
    query.includes("sprain") ||
    query.includes("surgery") ||
    query.includes("fracture") ||
    query.includes("arthroscopy") ||
    query.includes("plastic") ||
    query.includes("reconstruct")
  ) {
    return {
      department: "Surgical Sciences",
      doctorId: "DOC-103",
      doctorName: "Dr. Sushruta",
      doctorAvatar: "/images/doctors/dr-sushruta.jpg",
      specialization: "Father of Surgery & Master of Reconstructive Sciences",
      urgency: "Priority",
      estimatedWaitMins: 18,
      clinicalRationale: "Musculoskeletal or reconstructive condition identified. Sushruta surgical evaluation indicated.",
      matchedKeywords: ["orthopedic", "ligament", "reconstructive surgery"],
    };
  }

  // 4. Neurology & Diagnostics -> Dr. Jivaka
  if (
    query.includes("headache") ||
    query.includes("migraine") ||
    query.includes("nerve") ||
    query.includes("numbness") ||
    query.includes("seizure") ||
    query.includes("cranial") ||
    query.includes("spine") ||
    query.includes("paralysis") ||
    query.includes("pulse")
  ) {
    return {
      department: "Neurology & Diagnostics",
      doctorId: "DOC-105",
      doctorName: "Dr. Jivaka",
      doctorAvatar: "/images/doctors/dr-jivaka.png",
      specialization: "Head of Neuro-Surgery, Pulse Diagnostics & Royal Physician",
      urgency: "Routine",
      estimatedWaitMins: 20,
      clinicalRationale: "Neurological or cranial symptoms detected. Jivaka pulse diagnostics and neuro-vascular assessment advised.",
      matchedKeywords: ["neurology", "pulse diagnostics", "neuro-vascular"],
    };
  }

  // 5. Pediatrics & Obstetrics -> Dr. Kashyapa
  if (
    query.includes("child") ||
    query.includes("baby") ||
    query.includes("infant") ||
    query.includes("pregnant") ||
    query.includes("prenatal") ||
    query.includes("pediatric") ||
    query.includes("maternal") ||
    query.includes("delivery")
  ) {
    return {
      department: "Pediatrics & Obstetrics",
      doctorId: "DOC-107",
      doctorName: "Dr. Kashyapa",
      doctorAvatar: "/images/doctors/dr-kashyapa.png",
      specialization: "Master of Pediatrics, Obstetrics & Child Rejuvenation",
      urgency: "Routine",
      estimatedWaitMins: 25,
      clinicalRationale: "Maternal or pediatric health parameters identified. Kashyapa neonatal and maternal care pathway assigned.",
      matchedKeywords: ["pediatrics", "obstetrics", "maternal care"],
    };
  }

  // 6. Pharmacology & Therapeutics -> Dr. Nagarjuna
  if (
    query.includes("drug") ||
    query.includes("poison") ||
    query.includes("toxic") ||
    query.includes("herbal") ||
    query.includes("reaction") ||
    query.includes("metallurgy") ||
    query.includes("dosage") ||
    query.includes("interaction")
  ) {
    return {
      department: "Pharmacology & Therapeutics",
      doctorId: "DOC-106",
      doctorName: "Dr. Nagarjuna",
      doctorAvatar: "/images/doctors/dr-nagarjuna.png",
      specialization: "Chief Pharmacologist, Metallurgist & Critical Therapeutics",
      urgency: "Priority",
      estimatedWaitMins: 15,
      clinicalRationale: "Therapeutic reaction or pharmacological formulation consultation requested. Nagarjuna clinical pharmacy assigned.",
      matchedKeywords: ["pharmacology", "toxicology", "formulations"],
    };
  }

  // 7. Internal Medicine & Pathology -> Dr. Charaka (Default Fallback)
  return {
    department: "Internal Medicine & Pathology",
    doctorId: "DOC-104",
    doctorName: "Dr. Charaka",
    doctorAvatar: "/images/doctors/dr-charaka.png",
    specialization: "Master of Internal Medicine, Diagnostics & Physiology",
    urgency: "Routine",
    estimatedWaitMins: 20,
    clinicalRationale: "Constitutional and internal physiological assessment indicated. Charaka comprehensive metabolic consultation assigned.",
    matchedKeywords: ["internal medicine", "physiology", "metabolism"],
  };
}
