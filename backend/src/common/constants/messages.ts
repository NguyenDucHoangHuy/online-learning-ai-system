// src/common/constants.ts

export const MESSAGES = {
  // ================= AUTH =================
  LOGIN_SUCCESS: "Login successful",
  LOGOUT_SUCCESS: "Logout successful",
  REGISTER_SUCCESS: "Registration successful",

  INVALID_CREDENTIALS: "Invalid email or password",

  TOKEN_MISSING: "Access token is required",
  TOKEN_INVALID: "Invalid or expired token",

  UNAUTHORIZED: "Unauthorized",

  PASSWORD_CHANGED: "Password changed successfully",

  // ================= USERS =================
  USER_NOT_FOUND: "User not found",

  EMAIL_ALREADY_EXISTS: "Email already exists",

  PROFILE_UPDATED: "Profile updated successfully",

  // ================= CLASSES =================
  CLASS_NOT_FOUND: "Class not found",

  CLASS_CREATED: "Class created successfully",

  CLASS_UPDATED: "Class updated successfully",

  CLASS_DELETED: "Class deleted successfully",

  // ================= SESSIONS =================
  SESSION_NOT_FOUND: "Session not found",

  SESSION_CODE_INVALID: "Invalid session code",

  SESSION_NOT_ACTIVE: "Session is not active",

  SESSION_CREATED: "Session created successfully",

  SESSION_STARTED: "Session started successfully",

  SESSION_ENDED: "Session ended successfully",

  // ================= PARTICIPANTS =================
  ALREADY_JOINED: "Already joined this session",

  JOIN_REQUEST_SENT: "Join request sent, waiting for approval",

  JOIN_SUCCESS: "Joined session successfully",

  NOT_APPROVED: "You are not approved to join this session",

  PARTICIPANTS_FETCHED: "Participants fetched successfully",

  PARTICIPANT_APPROVED: "Participant approved successfully",

  PARTICIPANT_REJECTED: "Participant rejected successfully",

  LEFT_SESSION: "Left session successfully",

  PARTICIPANT_NOT_FOUND: "Participant not found",

  REQUEST_ALREADY_PENDING: "Your request is already pending approval",

  // ================= GENERAL =================
  SUCCESS: "Success",

  FORBIDDEN: "You do not have permission to perform this action",

  SOMETHING_WENT_WRONG: "Something went wrong",

  INTERNAL_SERVER_ERROR: "Internal server error",
} as const;
