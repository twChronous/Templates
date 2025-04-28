import { z } from "zod";

export const loginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(6),
	rememberMe: z.boolean().optional(),
});

export const registerSchema = z.object({
	name: z.string().min(3).max(50),
	email: z.string().email(),
	password: z.string().min(6),
	twofaEnabled: z.boolean().optional().default(false), // Campo opcional para o 2FA
});
