import type { ReactNode } from "react";
import { ReaderIcon } from "@radix-ui/react-icons";

export function EmptyState({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty">
      <ReaderIcon width="28" height="28" />
      <h3>{title}</h3>
      <p>{text}</p>
      {action}
    </div>
  );
}
