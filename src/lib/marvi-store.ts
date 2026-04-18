import { create } from "zustand";
import {
  BeachZone,
  Guardian,
  MarviEvent,
  Sponsor,
  SEED_GUARDIANS,
  SEED_ZONES,
  SEED_EVENTS,
  SEED_SPONSORS,
  canConquer,
} from "./marvi-data";

interface MarviState {
  meId: string;
  guardians: Guardian[];
  zones: BeachZone[];
  events: MarviEvent[];
  sponsors: Sponsor[];

  // selectors
  me: () => Guardian;
  guardianOf: (zone: BeachZone) => Guardian | undefined;

  // actions
  conquerZone: (zoneId: string) => { ok: boolean; message: string };
  reportCleanup: (zoneId: string, kilos: number) => { ok: boolean; message: string };
  /** Simula registro diario (mantiene la racha de 7 días) */
  checkInZone: (zoneId: string) => { ok: boolean; message: string };
  adoptGuardian: (sponsorId: string, guardianId: string) => void;
}

export const useMarvi = create<MarviState>((set, get) => ({
  meId: "u-you",
  guardians: SEED_GUARDIANS,
  zones: SEED_ZONES,
  events: SEED_EVENTS,
  sponsors: SEED_SPONSORS,

  me: () => get().guardians.find((g) => g.id === get().meId)!,
  guardianOf: (zone) => get().guardians.find((g) => g.id === zone.guardianId),

  conquerZone: (zoneId) => {
    const state = get();
    const zone = state.zones.find((z) => z.id === zoneId);
    if (!zone) return { ok: false, message: "Zona no encontrada." };
    const me = state.me();
    const owner = state.guardianOf(zone);
    const verdict = canConquer(me, owner);
    if (!verdict.canTake) return { ok: false, message: verdict.reason };

    set({
      zones: state.zones.map((z) =>
        z.id === zoneId
          ? {
              ...z,
              guardianId: me.id,
              status: "vulnerable",
              streak: 1,
              conqueredWithTons: me.totalTons,
              lastVisit: new Date().toISOString(),
              hazardLevel: Math.max(20, z.hazardLevel - 30),
            }
          : z,
      ),
      guardians: state.guardians.map((g) => {
        if (g.id === me.id) return { ...g, zonesOwned: g.zonesOwned + 1 };
        if (owner && g.id === owner.id) return { ...g, zonesOwned: Math.max(0, g.zonesOwned - 1) };
        return g;
      }),
    });

    return {
      ok: true,
      message: owner
        ? `¡Conquistaste ${zone.name} a ${owner.name}! ${verdict.reason}`
        : `¡${zone.name} es tuya! Mantenla 7 días para protegerla.`,
    };
  },

  reportCleanup: (zoneId, kilos) => {
    if (kilos <= 0) return { ok: false, message: "Indica una cantidad válida en kilos." };
    const tons = kilos / 1000;
    const state = get();
    const zone = state.zones.find((z) => z.id === zoneId);
    if (!zone) return { ok: false, message: "Zona no encontrada." };
    const me = state.me();

    set({
      zones: state.zones.map((z) =>
        z.id === zoneId
          ? {
              ...z,
              totalTonsCollected: +(z.totalTonsCollected + tons).toFixed(3),
              hazardLevel: Math.max(0, z.hazardLevel - Math.min(20, kilos / 5)),
              lastVisit: new Date().toISOString(),
            }
          : z,
      ),
      guardians: state.guardians.map((g) =>
        g.id === me.id ? { ...g, totalTons: +(g.totalTons + tons).toFixed(3) } : g,
      ),
    });

    return { ok: true, message: `Registrados ${kilos} kg (${tons.toFixed(3)} t). ¡Tu poder de conquista creció!` };
  },

  checkInZone: (zoneId) => {
    const state = get();
    const zone = state.zones.find((z) => z.id === zoneId);
    if (!zone) return { ok: false, message: "Zona no encontrada." };
    const me = state.me();
    if (zone.guardianId !== me.id) return { ok: false, message: "Solo el guardián puede registrarse aquí." };

    const newStreak = Math.min(7, zone.streak + 1);
    const becameProtected = newStreak >= 7 && zone.status !== "protected";

    set({
      zones: state.zones.map((z) =>
        z.id === zoneId
          ? {
              ...z,
              streak: newStreak,
              status: newStreak >= 7 ? "protected" : "vulnerable",
              lastVisit: new Date().toISOString(),
            }
          : z,
      ),
    });

    return {
      ok: true,
      message: becameProtected
        ? `¡7 días seguidos! ${zone.name} está oficialmente PROTEGIDA.`
        : `Día ${newStreak}/7 registrado. ¡Sigue así!`,
    };
  },

  adoptGuardian: (sponsorId, guardianId) => {
    const state = get();
    const sponsor = state.sponsors.find((s) => s.id === sponsorId);
    if (!sponsor) return;
    set({
      sponsors: state.sponsors.map((s) =>
        s.id === sponsorId ? { ...s, adoptedGuardianId: guardianId } : s,
      ),
      guardians: state.guardians.map((g) =>
        g.id === guardianId ? { ...g, sponsor: sponsor.name } : g,
      ),
    });
  },
}));
