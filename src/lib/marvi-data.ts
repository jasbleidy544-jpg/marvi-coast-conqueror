// MARVI — Domain types & seed data
// Pure logic & in-memory game state shared via Zustand store.

export type ZoneStatus = "critical" | "vulnerable" | "protected";

export interface Guardian {
  id: string;
  name: string;
  handle: string;
  totalTons: number;       // ★ regla de oro: el que más toneladas tiene, conquista
  zonesOwned: number;
  rank: number;
  badge: string;
  sponsor?: string;        // marca patrocinadora
  avatarSeed: string;
}

export interface BeachZone {
  id: string;
  name: string;
  meters: number;          // metros lineales de costa
  status: ZoneStatus;
  /** Position on the map canvas (% based) */
  x: number;
  y: number;
  guardianId?: string;
  /** Toneladas que el guardián recolectó al conquistar */
  conqueredWithTons?: number;
  /** Días consecutivos trabajados (0–7) */
  streak: number;
  /** ISO date of last visit */
  lastVisit?: string;
  totalTonsCollected: number;
  hazardLevel: number;     // 0–100
}

export interface MarviEvent {
  id: string;
  name: string;
  description: string;
  sponsor: string;
  prize: string;
  startsAt: string;
  endsAt: string;
  participants: number;
  status: "live" | "upcoming" | "ended";
}

export interface Sponsor {
  id: string;
  name: string;
  tagline: string;
  adoptedGuardianId?: string;
  color: string;
}

// ───────────── Seed (Santa Marta coast) ─────────────
export const SEED_GUARDIANS: Guardian[] = [
  { id: "u-you", name: "Tú", handle: "@operador", totalTons: 2.84, zonesOwned: 2, rank: 12, badge: "Defensor de la Bahía", avatarSeed: "you" },
  { id: "u-ana", name: "Ana Marina", handle: "@anamarina", totalTons: 12.4, zonesOwned: 5, rank: 1, badge: "Reina de la Costa", sponsor: "EcoPack Solutions", avatarSeed: "ana" },
  { id: "u-carlos", name: "Carlos Río", handle: "@carlosrio", totalTons: 10.1, zonesOwned: 4, rank: 2, badge: "Centinela del Coral", sponsor: "Agua Pura", avatarSeed: "carlos" },
  { id: "u-sofia", name: "Sofía Coral", handle: "@sofiacoral", totalTons: 8.6, zonesOwned: 3, rank: 3, badge: "Corazón Caribe", avatarSeed: "sofia" },
  { id: "u-diego", name: "Diego Manglar", handle: "@diegomanglar", totalTons: 6.2, zonesOwned: 2, rank: 4, badge: "Guardián Verde", avatarSeed: "diego" },
  { id: "u-luna", name: "Luna Tayrona", handle: "@lunatayrona", totalTons: 4.9, zonesOwned: 2, rank: 5, badge: "Hija del Mar", avatarSeed: "luna" },
];

export const SEED_ZONES: BeachZone[] = [
  { id: "z-bconcha", name: "Bahía Concha", meters: 320, status: "critical", x: 18, y: 24, streak: 0, totalTonsCollected: 0, hazardLevel: 88 },
  { id: "z-pgrande", name: "Playa Grande", meters: 180, status: "protected", x: 32, y: 44, guardianId: "u-you", conqueredWithTons: 2.0, streak: 7, totalTonsCollected: 1.4, hazardLevel: 12, lastVisit: new Date().toISOString() },
  { id: "z-tagasur", name: "Taganga Sur", meters: 240, status: "vulnerable", x: 48, y: 32, guardianId: "u-luna", conqueredWithTons: 4.9, streak: 3, totalTonsCollected: 0.8, hazardLevel: 52 },
  { id: "z-rodadero", name: "El Rodadero", meters: 600, status: "critical", x: 62, y: 58, streak: 0, totalTonsCollected: 0, hazardLevel: 95 },
  { id: "z-pblanca", name: "Playa Blanca", meters: 280, status: "protected", x: 76, y: 22, guardianId: "u-ana", conqueredWithTons: 12.4, streak: 6, totalTonsCollected: 3.1, hazardLevel: 18, lastVisit: new Date().toISOString() },
  { id: "z-pcristal", name: "Playa Cristal", meters: 210, status: "protected", x: 84, y: 70, guardianId: "u-carlos", conqueredWithTons: 10.1, streak: 7, totalTonsCollected: 2.6, hazardLevel: 15, lastVisit: new Date().toISOString() },
  { id: "z-cabosj", name: "Cabo San Juan", meters: 140, status: "vulnerable", x: 24, y: 72, guardianId: "u-diego", conqueredWithTons: 6.2, streak: 2, totalTonsCollected: 0.5, hazardLevel: 60 },
  { id: "z-pdormida", name: "Playa Dormida", meters: 360, status: "critical", x: 52, y: 84, streak: 0, totalTonsCollected: 0, hazardLevel: 78 },
  { id: "z-loscoco", name: "Los Cocos", meters: 200, status: "protected", x: 68, y: 12, guardianId: "u-sofia", conqueredWithTons: 8.6, streak: 5, totalTonsCollected: 2.2, hazardLevel: 22 },
];

