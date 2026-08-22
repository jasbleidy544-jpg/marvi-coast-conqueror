import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/** Semillas de avatares generados (no requieren subir foto). */
export const AVATAR_SEEDS = [
  "Coral", "Tortuga", "Manglar", "Delfin", "Faro", "Brisa", "Arrecife", "Caracol",
];

export const generatedAvatar = (seed: string) =>
  `https://api.dicebear.com/9.x/adventurer/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,ffd5dc`;

const isRemote = (v: string) => v.startsWith("http://") || v.startsWith("https://");

/** Resuelve el avatar: URL pública directa o path privado del bucket `avatars`. */
export const useAvatarUrl = (value: string | null | undefined) =>
  useQuery({
    queryKey: ["avatar-url", value],
    enabled: !!value,
    staleTime: 1000 * 60 * 30,
    queryFn: async () => {
      if (!value) return null;
      if (isRemote(value)) return value;
      const { data, error } = await supabase.storage
        .from("avatars")
        .createSignedUrl(value, 60 * 60 * 24);
      if (error) return null;
      return data?.signedUrl ?? null;
    },
  }).data ?? (value && isRemote(value) ? value : null);

/** Sube la foto al bucket privado y devuelve el path a guardar en profiles.avatar_url */
export const uploadAvatar = async (userId: string, file: File) => {
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${userId}/avatar-${Date.now()}.${ext}`;
  const { error } = await supabase.storage.from("avatars").upload(path, file, {
    upsert: true,
    contentType: file.type || "image/jpeg",
  });
  if (error) throw error;
  return path;
};
