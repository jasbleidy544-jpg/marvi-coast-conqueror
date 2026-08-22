import { useAvatarUrl } from "@/lib/avatar";
import { cn } from "@/lib/utils";

export const GuardianAvatar = ({
  avatarUrl,
  name,
  className,
}: {
  avatarUrl: string | null | undefined;
  name: string | null | undefined;
  className?: string;
}) => {
  const url = useAvatarUrl(avatarUrl);
  const initials =
    name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "🌊";

  return (
    <div
      className={cn(
        "size-12 rounded-2xl bg-gradient-sea grid place-items-center overflow-hidden text-primary-foreground font-display font-bold shadow-soft",
        className,
      )}
    >
      {url ? (
        <img src={url} alt={`Avatar de ${name ?? "guardián"}`} className="size-full object-cover" loading="lazy" />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );
};
