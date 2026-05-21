import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../../config/env";

interface TokenPayload {
  id: string;
  role: string;
}

export const jwtUtil = {
  // 1. Tạo Access Token (Ngắn hạn)
  generateAccessToken: (payload: TokenPayload): string => {
    const options: SignOptions = {
      expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"],
    };
    return jwt.sign(payload, env.JWT_SECRET, options);
  },

  // 2. Tạo mã mã hóa Refresh Token dạng chuỗi ngẫu nhiên siêu bảo mật (Entropy cao)
  generateRawRefreshToken: (): string => {
    return crypto.randomBytes(40).toString("hex");
  },

  // 3. Hàm băm SHA-256 bảo mật để lưu vào DB hoặc đối chiếu khi nhận token từ client
  hashToken: (rawToken: string): string => {
    return crypto.createHash("sha256").update(rawToken).digest("hex");
  },

  // 4. Xác thực Access Token gửi kèm trong Header
  verifyAccessToken: (token: string): TokenPayload => {
    return jwt.verify(token, env.JWT_SECRET) as TokenPayload;
  },
};
