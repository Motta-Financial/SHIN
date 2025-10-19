export interface ClientColor {
  name: string
  hex: string
  rgb: string
  tailwind: string
}

const clientColors: Record<string, ClientColor> = {
  REWRITE: {
    name: "REWRITE",
    hex: "#8B4513",
    rgb: "139, 69, 19",
    tailwind: "bg-[#8B4513]",
  },
  "Serene Cycle": {
    name: "Serene Cycle",
    hex: "#4A90E2",
    rgb: "74, 144, 226",
    tailwind: "bg-[#4A90E2]",
  },
  "Crown Legends": {
    name: "Crown Legends",
    hex: "#9B59B6",
    rgb: "155, 89, 182",
    tailwind: "bg-[#9B59B6]",
  },
  "Intriguing Hair": {
    name: "Intriguing Hair",
    hex: "#E91E63",
    rgb: "233, 30, 99",
    tailwind: "bg-[#E91E63]",
  },
  "City of Malden": {
    name: "City of Malden",
    hex: "#1565C0",
    rgb: "21, 101, 192",
    tailwind: "bg-[#1565C0]",
  },
  "The Downtown Paw": {
    name: "The Downtown Paw",
    hex: "#FF6B35",
    rgb: "255, 107, 53",
    tailwind: "bg-[#FF6B35]",
  },
  SEED: {
    name: "SEED",
    hex: "#2E7D32",
    rgb: "46, 125, 50",
    tailwind: "bg-[#2E7D32]",
  },
}

export function getClientColor(clientName: string): ClientColor {
  return (
    clientColors[clientName] || {
      name: "Default",
      hex: "#6B7280",
      rgb: "107, 116, 128",
      tailwind: "bg-gray-500",
    }
  )
}

export function getAllClientColors(): ClientColor[] {
  return Object.values(clientColors)
}
