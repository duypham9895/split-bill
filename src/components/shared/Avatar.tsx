import type { Member } from "../../domain/types";

const COLORS = ["#087f7b", "#2563eb", "#7c3aed", "#db2777", "#ea580c", "#059669"];

export function Avatar({ member }: { member?: Pick<Member, "id" | "name"> & { payment?: { qrImageDataUrl?: string } } }) {
  const name = member?.name ?? "";
  const image = member?.payment?.qrImageDataUrl;
  const initials = name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const colorIndex = name.split("").reduce((sum, c) => sum + c.charCodeAt(0), 0) % COLORS.length;

  return (
    <div
      className="avatar"
      style={{
        background: image ? "transparent" : COLORS[colorIndex],
        color: image ? "inherit" : "white",
      }}
    >
      {image ? (
        <img src={image} alt={name} />
      ) : (
        <span>{initials || "?"}</span>
      )}
    </div>
  );
}
