import { z } from "zod";

export const signInSchema = z.object({
  email: z.email({ message: "Invalid email" }),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters" }),
  csrfToken: z.string().optional(),
});

export type SignInInput = z.infer<typeof signInSchema>;

export const signUpSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(2, { message: "Full name must be at least 2 characters" })
      .max(120, { message: "Full name is too long" }),
    companyName: z
      .string()
      .trim()
      .max(160, { message: "Company name is too long" })
      .optional()
      .or(z.literal("")),
    email: z.email({ message: "Invalid email" }),
    password: z
      .string()
      .min(8, { message: "Password must be at least 8 characters" }),
    confirmPassword: z.string().min(8),
  })
  .refine((vals) => vals.password === vals.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

export type SignUpInput = z.infer<typeof signUpSchema>;

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
  bio: z
    .string()
    .max(2000, { message: "Bio is too long" })
    .nullable()
    .optional(),
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

export const updateUserSettingsSchema = z.object({
  companyName: z
    .string()
    .trim()
    .max(255, { message: "Company name is too long" })
    .optional(),
  companyEmail: z
    .union([z.email({ message: "Invalid company email" }), z.literal("")])
    .optional(),
  companyWebsite: z
    .string()
    .trim()
    .max(1024, { message: "Website is too long" })
    .optional(),
  companyAddress: z
    .string()
    .trim()
    .max(2000, { message: "Address is too long" })
    .optional(),
  timezone: z.string().trim().max(100).optional(),
  language: z.string().trim().max(20).optional(),
  dateFormat: z.string().trim().max(20).optional(),
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  pushNotifications: z.boolean().optional(),
  twoFactorAuth: z.boolean().optional(),
  sessionTimeout: z.coerce
    .number()
    .int()
    .min(5, { message: "Session timeout must be at least 5 minutes" })
    .max(120, { message: "Session timeout must be at most 120 minutes" })
    .optional(),
  apiAccessEnabled: z.boolean().optional(),
});

export type UpdateUserSettingsInput = z.infer<typeof updateUserSettingsSchema>;
