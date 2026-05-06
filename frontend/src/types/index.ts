export type Role = "student" | "teacher";

export interface User {
  id: string;
  full_name: string;
  email: string;
  role: Role;
  created_at: string;
}

export interface Class {
  id: string;
  name: string;
  description: string;
  teacher_id: string;
  created_at: string;
}

export interface ClassSession {
  id: string;
  class_id: string;
  title: string;
  session_code: string;
  status: "waiting" | "ongoing" | "ended";
  require_approval: boolean;
  started_at: string | null;
  ended_at: string | null;
}

export type EmotionType =
  | "happy"
  | "neutral"
  | "sad"
  | "tired"
  | "sleepy"
  | "angry";
export type AttentionLevel = "focused" | "normal" | "distracted";

export interface EmotionLog {
  id: string;
  participant_id: string;
  emotion: EmotionType;
  confidence: number;
  attention_level: AttentionLevel;
  recorded_at: string;
}

export interface Participant {
  id: string;
  session_id: string;
  user_id: string;
  joined_at: string;
  left_at: string | null;
  join_status: "waiting" | "accepted" | "rejected";
}

export interface ChatMessage {
  id: string;
  session_id: string;
  user_id: string;
  user_name: string;
  message: string;
  sent_at: string;
}
