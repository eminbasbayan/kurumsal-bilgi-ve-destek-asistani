import { z } from "zod";
import {
  MAX_CLOSE_REASON_LENGTH,
  MAX_NOTE_LENGTH,
  PRIORITIES,
  REQUEST_STATUSES,
} from "../../config/constants.js";

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

const expectedUpdatedAt = z
  .string({ error: "Güncelleme zamanı zorunludur." })
  .min(1, "Güncelleme zamanı zorunludur.");

export const assignRequestSchema = z.object(
  {
    assigneeId: z
      .number({ error: "Atanacak personel seçilmelidir." })
      .int("Atanacak personel seçilmelidir.")
      .positive("Atanacak personel seçilmelidir."),
    expectedUpdatedAt,
  },
  { error: "Atanacak personel seçilmelidir." },
);

export const statusChangeSchema = z
  .object({
    status: z.enum(REQUEST_STATUSES, { error: "Bilinmeyen talep durumu." }),
    reason: z
      .string({ error: "Gerekçe metin olmalıdır." })
      .trim()
      .max(MAX_CLOSE_REASON_LENGTH, `Gerekçe en fazla ${MAX_CLOSE_REASON_LENGTH} karakter olabilir.`)
      .optional(),
    expectedUpdatedAt,
  })
  .superRefine((value, context) => {
    if (value.status === "Kapatıldı" && !value.reason) {
      context.addIssue({ code: "custom", message: "Kapatma gerekçesi zorunludur." });
    }
  })
  .transform((value) => ({
    status: value.status,
    reason: value.reason ? value.reason : null,
    expectedUpdatedAt: value.expectedUpdatedAt,
  }));

export const noteSchema = z.object(
  {
    text: z
      .string({ error: "Not boş olamaz." })
      .trim()
      .min(1, "Not boş olamaz.")
      .max(MAX_NOTE_LENGTH, `Not en fazla ${MAX_NOTE_LENGTH} karakter olabilir.`),
  },
  { error: "Not boş olamaz." },
);
