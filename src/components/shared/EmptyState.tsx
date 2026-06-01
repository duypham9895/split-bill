import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="emptyState">
      {icon}
      <strong>{title}</strong>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}
