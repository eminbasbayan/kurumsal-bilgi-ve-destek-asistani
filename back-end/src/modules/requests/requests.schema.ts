import { z } from "zod";
import {
  ATTACHMENT_MIME_TYPES,
  CATEGORIES,
  MAX_ASSISTANT_CONTEXT_LENGTH,
  MAX_ATTACHMENT_BYTES,
  MAX_DESCRIPTION_LENGTH,
  MAX_FILE_NAME_LENGTH,
  MAX_MESSAGE_LENGTH,
  MAX_SUBJECT_LENGTH,
  PRIORITIES,
  REQUEST_STATUSES,
  type Priority,
} from "../../config/constants.js";

const FILE_ERROR = "Dosyalar PDF, PNG veya JPG olmalı ve 5 MB sınırını aşmamalıdır.";
const REQUIRED_REQUEST = "Kategori, alt kategori, konu, açıklama ve öncelik zorunludur.";

const trimmed = z.preprocess(
  (value) => (typeof value === "string" ? value.trim() : ""),
  z.string(),
);

const attachmentSchema = z.object(
  {
    name: z
      .string({ error: "Ek bilgisi eksik." })
      .trim()
      .min(1, FILE_ERROR)
      .max(MAX_FILE_NAME_LENGTH, `Dosya adı en fazla ${MAX_FILE_NAME_LENGTH} karakter olabilir.`),
    mimeType: z.enum(ATTACHMENT_MIME_TYPES, { error: FILE_ERROR }),
    sizeBytes: z
      .number({ error: FILE_ERROR })
      .int(FILE_ERROR)
      .min(0, FILE_ERROR)
      .max(MAX_ATTACHMENT_BYTES, FILE_ERROR),
  },
  { error: "Ek bilgisi eksik." },
);

function issue(context: z.RefinementCtx, message: string) {
  context.addIssue({ code: "custom", message });
}

export const createRequestSchema = z
  .object(
    {
      category: trimmed,
      subcategory: trimmed,
      subject: trimmed,
      description: trimmed,
      priority: trimmed,
      attachments: z.unknown().optional(),
      assistantContext: z.unknown().optional(),
      clientRequestId: z.unknown().optional(),
    },
    { error: "Talep bilgileri eksik." },
  )
  .superRefine((value, context) => {
    if (!value.category || !value.subcategory || !value.subject || !value.description || !value.priority) {
      issue(context, REQUIRED_REQUEST);
      return;
    }
    if (!(value.category in CATEGORIES)) {
      issue(context, "Bilinmeyen kategori.");
      return;
    }
    if (!CATEGORIES[value.category]?.includes(value.subcategory)) {
      issue(context, "Alt kategori seçilen kategoriye ait değil.");
      return;
    }
    if (!PRIORITIES.includes(value.priority as Priority)) {
      issue(context, "Öncelik Düşük, Normal veya Yüksek olmalıdır.");
      return;
    }
    if (value.subject.length > MAX_SUBJECT_LENGTH) {
      issue(context, `Konu en fazla ${MAX_SUBJECT_LENGTH} karakter olabilir.`);
      return;
    }
    if (value.description.length > MAX_DESCRIPTION_LENGTH) {
      issue(context, `Açıklama en fazla ${MAX_DESCRIPTION_LENGTH} karakter olabilir.`);
      return;
    }
    const attachments = value.attachments === undefined || value.attachments === null ? [] : value.attachments;
    if (!Array.isArray(attachments)) {
      issue(context, "Ekler liste olmalıdır.");
      return;
    }
    const parsedAttachments = z.array(attachmentSchema).safeParse(attachments);
    if (!parsedAttachments.success) {
      issue(context, parsedAttachments.error.issues[0]?.message ?? FILE_ERROR);
      return;
    }
    if (typeof value.assistantContext === "string" && value.assistantContext.trim().length > MAX_ASSISTANT_CONTEXT_LENGTH) {
      issue(context, `Asistan bağlamı en fazla ${MAX_ASSISTANT_CONTEXT_LENGTH} karakter olabilir.`);
      return;
    }
    if (value.clientRequestId !== undefined && value.clientRequestId !== null) {
      if (typeof value.clientRequestId !== "string" || !value.clientRequestId.trim()) {
        issue(context, "clientRequestId metin olmalıdır.");
        return;
      }
      if (value.clientRequestId.trim().length > 100) {
        issue(context, "clientRequestId en fazla 100 karakter olabilir.");
      }
    }
  })
  .transform((value) => {
    const attachments = z.array(attachmentSchema).parse(
      value.attachments === undefined || value.attachments === null ? [] : value.attachments,
    );
    const context =
      typeof value.assistantContext === "string" && value.assistantContext.trim()
        ? value.assistantContext.trim()
        : null;
    return {
      category: value.category,
      subcategory: value.subcategory,
      subject: value.subject,
      description: value.description,
      priority: value.priority as Priority,
      attachments,
      assistantContext: context,
      clientRequestId:
        typeof value.clientRequestId === "string" ? value.clientRequestId.trim() : null,
    };
  });

export const requestMessageSchema = z.object(
  {
    text: z
      .string({ error: "Mesaj boş olamaz." })
      .trim()
      .min(1, "Mesaj boş olamaz.")
      .max(MAX_MESSAGE_LENGTH, `Mesaj en fazla ${MAX_MESSAGE_LENGTH} karakter olabilir.`),
  },
  { error: "Mesaj boş olamaz." },
);

export type CreateRequestInput = z.infer<typeof createRequestSchema>;

export const requestListFilterSchema = z.object({
  q: z.string().trim().optional(),
  status: z.enum(REQUEST_STATUSES, { error: "Bilinmeyen talep durumu." }).optional(),
  category: z
    .string()
    .trim()
    .optional()
    .refine((value) => value === undefined || value in CATEGORIES, "Bilinmeyen kategori."),
  scope: z
    .enum(["all", "open", "closed"], { error: "Kapsam all, open veya closed olmalıdır." })
    .optional(),
});
