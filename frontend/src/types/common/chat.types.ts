import { User } from "./user.types";

export interface ChatMessage {
  id: string;
  sessionId: string;
  userId: string;
  message: string;
  sentAt: string;

  user: Pick<User, "id" | "fullName" | "role">;
}
