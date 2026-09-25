import { z } from "zod";

const required = "E-posta ve parola zorunludur.";

export const loginSchema = z.object(
  {
    email: z.string({ error: required }).trim().min(1, required).toLowerCase(),
    password: z.string({ error: required }).trim().min(1, required),
  },
  { error: required },
);
