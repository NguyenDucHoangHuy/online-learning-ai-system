export type EmotionType =
  | "HAPPY"
  | "SAD"
  | "ANGRY"
  | "NEUTRAL"
  | "SURPRISED"
  | "FEARFUL"
  | "DISGUSTED";

export type AttentionLevel = "HIGH" | "MEDIUM" | "LOW";

export interface EmotionLog {
  id: string;

  participantId: string;

  emotion: EmotionType;

  confidence: number;

  attentionLevel: AttentionLevel;

  recordedAt: string;
}
