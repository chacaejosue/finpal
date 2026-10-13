import { z } from "zod";

export const workspaceSchema = z.object({
  name: z.string().trim().min(1, "Ingresa un nombre").max(100),
  currencyCode: z.string().trim().length(3).toUpperCase(),
  timezone: z.string().trim().min(1).max(100),
});

export type WorkspaceInput = z.infer<typeof workspaceSchema>;
