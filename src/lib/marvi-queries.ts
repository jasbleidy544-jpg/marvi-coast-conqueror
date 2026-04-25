import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Zone, Profile } from "./marvi-types";

// ============ QUERIES ============

export const useZones = () =>
  useQuery({
    queryKey: ["zones"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("zones")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as Zone[];
    },
  });

export const useGuardians = () =>
  useQuery({
    queryKey: ["guardians"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("total_tons", { ascending: false });
      if (error) throw error;
      return data as Profile[];
    },
  });

export const useMyProfile = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return data as Profile | null;
    },
  });
};

export interface AdoptionWithProfiles {
  id: string;
  sponsor_id: string;
  guardian_id: string;
  message: string | null;
  sponsor: Profile | null;
  guardian: Profile | null;
}

export const useSponsorAdoptions = () =>
  useQuery({
    queryKey: ["adoptions"],
    queryFn: async (): Promise<AdoptionWithProfiles[]> => {
      const { data: rows, error } = await supabase
        .from("sponsor_adoptions")
        .select("id, sponsor_id, guardian_id, message");
      if (error) throw error;
      if (!rows?.length) return [];

      const ids = Array.from(new Set(rows.flatMap((r) => [r.sponsor_id, r.guardian_id])));
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("id", ids);
      const map = new Map((profiles ?? []).map((p) => [p.id, p as Profile]));

      return rows.map((r) => ({
        ...r,
        sponsor: map.get(r.sponsor_id) ?? null,
        guardian: map.get(r.guardian_id) ?? null,
      }));
    },
  });

// ============ MUTATIONS ============

export const useConquerZone = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (zoneId: string) => {
      const { data, error } = await supabase.rpc("conquer_zone", { _zone_id: zoneId });
      if (error) throw error;
      return data as { ok: boolean; message: string };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["zones"] });
      qc.invalidateQueries({ queryKey: ["guardians"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};

export const useReportCleanup = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      zoneId: string;
      kilos: number;
      notes?: string;
      photoUrl?: string;
    }) => {
      const { data, error } = await supabase.rpc("report_cleanup", {
        _zone_id: vars.zoneId,
        _kilos: vars.kilos,
        _notes: vars.notes ?? null,
        _photo_url: vars.photoUrl ?? null,
      });
      if (error) throw error;
      return data as { ok: boolean; message: string };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["zones"] });
      qc.invalidateQueries({ queryKey: ["guardians"] });
      qc.invalidateQueries({ queryKey: ["profile"] });
    },
  });
};

export const useCheckIn = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (zoneId: string) => {
      const { data, error } = await supabase.rpc("check_in_zone", { _zone_id: zoneId });
      if (error) throw error;
      return data as { ok: boolean; message: string };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["zones"] });
    },
  });
};

export const useAdoptGuardian = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (guardianId: string) => {
      if (!user) throw new Error("Inicia sesión");
      const { error } = await supabase
        .from("sponsor_adoptions")
        .insert({ sponsor_id: user.id, guardian_id: guardianId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["adoptions"] }),
  });
};

export const useUploadReportPhoto = () => {
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error("Inicia sesión");
      const path = `${user.id}/${Date.now()}-${file.name}`;
      const { error } = await supabase.storage.from("reports").upload(path, file);
      if (error) throw error;
      // Signed URL valid for 1 year
      const { data: signed } = await supabase.storage
        .from("reports")
        .createSignedUrl(path, 60 * 60 * 24 * 365);
      return signed?.signedUrl ?? null;
    },
  });
};
