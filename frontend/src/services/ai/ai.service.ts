import axios from "axios";
import { api } from "../../lib/axios";

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
  emotionSource?:
    | "emotion_cnn"
    | "emotion_model"
    | "deepface"
    | "mediapipe_rules"
    | "smile_landmark"
    | "mouth_open_landmark"
    | "eyes_closed_landmark"
    | "neutral_landmark"
    | "eye_state_cnn"
    | "eye_state_model"
    | "mediapipe_eye_rules"
    | `ensemble:${string}`;
  eyeState?: {
    label: "Closed" | "Open" | "no_yawn" | "yawn" | string;
    confidence: number;
    source: "eye_state_cnn" | "eye_state_model" | "mediapipe_eye_rules" | string;
    scores?: Record<string, number>;
  };
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
  faceBox?: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  landmarks?: Array<{
    x: number;
    y: number;
    z: number;
  }>;
  blendshapes?: Record<string, number>;
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
    includeLandmarks?: boolean;
  }): Promise<StudentAttentionAnalysis> => {
    const response = await aiApi.post<StudentAttentionAnalysis>(
      "/analyze-student-frame",
      payload,
    );
    return response.data;
  },

  analyzeStudentFrameViaBackend: async (payload: {
    image: string;
    sessionId: string;
    includeLandmarks?: boolean;
  }): Promise<StudentAttentionAnalysis> => {
    const response = await api.post<{
      analysis: StudentAttentionAnalysis;
    }>(`/emotions/sessions/${payload.sessionId}/analyze-frame`, {
      image: payload.image,
      includeLandmarks: payload.includeLandmarks,
    });

    return response.data.analysis;
  },
};
