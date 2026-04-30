import { z } from "zod";

export const signInSchema = z.object({
  email: z.email({ message: "Invalid email" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  csrfToken: z.string().optional(),
});

export type SignInInput = z.infer<typeof signInSchema>;

export const updateProfileSchema = z.object({
  name: z
    .string()
    .min(1, { message: "Name must not be empty" })
    .max(255, { message: "Name is too long" })
    .optional(),
  email: z.email({ message: "Invalid email" }).optional(),
  role: z.string().max(100, { message: "Role is too long" }).optional(),
  phone: z
    .string()
    .max(50, { message: "Phone number is too long" })
    .nullable()
    .optional(),
  location: z
    .string()
    .max(255, { message: "Location is too long" })
    .nullable()
    .optional(),
  department: z
    .string()
    .max(255, { message: "Department is too long" })
    .nullable()
    .optional(),
  bio: z.string().max(2000, { message: "Bio is too long" }).nullable().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

export const publicProfileSchema = z.object({
  id: z.uuid(),
  email: z.email(),
  name: z.string().nullable(),
  role: z.string(),
  phone: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  department: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  subscription_plan: z.string().optional(),
  api_credits: z.number().int().optional(),
  created_at: z.string().or(z.date()), // server may return ISO string
  updated_at: z.string().or(z.date()).optional(),
});

export type PublicProfile = z.infer<typeof publicProfileSchema>;
