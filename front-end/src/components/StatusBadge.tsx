import { Badge } from "@radix-ui/themes";
import { statusClass } from "../app/navigation";
import type { RequestStatus } from "../types";

export function StatusBadge({ value }: { value: RequestStatus }) {
  return (
    <Badge className={`status ${statusClass(value)}`} radius="full">
      {value}
    </Badge>
  );
}
