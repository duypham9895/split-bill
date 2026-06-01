import type { Member } from "../../domain/types";

export function Avatar({ member }: { member?: Pick<Member, "id" | "name"> }) {
  const label = member?.name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return <span className="avatar">{label || "?"}</span>;
}
