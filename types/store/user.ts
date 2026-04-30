import { UserRole } from "@/prisma/generated/enums";

export interface User {
  id: string | number;
  name: string | null;
  email: string;
  role?: UserRole;
  api_credits?: number;
  subscription_plan?: string | null;
  created_at?: string;
  updated_at?: string;
  // Add known fields here as your schema grows rather than using [key: string]: any
}
