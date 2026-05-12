export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const MESSAGES = {
  // Auth
  LOGIN_SUCCESS: "Login successful",
  LOGOUT_SUCCESS: "Logout successful",
  REGISTER_SUCCESS: "Registration successful",
  INVALID_CREDENTIALS: "Invalid email or password",
  TOKEN_MISSING: "Access token is required",
  TOKEN_INVALID: "Invalid or expired token",
  UNAUTHORIZED: "Unauthorized",

  // User
  USER_NOT_FOUND: "User not found",
  EMAIL_ALREADY_EXISTS: "Email already exists",

  // Class
  CLASS_NOT_FOUND: "Class not found",
  CLASS_CREATED: "Class created successfully",
  CLASS_UPDATED: "Class updated successfully",
  CLASS_DELETED: "Class deleted successfully",

  // Session
  SESSION_NOT_FOUND: "Session not found",
  SESSION_CODE_INVALID: "Invalid session code",
  SESSION_NOT_ACTIVE: "Session is not active",
  SESSION_CREATED: "Session created successfully",
  SESSION_STARTED: "Session started successfully",
  SESSION_ENDED: "Session ended successfully",

  // Participant
  ALREADY_JOINED: "Already joined this session",
  JOIN_REQUEST_SENT: "Join request sent, waiting for approval",
  JOIN_SUCCESS: "Joined session successfully",
  NOT_APPROVED: "You are not approved to join this session",

  // General
  SUCCESS: "Success",
  SOMETHING_WENT_WRONG: "Something went wrong",
  FORBIDDEN: "You do not have permission to perform this action",
} as const;
