export const CLINIC_COLORS = {
  Consulting: {
    bg: "bg-[#002855]",
    text: "text-white",
    border: "border-[#002855]",
    hex: "#002855",
  },
  Accounting: {
    bg: "bg-[#0077B6]",
    text: "text-white",
    border: "border-[#0077B6]",
    hex: "#0077B6",
  },
  "Resource Acquisition": {
    bg: "bg-[#00B4D8]",
    text: "text-white",
    border: "border-[#00B4D8]",
    hex: "#00B4D8",
  },
  Funding: {
    bg: "bg-[#00B4D8]",
    text: "text-white",
    border: "border-[#00B4D8]",
    hex: "#00B4D8",
  },
  Marketing: {
    bg: "bg-[#0096C7]",
    text: "text-white",
    border: "border-[#0096C7]",
    hex: "#0096C7",
  },
} as const

export function getClinicColor(clinic: string | undefined) {
  if (!clinic) return CLINIC_COLORS.Consulting

  // Normalize clinic name
  const normalized = clinic.trim()

  // Check for exact matches first
  if (normalized in CLINIC_COLORS) {
    return CLINIC_COLORS[normalized as keyof typeof CLINIC_COLORS]
  }

  // Check for partial matches
  if (normalized.toLowerCase().includes("consult")) return CLINIC_COLORS.Consulting
  if (normalized.toLowerCase().includes("account")) return CLINIC_COLORS.Accounting
  if (normalized.toLowerCase().includes("resource") || normalized.toLowerCase().includes("fund"))
    return CLINIC_COLORS.Funding
  if (normalized.toLowerCase().includes("market")) return CLINIC_COLORS.Marketing

  // Default to Consulting color
  return CLINIC_COLORS.Consulting
}
