import type { Zone } from "./marvi-types";

/** Días desde la última visita a la zona (999 si nunca se visitó). */
export const daysSinceVisit = (lastVisit: string | null) => {
  if (!lastVisit) return 999;
  return Math.floor((Date.now() - new Date(lastVisit).getTime()) / 86_400_000);
};

export const NEGLECT_DAYS = 3;

/** Zonas propias en riesgo de ser robadas por descuido. */
export const neglectedZones = (zones: Zone[] | undefined, userId: string | undefined) =>
  (zones ?? [])
    .filter((z) => userId && z.guardian_id === userId && daysSinceVisit(z.last_visit) >= NEGLECT_DAYS)
    .sort((a, b) => daysSinceVisit(b.last_visit) - daysSinceVisit(a.last_visit));
