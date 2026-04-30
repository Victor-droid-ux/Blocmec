import { UserRole } from "@/prisma/generated/enums";

export type UserSafe = {
  id: string;
  email: string | null;
  name: string | null;
  role: UserRole;
};

export type MeResponse = {
  user: UserSafe | null;
};

export type SignInResponse = { user: UserSafe };
