import { z } from "zod";
import { MAX_QUESTION_LENGTH } from "../../config/constants.js";

export const questionSchema = z.object({
  text: z
    .string({ error: "Soru boş olamaz." })
    .trim()
    .min(1, "Soru boş olamaz.")
    .max(MAX_QUESTION_LENGTH, `Soru en fazla ${MAX_QUESTION_LENGTH} karakter olabilir.`),
});

export const conversationSchema = z.preprocess(
  (value) => (value && typeof value === "object" ? value : {}),
  z.object({
    title: z.preprocess(
      (value) => (typeof value === "string" ? value.trim() : undefined),
      z.string().optional(),
    ),
  }),
);

export const feedbackSchema = z.object({
  helpful: z.boolean({ error: "Değerlendirme true veya false olmalıdır." }),
});
