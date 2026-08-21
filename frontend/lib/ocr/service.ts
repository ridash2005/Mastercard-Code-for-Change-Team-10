export type OcrFields = {
  name: string;
  email: string;
  college: string;
  programme: string;
};

/**
 * Mock OCR. Replace `extractFromDocument` with a real OCR API later.
 * Never sent to a third party in this demo.
 */
export async function extractFromDocument(file: File): Promise<OcrFields> {
  await new Promise((r) => setTimeout(r, 1200));
  const hint = file.name.toLowerCase();
  if (hint.includes("isha")) {
    return {
      name: "Isha Verma",
      email: "isha.verma@college.edu",
      college: "Fergusson College, Pune",
      programme: "Katalyst Fellows 2026",
    };
  }
  return {
    name: "Ananya Munshi",
    email: "ananya.munshi@college.edu",
    college: "St. Xavier's College, Mumbai",
    programme: "Katalyst Fellows 2026",
  };
}
