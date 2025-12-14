import { z } from "zod";

export const createApiKeySchema = z.object({
  name: z
    .string()
    .min(3, { message: "O nome deve ter pelo menos 3 caracteres." })
    .max(50, { message: "O nome deve ter no máximo 50 caracteres." }),
});

export type CreateApiKeySchema = z.infer<typeof createApiKeySchema>;
