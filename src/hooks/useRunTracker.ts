import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface RunPoint {
  lat: number;
  lng: number;
}

const EARTH_R = 6371000;

export const distanceM = (a: RunPoint, b: RunPoint) => {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_R * Math.asin(Math.sqrt(s));
};

interface Options {
  /** Distancia mínima recorrida antes de plantar la siguiente bandera. */
  claimEveryM?: number;
  /** Radio de cada territorio conquistado durante la carrera. */
  radiusM?: number;
  kind?: "coastal" | "urban" | "rural";
  onZoneChange?: () => void;
  onMessage?: (msg: string, ok: boolean) => void;
}

export const useRunTracker = ({
  claimEveryM = 180,
  radiusM = 150,
  kind = "coastal",
  onZoneChange,
  onMessage,
}: Options = {}) => {
  const [running, setRunning] = useState(false);
  const [path, setPath] = useState<RunPoint[]>([]);
  const [position, setPosition] = useState<RunPoint | null>(null);
  const [distance, setDistance] = useState(0);
  const [conquered, setConquered] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);

  const watchId = useRef<number | null>(null);
  const lastPoint = useRef<RunPoint | null>(null);
  const lastClaim = useRef<RunPoint | null>(null);
  const claiming = useRef(false);
  const counter = useRef(0);

  const claimAt = useCallback(
    async (p: RunPoint) => {
      if (claiming.current) return;
      claiming.current = true;
      try {
        counter.current += 1;
        const stamp = new Date().toLocaleDateString("es-CO", { day: "2-digit", month: "short" });
        const { data, error } = await supabase.rpc("claim_territory", {
          _lat: p.lat,
          _lng: p.lng,
          _name: `Ronda ${stamp} · tramo ${counter.current}`,
          _radius_m: radiusM,
          _kind: kind,
        });
        if (error) throw error;
        const r = data as { ok: boolean; message: string };
        if (r?.ok) {
          lastClaim.current = p;
          setConquered((c) => c + 1);
          onZoneChange?.();
          onMessage?.(r.message, true);
        } else {
          // Territorio ajeno más fuerte o ya tuyo: seguimos corriendo sin bloquear.
          lastClaim.current = p;
          onMessage?.(r?.message ?? "Tramo no conquistado.", false);
        }
      } catch {
        lastClaim.current = p;
      } finally {
        claiming.current = false;
      }
    },
    [radiusM, kind, onZoneChange, onMessage],
  );

  const stop = useCallback(() => {
    if (watchId.current !== null) {
      navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
    setRunning(false);
  }, []);

  const start = useCallback(() => {
    if (!("geolocation" in navigator)) {
      onMessage?.("Tu dispositivo no soporta GPS.", false);
      return;
    }
    setPath([]);
    setDistance(0);
    setConquered(0);
    setStartedAt(Date.now());
    lastPoint.current = null;
    lastClaim.current = null;
    counter.current = 0;
    setRunning(true);

    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        const p: RunPoint = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setPosition(p);

        const prev = lastPoint.current;
        if (prev) {
          const d = distanceM(prev, p);
          if (d < 5) return; // ruido de GPS
          setDistance((x) => x + d);
        }
        lastPoint.current = p;
        setPath((prevPath) => [...prevPath, p]);

        if (!lastClaim.current || distanceM(lastClaim.current, p) >= claimEveryM) {
          void claimAt(p);
        }
      },
      (err) => {
        onMessage?.(
          err.code === err.PERMISSION_DENIED
            ? "Permiso de ubicación denegado. Actívalo para correr."
            : "No se pudo seguir tu ubicación.",
          false,
        );
        stop();
      },
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 },
    );
  }, [claimAt, claimEveryM, onMessage, stop]);

  useEffect(() => () => {
    if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
  }, []);

  return { running, path, position, distance, conquered, startedAt, start, stop };
};
