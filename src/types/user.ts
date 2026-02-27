// TODO: Define User type based on database schema
export type UserRole = "user" | "admin";

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile extends User {
  phone?: string;
  address?: string;
}
