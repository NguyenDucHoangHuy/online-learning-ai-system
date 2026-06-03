import axios from "axios";

const AI_URL =
  import.meta.env.VITE_AI_URL || `http://${window.location.hostname}:8000`;

const aiApi = axios.create({
  baseURL: AI_URL,
  timeout: 30000,
});

export interface StudentAttentionAnalysis {
  presence: "present" | "absent";
  status: "focused" | "unfocused" | "normal" | "absent";
  emotion: string;
  emotionLabel: string;
  emotionSource?: "emotion_model" | "deepface" | "mediapipe_rules";
  attentionLabel: string;
  attentionLevel?: "HIGH" | "MEDIUM" | "LOW";
  attentionSource?:
    | "rules"
    | "pose_rules"
    | "emotion_rules"
    | "engagement_model"
    | "rules_with_model_guard"
    | "rules_with_model_hint";
  attentionConfidence?: number | null;
  isFocused: boolean;
  confidence: number;
  reason: string;
  landmarkCount: number;
  headPose?: {
    yaw: number;
    pitch: number;
    roll: number;
    is_frontal: boolean;
  };
}

export const aiService = {
  detectEmotion: async (image: string) => {
    const response = await aiApi.post("/detect-emotion", { image });
    return response.data;
  },

  analyzeStudentFrame: async (payload: {
    image: string;
    studentId: string;
    sessionId: string;
  }): Promise<StudentAttentionAnalysis> => {
    const response = await aiApi.post<StudentAttentionAnalysis>(
      "/analyze-student-frame",
      payload,
    );
    return response.data;
  },
};