export const SEED_EVENTS: MarviEvent[] = [
  {
    id: "ev-1",
    name: "Reto Limpia-Playa Tayrona",
    description: "Conquista la mayor cantidad de zonas posibles en 72 horas. ¡Patrocinado por Eco-Sud!",
    sponsor: "Eco-Sud",
    prize: "$1,200 USD + kit de buceo",
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 1000 * 60 * 60 * 72).toISOString(),
    participants: 482,
    status: "live",
  },
  {
    id: "ev-2",
    name: "Gran Slam de los Arrecifes",
    description: "Torneo mensual: el guardián que recolecte más toneladas se lleva el oro.",
    sponsor: "Agua Pura",
    prize: "$2,500 USD",
    startsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
    endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 37).toISOString(),
    participants: 128,
    status: "upcoming",
  },
  {
    id: "ev-3",
    name: "Maratón Microplástico",
    description: "Sprint relámpago contra los microplásticos en Bahía Concha.",
    sponsor: "Marina-X",
    prize: "$450 USD",
    startsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString(),
    endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 4).toISOString(),
    participants: 64,
    status: "upcoming",
  },
];

export const SEED_SPONSORS: Sponsor[] = [
  { id: "sp-eco", name: "EcoPack Solutions", tagline: "Bolsas compostables que cuidan el mar", adoptedGuardianId: "u-ana", color: "eco" },
  { id: "sp-agua", name: "Agua Pura", tagline: "Hidratación responsable", adoptedGuardianId: "u-carlos", color: "sea" },
  { id: "sp-marina", name: "Marina-X", tagline: "Tecnología náutica", color: "primary" },
  { id: "sp-sud", name: "Eco-Sud", tagline: "Turismo regenerativo", color: "gold" },
];

// ───────────── Game logic ─────────────

/**
 * REGLA DE ORO: gana la zona quien tenga MÁS TONELADAS totales.
 * Devuelve si el challenger puede conquistar la zona del owner.
 */
export function canConquer(
  challenger: Guardian,
  owner: Guardian | undefined,
): { canTake: boolean; reason: string } {
  if (!owner) return { canTake: true, reason: "Zona sin guardián — conquista libre." };
  if (challenger.id === owner.id) return { canTake: false, reason: "Ya eres el guardián de esta zona." };
  if (challenger.totalTons > owner.totalTons) {
    return {
      canTake: true,
      reason: `Tienes ${challenger.totalTons.toFixed(2)} t vs ${owner.totalTons.toFixed(2)} t. La regla de oro te otorga el territorio.`,
    };
  }
  return {
    canTake: false,
    reason: `Necesitas superar las ${owner.totalTons.toFixed(2)} t del guardián. Te faltan ${(owner.totalTons - challenger.totalTons).toFixed(2)} t.`,
  };
}

export function statusColor(s: ZoneStatus) {
  return s === "critical" ? "coral" : s === "vulnerable" ? "gold" : "eco";
}

export function statusLabel(s: ZoneStatus) {
  return s === "critical" ? "Crítica" : s === "vulnerable" ? "Vulnerable" : "Protegida";
}
