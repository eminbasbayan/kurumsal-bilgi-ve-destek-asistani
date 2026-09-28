import { z } from "zod";
import { PRIORITIES, REQUEST_STATUSES } from "../../config/constants.js";

export const supportListFilterSchema = z.object({
  queue: z.enum(["team", "mine"], { error: "Kuyruk team veya mine olmalıdır." }).optional(),
  scope: z
    .enum(["all", "open", "closed"], { error: "Kapsam all, open veya closed olmalıdır." })
    .optional(),
  status: z.enum(REQUEST_STATUSES, { error: "Bilinmeyen talep durumu." }).optional(),
  priority: z.enum(PRIORITIES, { error: "Bilinmeyen öncelik." }).optional(),
  unassigned: z.literal("true", { error: "unassigned yalnızca true olabilir." }).optional(),
  q: z.string().trim().optional(),
});
