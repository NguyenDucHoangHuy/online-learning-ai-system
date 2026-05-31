export type Role = "STUDENT" | "TEACHER";

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: Role;
}
