import { api } from "../../lib/axios";
import {
  ClassesResponse,
  ClassResponse,
  CreateClassPayload,
} from "../../types/api";

export const classesService = {
  getClasses: async (): Promise<ClassesResponse> => {
    return api.get("/classes");
  },

  getClassById: async (classId: string): Promise<ClassResponse> => {
    return api.get(`/classes/${classId}`);
  },

  createClass: async (payload: CreateClassPayload): Promise<ClassResponse> => {
    return api.post("/classes", payload);
  },
};
