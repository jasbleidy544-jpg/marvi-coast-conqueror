// Domain types for MARVI - mapped from Supabase rows.
export type ZoneStatus = "critical" | "vulnerable" | "protected";
export type ZoneKind = "coastal" | "urban" | "rural";

export interface Zone {
  id: string;
  name: string;
  kind: ZoneKind;
  meters: number;
  lat: number;
  lng: number;
  status: ZoneStatus;
  guardian_id: string | null;
  conquered_with_tons: number | null;
  streak: number;
  last_visit: string | null;
  total_tons_collected: number;
  hazard_level: number;
  description: string | null;
  radius_m: number;
}

export interface Profile {
  id: string;
  display_name: string;
  handle: string | null;
  badge: string | null;
  avatar_url: string | null;
  total_tons: number;
  zones_owned: number;
  brand_name: string | null;
  brand_tagline: string | null;
}

export const statusColor = (s: ZoneStatus) =>
  s === "critical" ? "coral" : s === "vulnerable" ? "gold" : "eco";

export const statusLabel = (s: ZoneStatus) =>
  s === "critical" ? "Crítica" : s === "vulnerable" ? "Vulnerable" : "Protegida";

export const statusHex = (s: ZoneStatus) =>
  s === "critical" ? "#f43f5e" : s === "vulnerable" ? "#f5b301" : "#22c55e";

export function canConquer(
  myTons: number,
  ownerTons: number | null,
  ownerName: string | null,
  isMine: boolean,
): { canTake: boolean; reason: string } {
  if (isMine) return { canTake: false, reason: "Ya eres el guardián de esta zona." };
  if (ownerTons === null) return { canTake: true, reason: "Zona sin guardián — conquista libre." };
  if (myTons > ownerTons) {
    return {
      canTake: true,
      reason: `Tienes ${myTons.toFixed(2)} t vs ${ownerTons.toFixed(2)} t. La regla de oro te otorga el territorio.`,
    };
  }
  return {
    canTake: false,
    reason: `Necesitas superar las ${ownerTons.toFixed(2)} t de ${ownerName ?? "el guardián"}. Te faltan ${(ownerTons - myTons).toFixed(2)} t.`,
  };
}
